---
title: "Connecting a Headless (Next.js) App to Optimizely SaaS CMS for Live Visual Builder Preview"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, visual-builder, preview, nextjs, https, cms-sdk]
---

> **Draft for review.** Screenshot placeholders are marked 📷; swap in real captures from your own
> Optimizely SaaS instance before publishing.

## The feature that makes Visual Builder actually usable

Visual Builder is a wonderful tool for authors, but only if they can see what they are building. An
editor opens a page, drags a hero into place, tweaks the heading, and expects the page to look right
there and then. On a traditional Optimizely site, that "right there and then" came almost for free,
because the CMS rendered the page itself.

The moment you go headless, that assumption disappears. Your Next.js app renders the page, not the
CMS. So live preview stops being a checkbox and becomes a small integration problem: the editor has to
load *your* app, inside the Visual Builder canvas, showing *draft* content, and reflect edits as the
author types. Get it working and Visual Builder feels magical. Get it slightly wrong and editors are
staring at a blank iframe with no idea why.

I want to walk through how the pieces fit together, and then spend most of the post on the handful of
things that quietly broke for me. None of them were hard once I understood them; every one of them
cost me an afternoon first.

📷 **[Screenshot: an editor working on a page in the Visual Builder canvas, with the headless app
rendering live inside the iframe.]**

## Why it is trickier than it looks on a headless setup

On a coupled Optimizely site, preview is the CMS rendering its own views. Headless breaks that in two
ways at once.

First, the content the editor is looking at is a **draft**: unpublished, not in the public delivery
API, and reachable only with elevated credentials. Your public content reads will not see it.

Second, the CMS shows your app by **iframing it** and then talking to it. That framing brings its own
constraints (secure context, an injected bridge script, a dedicated route) that never came up while
you were building the public site. Preview is also, in my experience, where any drift between your
code and the CMS surfaces first, because it exercises the whole content model through a live query
before a single visitor ever hits the site.

So the work is less "turn preview on" and more "give the editor a secure, uncached, draft-aware
window into the same components that serve published pages."

## The moving parts

Once it clicked, the flow was simpler than the number of moving parts suggested. Here is the shape of
it.

| Piece | What it does |
|---|---|
| **Application** (in the CMS) | Binds a host to your app and enables preview tokens. Dev binds your local HTTPS origin; prod binds the deployed domain. |
| **Preview URL** | The CMS iframes your app at a preview path with content key, version, locale, and context as query params. |
| **`/preview` route** | A dedicated route in your app that reads those params and renders the *draft* content. |
| **App key + secret** | Draft reads are authenticated (HMAC), not the public single key. The SDK's preview call handles the token exchange. |
| **Injector script** | A small script the CMS injects to bridge edits from the iframe into your rendered components. |
| **Preview utilities** | SDK helpers that mark editable fields so on-page editing binds to the right property. |

The key decision is to treat the preview route as a thin variant of your normal render path, not a
parallel universe. It reads the incoming params, asks the SDK for the draft content, and then renders
the *same* composition and component code you already use for published pages. Only two things differ:
the data source (draft, and never cached) and the presence of the bridge script that makes edits live.

Conceptually, the route is about this small:

```tsx
// Read the preview params, fetch DRAFT content, render the same components as production.
const content = await getPreviewContent(params);
return <OptimizelyComposition nodes={content.composition.nodes} />;
```

Everything else is configuration and a few sharp edges.

