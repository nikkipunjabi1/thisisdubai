---
title: "From CMP/DAM to Optimizely SaaS CMS: a Bulk Imagery Pipeline (source → upload → attach)"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, cmp, dam, optimizely-graph, headless, automation, digital-asset-management]
---

> **Draft for review.** Screenshot placeholders are marked 📷, so swap in real captures from your own
> Optimizely SaaS / CMP instance before publishing.

## The real-world scenario

Picture a site that has scaled to a few hundred content items, a mix of listing entries, events,
sections, and articles, and only a handful of them have a photo. Every other card and hero is a
monogram placeholder. Attaching hundreds of images by hand in the CMS UI (find the item, open the media
picker, upload, publish, repeat) is not a task any human should do twice.

So the goal is a **repeatable pipeline**: point it at the content, and every item ends up with a
relevant, correctly-licensed image, attached and published, with attribution recorded. This post is
that pipeline, including the bug that silently stranded a batch of images as unpublished drafts while
cheerfully reporting success.

## Why this is trickier than it looks on Optimizely SaaS

An image on a SaaS CMS content item is the end of a three-link chain:

```
SOURCE (find a licensed photo)  →  UPLOAD (put the binary in the DAM)  →  ATTACH (point the CMS field at it)
```

The trap almost everyone falls into is assuming the CMS Management API (CMA) does the whole thing. It
doesn't, and the reason is the single most important thing to understand about imagery on this
platform:

| Stage | Who does it | Notes |
|---|---|---|
| **Source** | An external stock/image API | Search terms derive from each item's name and taxonomy tags. |
| **Upload** the binary | **CMP (the DAM)**, *not* the CMA | The CMA's media endpoint is effectively read-only for binaries: you cannot create an image binary through it. CMP can, via a presigned upload. |
| **Attach** to a content item | CMA property write | Just a reference string pointing at the CMP asset. |

That middle row is the whole insight. **Optimizely CMP (the Content Marketing Platform / DAM) is a
separate product with its own API and its own OAuth**: your CMS CLI credentials are not valid for it
(nor for Graph). Once you accept that binaries live in CMP and the CMS only ever holds a *reference* to
them, the entire pipeline falls out cleanly.

📷 **[Screenshot: the media/asset picker on an Optimizely SaaS content item, showing an image reference field waiting to be filled.]**

## Stage 1: source, turning a name and some tags into a photo

Each content item already carries a name and taxonomy tags, which is all a search needs. An item called
"Riverside Market" tagged `[food, outdoor, landmark]` becomes a sensible image query with no manual
effort. Use a royalty-free source with an API; if it has a low rate limit, keep a higher-volume source
as a fallback.

Two things are worth building in from the very start:

- **De-duplicate.** Without it, two items that both search well for the same term get the *identical*
  photo. Keep a running set of chosen photo IDs and skip any already used in this run.
- **Bias away from prominent faces, but know the limit.** I can't see the candidate photos, only their
  captions, so the best I can do is skip candidates whose caption names a person. This is imperfect by
  construction: a shot captioned "colorful outdoor play area" once sailed straight through with a child
  in frame. **Caption filtering is a bias, not a guarantee**, and a human eyeball pass over the dry-run
  table remains the real gate.

That dry-run table, incidentally, is the most important design decision in the whole project. More on
that at the end.

## Stage 2: upload to CMP, the part the CMA can't do

This is the stage the CMA can't touch, and it's a **presigned upload** rather than a simple file POST
to the CMS. Conceptually it's three steps:

1. **Ask CMP for a presigned upload target** for a given filename and content type. CMP hands back a
   URL plus a bundle of required form fields (a key, a policy, and a set of signature fields).
2. **POST the binary to that target as multipart form data.** The order matters: every one of those
   returned form fields goes in *first*, and the file field goes *last*. Get the order wrong and the
   upload is rejected.
3. **Register the uploaded object as a CMP asset.** The ID you get back from this step is the key you'll
   attach to the CMS content item.

The detail that saves you later is the **join key**. My attach step (Stage 3) matches each content item
to its DAM asset by comparing the item's display name to the asset's **folder**, not its filename. So I
upload each item's photo into a CMP folder named after the item, mirroring the content structure, which
means the join can't silently drift as filenames change.

📷 **[Screenshot: the CMP asset library showing uploaded images organised into per-item folders.]**

### 🧩 Gotcha: a bodyless GET with a JSON content-type header returns 400

Every `GET` I sent to CMP with a `Content-Type: application/json` header came back with a generic
"the server could not understand this request." A bodyless GET must not declare a JSON body. The rule
is simple once you've been bitten: send **only the `Authorization` header** on GETs, and add
`Content-Type: application/json` *only* when there's genuinely a JSON body (the token call, and the
register-asset POST). Obvious in hindsight; twenty minutes of "but the token works?!" in practice.

