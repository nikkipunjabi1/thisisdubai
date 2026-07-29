---
title: "Optimizely SaaS CMS + Visual Builder on Vercel with Next.js — setup & the gotchas that cost me hours"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, visual-builder, optimizely-graph, nextjs, vercel, cms-sdk, setup]
---

> **Draft for your review.** Edit the voice/details freely before publishing. A LinkedIn variant
> can be spun off from the intro + the gotcha list.

> ⚠️ _Independent, unofficial learning project — not affiliated with any tourism authority or brand.
> Original wordmark and royalty-free assets only._

## What I set out to do

Stand up a real, headless website on **Optimizely SaaS CMS** — content delivered through
**Optimizely Graph**, pages composed in **Visual Builder**, rendered by a **Next.js (App Router)**
app on **Vercel** — using the first-party **`@optimizely/cms-sdk`**. Code-first, everything in
git, no bespoke glue where the SDK already has an answer.

This post is the setup that got me to "a page renders from the CMS," plus the handful of gotchas
that aren't (yet) obvious from the docs, so they don't cost you the afternoon they cost me.

## The stack, and why

- **`@optimizely/cms-sdk` + `@optimizely/cms-cli`** — first-party, code-first, and what the CMS
  Agent Skills target. Content types are defined in TypeScript (`contentType()` / `contract()`) and
  pushed to the CMS with `config push`. **Node 22+.**
- **Optimizely Graph** for delivery — GraphQL, with a public **single key** (published content,
  browser-safe) and a server-only **app key + secret** (drafts/preview, HMAC).
- **Next.js App Router**, server components by default — the CMS content is fetched and rendered
  on the server; `"use client"` only where there's real interactivity.
- **Vercel** free tier for hosting.

## The setup, start to finish

1. **Model content types in code.** A `contentType()` per type, a `contract()` (`SeoMetadata`) for
   shared field sets. Keep the CLI's `components` glob scoped to *your* types so pushes are clean.
2. **One place for client config.** Call `config({ apiKey, graphUrl })` once (root layout) and import
   `getClient()` wherever you query — including standalone routes like `robots.ts`.
3. **Mirror the model in the React registry.** `initContentTypeRegistry([...])` +
   `initReactComponentRegistry({ resolver: { <typeKey>: <Component> } })` +
   `initDisplayTemplateRegistry([...])`. The resolver key **is** the content-type key.
4. **Render.** Pages: `getClient().getContentByPath(path)` → `<OptimizelyComponent content={…} />`.
   Experiences: `<OptimizelyComposition nodes={…} />`.
5. **Push + deploy.** `optimizely-cms-cli login` → `config push` → deploy to Vercel with the Graph
   env vars set.

## The gotchas (the actually-useful part)

> 🧩 **The registry MUST mirror the CMS model — or preview/delivery breaks.** A type registered
> locally but **absent from Graph** makes the generated query fail with
> `GraphContentResponseError: HTTP 400: N errors in the GraphQL query` (one error per stale type). A
> type **in Graph but not registered** throws `GraphMissingContentTypeError` when it's resolved.
> After deleting the scaffold's demo types from the CMS, prune them from
> `initContentTypeRegistry`/`initReactComponentRegistry` **immediately** — don't defer it. (Keep the
> SDK system types `BlankExperience` / `BlankSection`.)

> 🧩 **`create-app` doesn't emit a `.env`** even though the README implies one. Add your own
> `.env.example` documenting the keys (`OPTIMIZELY_GRAPH_SINGLE_KEY`, `OPTIMIZELY_GRAPH_GATEWAY`,
> the CMS client id/secret) and gitignore `.env`.

> 🧩 **Never construct the Graph client with an empty/dummy key.** The SDK throws on an empty key at
> `config()`/`getClient()` — at *module load* for a route like `robots.ts`, which crashes the CI
> build (no secrets present) before any `try/catch` runs. **Lazy-init:** read the key, only call
> `config()` when it's present, and fail closed otherwise. A placeholder key "works" but then real
> requests 401 silently — a smell, not a fix.

> 🧩 **Query field names drop the `_` for custom types** (`PointOfInterest`, not `_PointOfInterest`);
> system types keep it (`_Page`, `_Content`). And **schema changes take minutes to propagate** — a
> just-pushed type isn't queryable in Graph immediately; poll `__type` rather than assuming.

> 🧩 **Toolchain pins.** `next lint` was removed in Next 16 (run `eslint` directly with a flat
> config); TypeScript 7 / ESLint 10 aren't supported by the Next 16 toolchain yet (pin TS 5.x /
> ESLint 9.x); Tailwind v4 flattens `@theme` vars, so use `@theme inline` for tokens that flip in
> dark mode. The scaffold's `opti-push` script also hardcoded `pnpm` — fix it for your package manager.

## Result

A Next.js app on Vercel rendering content from Optimizely SaaS via Graph, with content types
defined in code and pushed with the CLI — and a build that **fails closed** without secrets rather
than crashing. Everything after this (SEO, listings, search) builds on exactly this foundation.

## Links
- Repo: _this-is-dubai_ — see `docs/OPTIMIZELY-BEST-PRACTICES.md` (the full playbook) and
  `docs/ARCHITECTURE.md`.
- Next: **live Visual Builder preview** (Application + preview tokens + local HTTPS) — post #2b.
