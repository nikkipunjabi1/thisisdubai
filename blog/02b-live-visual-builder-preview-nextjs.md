---
title: "Connecting a Next.js app to Optimizely SaaS CMS for live Visual Builder preview"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, visual-builder, preview, nextjs, https, cms-sdk]
---

> **Draft for your review.** Edit the voice/details freely before publishing.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only._

## What I set out to do

Get **live, on-page preview** working: an editor opens a page in Visual Builder and sees my
**Next.js** app render it inside the CMS, with edits reflected as they type. This is the feature
that makes Visual Builder actually usable — and it has a few requirements that are easy to miss.

## How it works (the moving parts)

- **An Application in the CMS** binds a host to your app and enables preview tokens. Dev binds
  `https://localhost:3000`; prod binds the Vercel domain. Turn on `usePreviewTokens`.
- The CMS iframes your app at a **preview URL** — by default
  `{host}/preview?key=…&ver=…&loc=…&ctx=…`. So you need a **`/preview` route** that reads those
  params and renders the *draft* content.
- Draft/preview content needs the **app key + secret** (HMAC), not the public single key. The SDK's
  **`getPreviewContent()`** handles the token exchange and populates preview context.
- The CMS injects **`communicationinjector.js`** (`{CMS_URL}/util/javascript/communicationinjector.js`)
  to bridge edits from the iframe to your rendered components. Edit-mode is detected by the presence
  of a `preview_token` in the URL.
- On editable props, use the SDK's **preview utils** (`getPreviewUtils(content)` → `pa('fieldName')`)
  so on-page editing binds to the right fields.

A minimal `/preview` route: read the params, call `getPreviewContent(params)`, and render the same
`<OptimizelyComponent>` / `<OptimizelyComposition>` you use for published pages — the difference is
the data source (draft, uncached) and the injector script.

## The gotchas (the actually-useful part)

> 🧩 **Live preview needs HTTPS locally.** The CMS iframes your app, so `http://localhost` won't do.
> `next dev --experimental-https` generates a self-signed cert — but it needs a trusted local CA, so
> run **`mkcert -install` once** (it needs your keychain password). Skip that and the cert step
> silently falls back to HTTP, and preview just won't load.

> 🧩 **The registry must mirror the model — preview is where drift bites first.** A type registered
> locally but deleted from Graph makes the generated preview query fail
> (`HTTP 400: N errors in the GraphQL query`); a type in Graph but not registered throws
> `GraphMissingContentTypeError` when resolved. Keep `initContentTypeRegistry` /
> `initReactComponentRegistry` in lockstep with the CMS (keep the system `BlankExperience` /
> `BlankSection`).

> 🧩 **Register the image asset type.** Uploaded images resolve to a concrete `_image` type
> (`ImageMedia`, `baseType: '_image'`); any `contentReference` with `allowedTypes: ['_image']` (a Hero
> background, a hero image) resolves to it — so it must be registered or preview throws
> `GraphMissingContentTypeError`. Give it **empty `properties: {}`**: the SDK auto-selects
> `_assetMetadata`/`_imageMetadata`, so the query stays valid even if the CMS asset type carries
> extra fields.

> 🧩 **Preview must never be cached.** Published reads go through a cross-request cache
> (`unstable_cache`); the `/preview` path deliberately does **not** — it uses `getPreviewContent`
> and always fetches fresh, or you'll show stale drafts.

> 🧩 **Preview tokens are short-lived (~5 min).** Fine for editing; not a mechanism for durable,
> shareable "preview-before-publish" links — that's a separate build (Next Draft Mode + your own
> signed links), a later post.

## Result

Editing a page in Visual Builder renders my Next.js app inline, live, with click-to-edit on the
authored fields — the same components that serve published pages, just pointed at draft data over
HTTPS with the injector bridging edits.

## Links
- Repo: _this-is-dubai_ — see `docs/PREVIEW-WORKFLOW.md` and `docs/OPTIMIZELY-BEST-PRACTICES.md` §6.
- Related: post #2 (setup & gotchas).
