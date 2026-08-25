# Blog & Community Plan — Optimizely SaaS, written for the community

_Goal: a body of **standalone, genuinely useful articles** on building modern sites with Optimizely
SaaS CMS + a headless (Next.js) frontend. Each post solves a general problem a reader can hit on any
project — not a diary of one demo build. Consistent voice, professional, screenshot-rich._

## Why this matters

Optimizely MVP recognition is earned through community contribution — content, code, and helping
others. Well-written, reusable articles that rank in search and get shared do that better than a
build log, because they keep helping people long after they're published. Every post here should read
as advice you could hand to another team facing the same problem.

## Voice & editorial standards

Every post follows the same standards. This is the contract.

- **Audience:** technical managers, solution architects, tech leads — and often a non-specialist
  (a delivery manager, a hiring manager) skimming to understand the shape of a problem. Open
  accessibly; go deep in the middle.
- **Voice:** professional but human — a practitioner sharing hard-won experience, not documentation.
  First person ("I", "we") to establish credibility. Warm, plain language over jargon.
- **Generic, not project-specific.** Do **not** reference or link the demo/build project. Frame every
  problem so *anyone* on *any* Optimizely SaaS project benefits. Use neutral examples.
- **Structure (the arc):** real-world scenario → why it's tricky → the approach / architecture →
  what broke and how it was fixed → lessons → closing thoughts with a genuine community invitation.
- **Screenshots do the heavy lifting.** Mark intended captures with a `📷 [Screenshot: …]`
  placeholder; the author swaps in real Optimizely SaaS screens before publishing. More real
  screenshots = a stronger post.
- **Code stays high-level.** Snippets are welcome when they make a concept concrete, but keep them
  short and illustrative — no full files, no step-by-step CLI dumps. Prefer a diagram or a one-line
  snippet over a wall of code. (Any AI tool can hand a developer the implementation; the value here is
  naming the *challenge* and the *decision*.)
- **Skimmable:** short-to-medium paragraphs, bullets, comparison tables, and a cheat-sheet where it
  helps.
- **No em-dashes.** Do not use the `—` character anywhere in a post. Use commas, colons, parentheses,
  or plain hyphens instead, whichever reads best. This is a firm rule: grep each post for `—` before
  publishing and confirm zero remain.
- **Close** with a sign-off that invites discussion ("I'd love to hear how other teams have handled…").
- **Assets:** only original wordmarks and royalty-free imagery; no third-party brand assets.

## Where to publish

- **Optimizely community / World** — primary; counts most toward MVP.
- **Personal blog + dev.to** — reach and SEO (long-form home for each article).
- **LinkedIn** — a short teaser linking to the long-form; visibility in the Opti ecosystem.

## Published so far

**4 articles published** while building this project:

| # | Article | Draft in repo |
|---|---|---|
| 6 | Semantic search with Optimizely Graph | [`blog/06-semantic-search-optimizely-graph.md`](../blog/06-semantic-search-optimizely-graph.md) |
| 7 | Localizing an Optimizely SaaS site to a new language | [`blog/07-en-ar-localization-optimizely-saas-nextjs.md`](../blog/07-en-ar-localization-optimizely-saas-nextjs.md) |
| 18 | Component naming conventions for a CMS website | [`blog/component-naming-conventions-cms-website.html`](../blog/component-naming-conventions-cms-website.html) |
| 13 | Shareable stakeholder previews on Optimizely SaaS CMS (headless) | [`blog/shareable-stakeholder-previews-optimizely-saas.md`](../blog/shareable-stakeholder-previews-optimizely-saas.md) |

Written as internal team enablement rather than published to the community:
[`blog/code-first-content-modeling.html`](../blog/code-first-content-modeling.html), plus a diagram
and a deck under `blog/assets/`.

## Publishing status

| Status | Meaning |
|---|---|
| ✅ Published | Live on the personal blog / community |
| 📝 Draft ready | Written and reviewed; awaiting publish |
| ✍️ Drafting | In progress |
| 💡 Planned | Outlined / on the backlog |

## Articles

Reframed as standalone problem/solution pieces. Each title is generic; none references a specific
build.