## Stage 3: attach, a one-line write and the bug that ate a batch of images

Attaching is genuinely trivial: you write a reference into the item's image field and publish a new
version. A single-image field takes one reference; a gallery field takes a list of them. There's no
binary in sight at this stage; it's just a string pointing at the CMP asset.

The wrinkle is that the CMA is **read-merge-write**: you POST a *new version* carrying the item's
existing properties *plus* your image field, then publish that new version. My first run reported a
clean "133 filled, 0 failed", and yet Graph showed a chunk of items still image-less. This wasn't
propagation lag. The **published** version genuinely lacked the image, while a freshly created **draft**
version had it.

### 🧩 Gotcha: "publish the latest version" is not "publish the first item in the list"

The buggy sequence was: create the new version, re-list the item's versions, publish the first entry in
that list, on the assumption that the first entry is the newest.

That assumption is false. For any item that already had an *unrelated* existing draft, the version list
didn't come back newest-first: the first entry could be the *already-published* version. So the publish
call ran against something already published, returned a successful no-op, and my freshly written image
sat forever as an unpublished draft. The casualties were exactly the items that happened to have a
pre-existing extra draft. "0 failed" was true and completely useless.

The fix is to publish a **deterministic** target instead of trusting list order. Version numbers are
monotonic, so the version you just created is always the maximum: capture the version number the create
call returns (or compute the max explicitly), and publish *that*. A clean re-run then filled exactly the
stragglers, skipped everything already done (the run is idempotent), and a final pass reported nothing
left to fill.

### 🧩 Gotcha: an unset reference is *truthy*

To let a re-run skip items that are already filled, you need an "is this field set?" check, and the
naive truthiness check marks *everything* as filled. An **unset** content reference doesn't come back as
`null` from Graph; it comes back as an object with null fields inside it, which is still a truthy object.
Only a non-null **key** inside that object means the field is genuinely filled. This same bug had also
been quietly hiding every blank social-share image on the site until I started checking the key rather
than the reference itself.

## Lessons: a cheat-sheet

| If you're doing this | Do this | Because |
|---|---|---|
| Getting binaries into the CMS | Upload to **CMP**, attach a **reference** in the CMS | The CMA can't create image binaries; it only stores references |
| Authenticating | Treat CMP, CMS/CMA, and Graph as **three separate credentials** | They don't share OAuth |
| Uploading to CMP | Presigned target, multipart POST (**fields first, file last**), register | It's a presigned upload, not a plain CMS file POST |
| Matching photos to items | Join on a **stable folder**, not the filename | Filenames drift; a structural folder doesn't |
| Publishing a write | Publish the **deterministic max version**, never list position | List order isn't guaranteed newest-first |
| Checking if a field is filled | Test the reference's **key**, not the object | An unset reference is a truthy object |
| Running anything at scale | **Dry-run first**, apply second | Turns "did I wreck 150 live pages?" into a table you can read |

## The result

Zero to a few hundred items imaged. Every item now has its own photo, sourced, uploaded to CMP,
attached, and published, rendering on listings and detail pages (served from CMP through the frontend's
image optimizer), with a photographer credit recorded for each one to an auto-generated attribution
table. The whole thing lives as a couple of small, idempotent scripts: one to source and upload, one to
match, attach, and publish, each defaulting to a dry run.

That dry-run-first design mattered more than any single line of code. It turned the terrifying question,
*did the automation just put something wrong on hundreds of live pages?*, into a table I could read and
sign off on *before* anything was written. On any bulk content operation, that's the decision I'd make
first, every time.

## Closing thoughts

The conceptual hurdle here isn't the code; it's accepting that imagery on Optimizely SaaS is a
*three-product* dance (the stock source, CMP for the binary, the CMS for the reference), each with its
own auth and its own rules. Once that clicks, a "bulk imagery" problem stops being scary and becomes a
tidy little pipeline you can re-point at any content set.

I'd love to hear how other teams have automated getting assets into CMP at scale, especially how you
handle the "is this photo actually appropriate?" gate when a script can't see the image. What's worked
for you?

## Related reading

- **Fast and fresh on Optimizely SaaS + a headless frontend**: once the images are attached, how they
  get delivered as tiny device-sized files with a Core Web Vitals budget in mind.
- **A reusable, server-rendered listing engine**: where all those newly-imaged cards end up rendering.
- **Semantic search with Optimizely Graph**: a practical guide.
- For the exact, current CMP and CMA endpoints behind the upload-and-attach flow described here, see the
  official Optimizely SaaS CMS documentation.

---

_Have a correction or a better way to frame any of this? Reach out, I keep these posts updated as the
platform evolves._
