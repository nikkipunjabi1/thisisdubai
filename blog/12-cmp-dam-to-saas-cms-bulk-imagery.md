---
title: "From CMP/DAM to Optimizely SaaS CMS: a bulk imagery pipeline (source → upload → attach)"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, cmp, dam, optimizely-graph, nextjs, automation, digital-asset-management]
---

> **Draft for your review.** Edit the voice/details freely before publishing. A LinkedIn variant
> can be spun off from the intro + the two gotcha boxes.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and **royalty-free assets only** (Unsplash / Pexels), credited._

## What I set out to do

The demo had scaled up to **150 content items** — 101 points of interest, 20 events, 19
neighbourhoods, 10 articles — and roughly **ten of them had a photo**. Every other card and hero was
a monogram placeholder. Attaching 150 images by hand in the CMS UI (find the item, open the media
picker, upload, publish, repeat) is not a task a human should do twice.

So I wanted a **repeatable pipeline**: point it at the content, and every item ends up with a
relevant, correctly-licensed image — attached and published — with attribution recorded. Here's the
whole thing, including the bug that silently stranded 20 images as unpublished drafts while reporting
success.

## The mental model: three stages, and only two are automatable the way you'd guess

An image on a SaaS CMS content item is the end of a chain:

```
SOURCE (find a licensed photo)  →  UPLOAD (put the binary in the DAM)  →  ATTACH (point the CMS field at it)
```

The trap is assuming the CMS Management API (CMA) does the whole thing. It doesn't:

| Stage | Who does it | Notes |
|---|---|---|
| **Source** | Unsplash / Pexels API | Free keys. Search terms derive from each item's name + tags. |
| **Upload** the binary | **CMP (the DAM)** — *not* the CMA | The CMA's media endpoint is **GET-only** (`put?: never; post?: never` in its OpenAPI). You cannot create an image binary through it. CMP can, via a 3-step presigned upload. |
| **Attach** to a content item | CMA property write | Just a string: `cms://content/DamImageSource/<CMP_ASSET_ID>`. |

That middle row is the whole insight. **Optimizely CMP (the Content Marketing Platform / DAM) is a
separate product with its own API and its own OAuth** — the CMS CLI credentials are not valid for it
(nor for Graph). Once you accept that binaries live in CMP and the CMS only ever holds a *reference*,
the pipeline falls out cleanly.

## Stage 1 — Source (name + tags → a landscape photo)

Each item already carries a name and taxonomy tags, which is all a search needs. `Burj Khalifa`
+ tags `[landmarks, views, architecture]` → query `"Burj Khalifa Dubai"`. Unsplash first (nice
editorial travel shots, but a **50 requests/hour** demo tier), Pexels as fallback (higher volume).
Both are royalty-free.

Two things worth building in from the start:

- **De-duplicate.** Without it, two items that both search well for "Dubai skyline" get the *same*
  photo. Keep a `Set` of chosen photo IDs and skip ones already used this run.
- **Bias away from people** — but know its limit. The licence permits people; my own taste rule was
  "no prominent identifiable faces." I can't see the photo, only its caption, so I skip candidates
  whose caption names a person. This is imperfect by construction: a playground shot captioned
  "colorful outdoor play area" sailed through with a small child in frame. Caption filtering is a
  bias, not a guarantee — a human eyeball pass on the dry-run table is still the real gate.

## Stage 2 — Upload to CMP (the part the CMA can't do)

CMP upload is **three calls**, and it's a presigned **POST** to Google Cloud Storage (not a PUT):

```js
// 1) Ask CMP for a presigned upload target
GET /v3/upload-url?file_name=burj-khalifa-1.jpg&content_type=image/jpeg
// → { url, upload_meta_fields: { key, policy, "Content-Type", x-amz-algorithm, x-amz-credential, x-amz-date, x-amz-signature } }

// 2) POST the binary to GCS as multipart/form-data:
//    every upload_meta_fields entry as a form field FIRST, then the file field LAST.
const form = new FormData();
for (const [k, v] of Object.entries(upload_meta_fields)) form.append(k, v);
form.append('file', new Blob([bytes], { type: 'image/jpeg' }), 'burj-khalifa-1.jpg');
await fetch(url, { method: 'POST', body: form });   // 204 on success

// 3) Register the uploaded object as a CMP asset
POST /v3/assets { key: upload_meta_fields.key, title: 'burj-khalifa-1.jpg', folder_id }
// → { id, ... }   ← this id IS the DamImageSource key
```