📷 **[Screenshot: the Application configuration in Optimizely SaaS: the bound host and the "use preview
tokens" setting enabled.]**

📷 **[Screenshot: the `/preview` route rendering draft content inside the Visual Builder canvas, with a
field selected for on-page editing.]**

## What broke, and how I fixed it

This is the part I actually wanted to write. Five things tripped me up, and every one of them produced
a symptom that did not obviously point at the cause.

### 1. Live preview needs HTTPS locally

The CMS iframes your app inside a secure context, so a plain `http://localhost` origin will not load.
Locally, that means running your dev server over HTTPS. Next.js can generate a self-signed certificate
for you, but a browser will only trust it if there is a trusted local certificate authority behind it.

The fix is to install a local CA once (`mkcert -install`, which needs your keychain password) before
starting the HTTPS dev server. Skip that step and the certificate quietly falls back to HTTP, and
preview simply never loads, with no error that points you at the certificate.

### 2. The registry must mirror the model, or preview fails first

Your app keeps a registry of content types and their components. Preview generates a live query
against the full model, so if your registry and the CMS have drifted apart, this is where you find
out, before any published page misbehaves.

Two failure shapes, two directions of drift:

- A type registered locally but missing from the backend makes the generated query invalid
  (an HTTP 400 with GraphQL query errors).
- A type present in the backend but not registered throws a "missing content type" error when the SDK
  tries to resolve it.

The fix is discipline, not cleverness: keep the type registry and the component registry in lockstep
with the CMS, and do not drop the system base types the composition relies on (the blank experience
and blank section). Treat the registry as a mirror of the model, not a convenience list.

### 3. Register the image asset type

This one felt like a bug until I understood it. Uploaded images resolve to a concrete image asset
type, and any content reference that allows an image (a hero background, a card image) resolves to
that type. If it is not registered, preview throws the same "missing content type" error, and it is
not obvious that an *image* is the culprit.

The fix is to register the image asset type with **empty properties**. The SDK then auto-selects the
standard asset and image metadata, so the generated query stays valid even if the CMS asset type
carries extra fields you did not model. Trying to hand-declare its fields is how you reintroduce the
drift from the previous gotcha.

### 4. Preview must never be cached

For published pages, caching content reads is exactly what you want. For preview it is poison. If the
preview path shares the cross-request cache the public site uses, an editor makes a change, the page
does not update, and they lose trust in the tool within about thirty seconds.

The fix is a deliberate split: the published render path may cache aggressively, but the `/preview`
path always fetches fresh via the preview call and opts out of caching entirely. Same components, two
very different data policies.

### 5. Preview tokens are short-lived

The tokens that authenticate a preview session are intentionally short-lived (on the order of a few
minutes). That is perfectly fine for an editor actively working on a page. It is not a mechanism for
durable, shareable "here is the page before we publish" links you send to a stakeholder.

There is no fix here so much as a boundary: if you need login-free, long-lived preview links for
reviewers, that is a separate build (draft mode plus your own signed links), and a topic for its own
post. Do not try to stretch preview tokens to cover it.

📷 **[Screenshot: a preview session failing with a missing-content-type error, next to the registry
entry that resolves it, illustrating the registry-mirror gotcha.]**

## The cheat-sheet

If I could hand my past self one table before starting, it would be this.

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank iframe, preview never loads | App served over HTTP, not HTTPS | Install a local CA once, run the dev server over HTTPS |
| HTTP 400, GraphQL query errors | A type registered locally is missing from the backend | Keep the registry in lockstep with the CMS |
| "Missing content type" error | A backend type (often the image asset) is not registered | Register it; give the image asset type empty properties |
| Edits do not appear as you type | Preview path is sharing the public cache | Fetch fresh on `/preview`; never cache draft reads |
| Preview link dies after a few minutes | Preview tokens are short-lived by design | Use a separate signed-link build for shareable previews |

## Closing thoughts

The satisfying part is how little bespoke code this needs at the end. The preview route renders the
same components as production; the difference is a draft data source, a no-cache rule, and a secure
context with the bridge script in place. Almost everything that went wrong for me was configuration or
model drift, not application logic, which is a good sign: it means the SDK is doing the heavy lifting
and my job is mostly to stop getting in its way.

If you are wiring this up for the first time, budget an afternoon for the certificate and registry
issues specifically. They are the two that produce the most confusing symptoms and the least helpful
error messages.

I would love to hear how other teams have handled headless preview on Optimizely SaaS, especially how
you keep your type registry honest against the model over a long-running project. What caught you out,
and how did you make it repeatable for the rest of the team?

---

### Related reading

- **From Content Areas to the Visual Builder canvas**: rethinking page composition in Optimizely SaaS
- **Content modeling for Visual Builder**: pages vs experiences vs components, and when to use each
- **Shareable stakeholder previews for a headless Optimizely SaaS frontend**: durable, login-free
  preview links (the separate build this post deliberately stops short of)

For authoritative setup details, see the official Optimizely SaaS CMS documentation.

_Have a correction or a better way to frame any of this? Reach out and let me know; I keep these posts
updated as the platform evolves._