| # | Article (generic angle) | The problem it solves | Status |
|---|---|---|---|
| 1 | **From Content Areas to the Visual Builder canvas** — rethinking page composition in Optimizely SaaS | Classic CMS 11/12 developers can't find the ContentArea; the composition/Outline model is unfamiliar | 📝 Draft ready |
| 2 | **Content modeling for Visual Builder** — pages vs experiences vs components (and when to use each) | Choosing the wrong base type is expensive to undo; teams need a clear decision heuristic | 📝 Draft ready |
| 3 | **Modeling high-volume content as blocks, not pages** in Optimizely SaaS | The Pages tree doesn't scale to thousands of items; folders don't live there | 📝 Draft ready |
| 4 | **Best-practice global site settings with no public URL** in Optimizely SaaS | Where global config belongs in the tree, and how to keep it off the public web | 📝 Draft ready |
| 5 | **Server-rendered SEO + JSON-LD on every Optimizely SaaS page** (headless) | Getting title/meta/OG + structured data into the initial HTML with a headless frontend | 📝 Draft ready |
| 6 | **Semantic search with Optimizely Graph** — a practical guide | Turning on real semantic search, proving it works, and avoiding the common relevance traps | ✅ Published |
| 7 | **Localizing an Optimizely SaaS site to a new language** — the gotchas nobody warns you about | Adding a second language end-to-end: indexing, field localization, URL/SEO decisions | ✅ Published |
| 8 | **Fast *and* fresh on Optimizely SaaS + a headless frontend** — Core Web Vitals in practice | Caching content reads, on-demand revalidation on publish, and responsive image delivery | 📝 Draft ready |
| 9 | **Diagnosing Optimizely Graph performance** — the three-second page (and the build that lied) | Slow navigations and a build that passes while every page 500s in production | ✍️ Drafting |
| 10 | **A reusable, server-rendered listing engine** on Optimizely SaaS + Visual Builder | Section/listing pages with server-side pagination, sort, and faceted filters | 📝 Draft ready |
| 11 | **From CMP/DAM to Optimizely SaaS CMS** — a bulk imagery pipeline (source → upload → attach) | Getting binaries into the CMS at scale when the content API can't upload them | 📝 Draft ready |
| 12 | **Automating content translation in Optimizely SaaS** — what "Translate with AI" (Opal) actually does, and how to script the rest | Bulk-translating a site to a second language when there's no translate-item API | 💡 Planned |
| 13 | **Shareable stakeholder previews** for Optimizely SaaS + a headless frontend | Durable, login-free preview-before-publish links for reviewers | ✅ Published |
| 14 | **Building an AI content assistant on Optimizely Graph** (content as tools for an LLM) | Grounding an AI feature — search, a planner, an MCP server — in your live content | 💡 Planned |
| 15 | **Live Visual Builder preview for a headless app** on Optimizely SaaS | Wiring on-page/live preview end to end: preview tokens, local HTTPS, and the registry-must-mirror-the-model drift | 📝 Draft ready |
| 20 | **Setting up Optimizely SaaS CMS with Next.js and Visual Builder** — the gotchas that cost me hours | The five behaviours that break a first headless setup: registry/model drift, no scaffolded `.env`, placeholder Graph keys crashing CI, underscore rules in query fields, and schema propagation delay | 📝 Publish-ready |
| 16 | **Building a reference project on Optimizely SaaS in the open** | How and why to run a public learning project: the official-tooling decision, responsible-assets guardrails, and a sprint/PR/blogging workflow | 📝 Draft ready |
| 17 | **Security best practices with Optimizely SaaS CMS** | Securing a SaaS CMS + headless build: API keys and secrets handling, preview/token scope, webhook and revalidation auth, least-privilege access, and safe content-write scripts | 💡 Planned |
| 18 | **Component naming conventions for a CMS website** | Author-facing component names that make the "Add Section" picker self-explanatory, and when renaming a shipped component is not worth the migration | ✅ Published |
| 19 | **Dev, UAT, Production on Optimizely SaaS** — what moves with your code and what doesn't | Standing up an environment pipeline: which of the three layers promote, the deploy-ordering race, batched content import, and four misconfigurations that fail completely silently | ✍️ Drafting |

## Backlog / candidate angles

- Migrating a classic Optimizely site to SaaS: a decision checklist for architects.

## Post skeleton (reuse for each)

1. The real-world scenario / the problem
2. Why it's trickier than it looks on Optimizely SaaS
3. The approach — architecture, the key decision, a high-level snippet or diagram
4. What broke and how it was fixed (usually the most valuable section)
5. Lessons + a cheat-sheet or checklist
6. Closing thoughts + a genuine invitation to discuss

## Cadence

Aim for **one solid article per completed piece of work**. Capture the outline *while building* (the
challenge is freshest then), then write it up to standard. Keep drafts in the `blog/` folder.

## Assets for posts

Real Optimizely SaaS screenshots first (they make or break these posts), short screen-recordings, and
before/after numbers for anything performance-related. Keep them in `blog/assets/`.
