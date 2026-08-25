---
title: "Setting up Optimizely SaaS CMS with Next.js and Visual Builder: the gotchas that cost me hours"
status: ready
audience: Optimizely community / dev.to / LinkedIn
author: Nikki Punjabi
tags: [optimizely, saas-cms, visual-builder, optimizely-graph, nextjs, vercel, cms-sdk, setup]
---

Standing up a headless site on Optimizely SaaS CMS is well documented right up until the moment
something breaks. Then you meet a handful of behaviours that are perfectly logical in hindsight and
completely opaque at the time.

This is the setup that got me to "a page renders from the CMS", and the five things that cost me an
afternoon each so they do not cost you one.

## The stack

- **`@optimizely/cms-sdk` and `@optimizely/cms-cli`.** First-party, and what the CMS Agent Skills
  target. Content types are defined in TypeScript and pushed to the CMS with `config push`. Node 22
  or later.
- **Optimizely Graph** for delivery. A public single key for published content, safe in a browser,
  and a server-only app key and secret for drafts.
- **Next.js App Router**, server components by default.
- **Vercel** for hosting.

A note on vocabulary, because it causes arguments. This is often called "code-first", and on SaaS
that is the wrong word. There is no C# class that becomes a content type, the way there was on
CMS 12. SaaS modelling is **schema-first**, through the UI or the API. What we are doing is keeping
those schema definitions **in source control** and applying them from the pipeline, which is what
Optimizely recommends. Same discipline, different mechanism.

## The setup, start to finish

1. **Model the content types in code.** One `contentType()` per type, and a `contract()` for shared
   field sets like SEO metadata. Keep the CLI's components glob scoped to your own types so pushes
   stay clean.
2. **Configure the client once.** Call `config()` in the root layout and import `getClient()`
   wherever you query, including standalone routes like `robots.ts`.
3. **Mirror the model in the React registry.** The resolver key **is** the content-type key.
4. **Render.** Pages use `getContentByPath()`, experiences use `OptimizelyComposition`.
5. **Push, then deploy.** Log in, `config push`, then deploy with the Graph environment variables
   set. That order matters, and it keeps mattering later.

## The five gotchas

**The registry must mirror the CMS model exactly, in both directions.**

This is the one that will bite you first and hardest. A type registered locally but missing from
Graph makes the generated query fail with one GraphQL error per stale type. A type in Graph but not
registered throws when something tries to resolve it.

So when you delete the scaffold's demo types from the CMS, prune them from the registry in the same
change. Not later. The failure arrives at query time, well away from the edit that caused it. Keep
the SDK's own system types.

**The scaffold does not create a `.env`,** even though the documentation reads as though it does.
Write your own `.env.example` documenting every key, and gitignore the real one. Do this on day one,
because the person who joins in month three will assume the file that exists is the file that is
needed.

**Never build the Graph client with an empty or placeholder key.**

The SDK throws on an empty key at configuration time, which for a route like `robots.ts` means at
module load. That crashes the CI build before any error handling runs, because CI has no secrets.

Read the key, configure only when it is present, and fail closed otherwise. A placeholder key looks
like a fix and is not: the build passes and real requests fail silently later, which is strictly
worse than failing loudly now.

**Query field names drop the underscore for your own types.** Custom types are `PointOfInterest`,
system types keep the prefix, as in `_Page` and `_Content`. Easy to get wrong, and the error does
not point at the naming.

**Schema changes take minutes to propagate.** A type you just pushed is not queryable straight away.
Poll for it rather than assuming, and put the wait into any pipeline that pushes the model before
deploying the app.

## Toolchain pins worth knowing

Small things, but each is an hour if you meet it cold:

- `next lint` was removed in Next 16. Run ESLint directly with a flat config.
- TypeScript 7 and ESLint 10 are not supported by the Next 16 toolchain yet. Pin TypeScript 5.x and
  ESLint 9.x.
- Tailwind v4 flattens `@theme` variables. Use `@theme inline` for tokens that change in dark mode.
- The scaffold's push script hardcodes one package manager. Change it to yours.

## What you end up with

A Next.js app on Vercel rendering content from Optimizely SaaS through Graph, with content types
defined in code, applied by the CLI, and a build that fails closed without secrets rather than
crashing.

None of that is remarkable, and that is the point. Everything after it, SEO, listing pages, search,
localization, sits on this foundation, and each of these five gotchas gets more expensive the later
you meet it.

If you are starting one of these, I would genuinely like to know which of these you hit, and which
ones I have not run into yet.