The **join key is the folder**, not the filename. My attach step (stage 3) matches a content item to
a DAM asset by comparing the item's display name to the asset's **folder leaf**. So I upload each
item's photo into a CMP folder named after the item (`This is Dubai / Places to Visit / Burj Khalifa`)
— which mirrors the seed data, so it can't drift.

### 🧩 Gotcha 1 — a GET to CMP with `Content-Type: application/json` returns 400

Every `GET` I sent with the JSON content-type header came back:

> `The browser (or proxy) sent a request that this server could not understand.`

A bodyless GET must not declare a JSON body. Send **`Authorization` only** on GETs; add
`Content-Type: application/json` only when there's actually a JSON body (the token call, `POST
/v3/assets`). Obvious in hindsight, 20 minutes of "but the token works?!" in practice.

## Stage 3 — Attach (a one-line property write) … and the bug that ate 20 images

Attaching is genuinely trivial — write a reference into the field and publish a new version:

```jsonc
// PointOfInterest / Event — a list          // Area / Article — a single reference
"images":    { "value": ["cms://content/DamImageSource/<id>"] }
"heroImage": { "value":  "cms://content/DamImageSource/<id>"  }
```

The CMA is read-**merge**-write: you POST a *new version* carrying the existing properties plus your
image field, then publish that version. My first run reported a clean **"133 filled, 0 failed"** — and
yet Graph showed 20 items still image-less. Not propagation lag: the CMA's **published** version genuinely
lacked the image, while a **draft** version had it.

### 🧩 Gotcha 2 — "publish the latest version" is not "publish `items[0]`"

The buggy sequence was: create the new version → re-list versions → publish `items[0].version`.

The assumption `items[0]` = newest is false. For any item that already had an **unrelated draft**, the
version list didn't come back newest-first — `items[0]` could be the *already-published* version. So
the publish call ran against an already-published version, returned **200 (a no-op)**, and my freshly
written image sat forever as an unpublished draft. The 20 casualties were exactly the items with a
pre-existing extra draft. "0 failed" was true and useless.

The fix is to publish a **deterministic** target. Version numbers are monotonic, so the version you
just created is always the maximum:

```js
const created = await cma('POST', `/content/${key}/versions`, body);
const list = (await cma('GET', `/content/${key}/versions`)).json.items;
const v = created.json?.version ?? Math.max(...list.map((x) => Number(x.version)));
await cma('POST', `/content/${key}/versions/${v}:publish`, {});   // publishes the write, every time
```

A clean re-run then filled exactly the 20 stragglers, skipped the 133 already done (idempotent), and a
final pass reported **0 to fill** — nothing stranded.

### 🧩 Gotcha 3 — an unset reference is *truthy*

Deciding whether a field is already filled (so a re-run skips it), the naive check `Boolean(field)`
marks everything filled. An **unset** content reference doesn't come back `null` from Graph — it's
`{ key: null, url: { default: null } }`, a truthy object. Only a non-null **`key`** means filled:

```js
const isFilled = (v, multiple) => multiple ? (v ?? []).some((x) => x?.key) : Boolean(v?.key);
```

This one had also been quietly hiding every blank "Social share image" until I checked `key`.

## Result

`0 → 150` items imaged. Every point of interest, event, neighbourhood and article now has its own
photo, attached and published, rendering on listings and detail pages (served from CMP through
Next.js's image optimizer), with **150 photographer credits** recorded to an auto-generated
attribution table. Two reusable scripts:

- `source-images.mjs` — source + upload (dry-run pick table by default; `--apply`, `--type`, `--force`,
  `--limit`).
- `attach-assets.mjs` — match + attach + publish (dry-run by default; idempotent; `--type`, `--force`).

The dry-run-first design mattered more than any single line of code: it turned "did the automation put
something wrong on 150 live pages?" into a table I could read before anything was written.

## Links

- Repo: _(this project)_
- Related docs: `ASSETS.md` (sourcing sheet + attribution + what's automatable), `docs/CONTENT-ARCHITECTURE.md`
- Companion posts: **#15** articles-as-blocks, **#14** the listing engine, **#06** semantic search
