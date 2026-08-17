# Optimizely SaaS CMS — Website Development Best Practices

_A practical playbook for building a Next.js website on Optimizely SaaS CMS + Graph + Visual
Builder with the official `@optimizely/cms-sdk`. Distilled from the official docs, the CMS Skills,
and hard-won lessons on this project. Pairs with ARCHITECTURE.md, CONTENT-MODEL.md,
COMPONENT-STANDARDS.md, SEO.md, PREVIEW-WORKFLOW.md, QUALITY.md._

## 1. Project & SDK setup
- Use the **official `@optimizely/cms-sdk`** (+ `@optimizely/cms-cli`) — first-party, code-first,
  and what the CMS Agent Skills target. **Node 22+.**
- Keep the app **latest** but green: track newest versions, hold a major back only when the
  toolchain doesn't support it yet, and document why (see §12 gotchas: TS 7 / ESLint 10).
- One place for client config (`config({ apiKey, graphUrl })`); import it wherever `getClient()`
  is used (root layout + any standalone route like `robots.ts`).

## 2. Content modeling
- **Organize content properly — never flat.** We always follow Optimizely's content-organization
  guidance: pages live in a tree that mirrors the site URLs; **shared blocks are grouped into named
  folders** ("Tag - Taxonomy", "Site Configurations"), not dumped under "For This Application"; and any
  container heading past **~100 children** is bucketed into folders (year for editorial, category for
  products). This keeps the editor tree legible and gives every content kind one obvious home. Moving a
  block between folders never changes its `key`, so references/facets survive re-organisation. See
  CONTENT-ARCHITECTURE.md (§2 tree, §3 taxonomy, §10 bucketing).
- **Model deliberately, up front** — re-modeling after content exists triggers *breaking* pushes.
- Base types: `_page` (routable), `_experience` (Visual Builder canvas), `_component` (blocks +
  data records), `_folder`, `_image`/`_media`/`_video`.
- **Contracts** (`contract()`) for reusable property sets (e.g. `SeoMetadata`) → `extends` on
  every page. DRY + consistent.
- **Taxonomy is foundational** — make it faceted + hierarchical (a `dimension` discriminator,
  a `_self` parent, plus `synonyms`/`description`). It powers filtering **and** AI/semantic search.
- Mark fields **`indexingType: 'searchable'`** (for `match`/`contains`) and filterable as needed —
  Graph can only query what's indexed.
- Group fields (`group: 'content' | 'seo' | …`) and set `sortOrder` for a clean editor UI. Note:
  `content` is a **read-only system group** — don't redeclare it in `propertyGroups`.
- References: base types as **strings** (`['_image']`); custom types as **object refs**
  (`[AreaContentType]`) — and import them. Single ref = `contentReference`; list = `array` of
  `{ type: 'content', allowedTypes: [...] }`.

## 3. Visual Builder & display templates
- **Experience** = routable VB canvas (composition of nodes). **Section** = a band; **Element** =
  a leaf block. Flag components with `compositionBehaviors: ['sectionEnabled', 'elementEnabled']`.
- Put **layout/presentation choices in display templates** (`select`/`checkbox`), not content
  fields. Author picks arrive as `displaySettings` on the component.
- **One shared default display template** (bound to `baseType: '_component'`) is a clean way to
  give every block the same **Theme (Light/Dark)** + **Width (Full/Contained)** + spacing controls.
- Keep theme/width on **sections** (children inherit) + a few banner components; don't bloat every
  leaf. Route all of it through a single `<SectionShell>` primitive — components never hand-roll
  width/theming.
- Register in all three: `initContentTypeRegistry`, `initReactComponentRegistry` (resolver key =
  content-type key; display-template variants via `tags`), `initDisplayTemplateRegistry`.

## 4. Optimizely Graph (delivery)
- **Two credentials, two worlds:** public **single key** (`?auth=…`, published-only, frontend-safe)
  vs **app key + secret** (HMAC, server-only, drafts/preview, super-user). Never ship the secret.
- Query custom types by key **without** the `_` prefix (`PointOfInterest`, not `_PointOfInterest`);
  system types use `_` (`_Page`, `_Content`).
- Use **`item`** (singular) for single-record lookups (better caching); paginate lists; use
  **cursor** beyond 10k; project only needed fields; use variables + fragments.
- **Semantic search** is built in — `orderBy: { _ranking: SEMANTIC, _semanticWeight: 0.3–0.5 }` +
  `_fulltext: { match: $q }`. No external vector DB needed for CMS content. Add facets, synonyms,
  and Gaussian date-decay for relevance.
- **Stored query templates** (`?stored=true`) in production for repeated shapes.
- **Latency:** content sync 5–15 min scheduled / 1–3 s event-driven; **schema changes take minutes
  to propagate** — don't query a brand-new type immediately.

## 5. Rendering (Next.js App Router)
- Server components by default; `"use client"` only for real interactivity.
- Content pages: `getClient().getContentByPath(path)` → `<OptimizelyComponent content={…} />`.
  Experiences: `<OptimizelyComposition nodes={…} />`.
- Use the SDK's **preview utils** (`getPreviewUtils` → `pa()`) on editable props so on-page editing
  works; `RichText` for rich text; `next/image` + `damAssets`/`src` for images.
- **Guard every server-side fetch** (`try/catch`) so a Graph hiccup degrades gracefully (fallback
  UI / fail-closed), and the build succeeds without secrets.

## 6. Preview & publishing
- **Live preview** needs the app on **HTTPS** (CMS iframes it). Configure an **Application** in the
  CMS (host + `usePreviewTokens`); default preview URL `{host}/preview?key=…&ver=…&loc=…&ctx=…`.
- Preview tokens are short-lived (~5 min); the CMS `communicationinjector.js` bridges edits.
- For **stakeholder sign-off before publish**, build durable, login-free, signed preview links
  (Next Draft Mode + server-side HMAC) — not shipped by the CMS. See PREVIEW-WORKFLOW.md.
- **On publish → revalidate:** register a Graph webhook (`doc.updated`/`bulk.completed`,
  `status=Published`) → a route that calls `revalidatePath`/`revalidateTag`. ISR stays fresh.

## 7. SEO (server-rendered, every page)
- `generateMetadata()` on every route — title/description/canonical/OG/Twitter in the **initial
  HTML**, never client-only.
- **Global title template from CMS settings:** root layout sets `title.template` from a
  `SiteSettings` singleton → rebrand in **one publish**. Gotcha: the template does **not** wrap the
  **root page** (same route segment) — build its title explicitly with the same settings.
- **JSON-LD** per type (`TouristAttraction`, `Event`, `Hotel`, `Article`, `BreadcrumbList`,
  `Organization`) in a server `<JsonLd>` component. `hreflang` for locales. Dynamic OG images.
- **Robots fail-closed:** a global CMS switch (default OFF) + `robots.txt` that disallows all until
  indexing is explicitly enabled; per-page `noindex`/`nofollow`. Keeps demos out of search.

## 8. Performance (Core Web Vitals)
- `next/image` for all imagery; `remotePatterns` for the CMS/DAM host.
- ISR + on-demand revalidation (webhook) over SSR-on-every-request; cache Graph responses; stored
  query templates. Budget with Lighthouse CI (QUALITY.md).
- Self-host fonts via `next/font`; avoid layout shift; stream with RSC.

## 9. Security
- Secrets **server-side only**; the Graph **single key** is the only browser-safe credential.
- CLI/API keys are **least-privilege**: our key pushes *types* but is **Forbidden from creating
  content instances/apps** — content authoring is a CMS-UI (or scoped-key) activity, by design.
- CSP must allow the CMS origin to iframe the app + load the injector for preview.
- Never put PII in URLs/logs; hash session ids; `.env` is gitignored (`.env.example` documents keys).

## 10. Environments & config workflow
- `optimizely-cms-cli login` (verifies env creds) → `config push` (sync types) / `config pull`
  (snapshot). Scope the `components` glob so only *your* types are pushed.
- **Breaking changes** (e.g. adding a required field to an existing type) need `--force` — safe
  when there's no content, careful when there is (data loss). `config pull --json` first as backup.
- Every env-var change → redeploy.

## 11. Dev workflow & quality (all free/OSS)
- Trunk-based Git: short-lived branch → PR → review → **squash-merge**; Conventional Commits.
- **CI gates** (GitHub Actions): type-check + lint + unit tests + build on every PR.
- **TypeScript** strict, **ESLint** (flat config), **Prettier**, **Vitest** for pure logic,
  **Playwright + axe + Lighthouse** as pages appear, **Dependabot** for updates. See QUALITY.md.
- Keep secrets out of CI; the build must fail closed without them.

## 12. Gotchas we actually hit (save yourself the time)
- **`create-app` doesn't emit `.env`** (README implies one) → add `.env.example` yourself.
- **`opti-push` script hardcoded `pnpm`** in the scaffold → fix for your package manager.
- **`next lint` was removed in Next 16** → run `eslint` directly with a native flat config.
- **TypeScript 7 / ESLint 10** aren't supported by the Next 16 toolchain yet → pin TS 5.x / ESLint
  9.x; revisit later.
- **Tailwind v4 flattens `@theme` vars** → use **`@theme inline`** for tokens that flip in dark mode.
- **`config push` can't create content instances** with a type-only API key (`Forbidden`) → author
  content in the CMS UI or use a content-scoped key / seed script.
- **Graph query field names drop the `_` for custom types** (`PointOfInterest`, not `_…`).
- **Schema propagation delay** — a just-pushed type isn't queryable in Graph for a few minutes.
- **Title template doesn't wrap the root page** (same segment as root layout) → set it explicitly.
- **Local HTTPS:** `next dev --experimental-https` needs a trusted local CA — run `mkcert -install`
  once (it needs your keychain password) or the cert step fails and falls back to HTTP (breaks preview).
- **Registry ↔ CMS drift breaks preview.** The React registry must *mirror* the CMS model. A type
  registered locally but **deleted from Graph** makes the generated delivery/preview query fail
  (`GraphContentResponseError: HTTP 400: N errors in the GraphQL query` — one per stale type). A type
  **in Graph but not registered** throws `GraphMissingContentTypeError` when it's resolved. After
  cleaning a scaffold, **prune its demo types from `initContentTypeRegistry`/`initReactComponentRegistry`**
  the moment they're gone from the CMS — don't defer it. Keep the SDK system types (`BlankExperience`,
  `BlankSection`).
- **Never construct the Graph client with an empty/dummy key.** The SDK throws on an empty key at
  `config()`/`getClient()` — at *module load* for a route like `robots.ts`, which crashes the CI build
  (no secrets) before any `try/catch` runs. Best practice: **lazy-init** — read the key, and only call
  `config()` when it's present; if it's missing, fail closed (e.g. robots → `Disallow: /`) *without*
  building a client. A placeholder key "works" but is a smell (real requests then 401 silently).
- **Background image behind an opaque section = invisible.** A full-bleed banner that layers its image
  at `-z-10` inside a section with a solid background must give that section its own **stacking context**
  (`isolate` / `isolation: isolate`), or the negative-z image paints *behind* the section background.
- **CTA "open in new tab" is a content field, not a link-editor option.** The CMS link dialog only does
  Page/Media/Email/External — no `target`. Model an `openInNewTab` boolean alongside the link and apply
  `target="_blank"` + `rel="noopener noreferrer"` in the component. (Extract a reusable Link contract once
  more than one component needs a CTA.)
- **Register the image asset type (`ImageMedia`, `baseType: '_image'`).** Uploaded images get this
  concrete type, and any `contentReference` with `allowedTypes: ['_image']` (e.g. a Hero background)
  resolves to it — so it *must* be registered or preview throws `GraphMissingContentTypeError`. Give it
  **empty `properties: {}`**: the SDK auto-selects `_assetMetadata`/`_imageMetadata`, so the query stays
  valid even if the CMS asset type carries extra fields.

- **Stop words sabotage semantic search.** `_fulltext` is BM25-scored *before* the semantic blend,
  and BM25 magnitudes dwarf semantic ones. "swimming in the sea" ranked a historical district top
  (score 7.5) purely on `in`/`the`, burying the beaches at ~0.09 — and this is also why
  `_semanticWeight` appears to do nothing on raw natural-language queries. **Strip stop words
  before querying**; semantic ranking then works as advertised ("skyscraper" → the tallest tower,
  "fish tank" → the mall with the aquarium, both with zero lexical overlap).
- **Don't run site search against the `_Content` interface.** It matches *everything*, including
  non-routable shared blocks — a taxonomy `TagTerm` scored 115 and out-ranked every real page, and
  it has no URL to link to. Query the concrete types (and you get their type-specific fields too).
- **Graph relevance scores are not comparable across types** — BM25 is normalized per index, so the
  same query scored an `Area` 13.7 and a `PointOfInterest` 1.5. Group multi-type results by type
  rather than merging them into one "ranked" list.
- **Vector search always returns nearest neighbours**, so weak queries come back with a long tail of
  near-zero matches. Apply a **relative** relevance floor (a fraction of the top score), not an
  absolute one — observed top scores spanned 0.185 → 1538, so any fixed cutoff is either useless or
  deletes good results.

- **Graph is ~0.5–1s per call — budget round trips, not bytes.** Measured TTFB for a trivial
  `PointOfInterest(limit:1){name}` was 0.44–1.05s, with DNS+TCP+TLS at only ~50ms — so it's service
  time, not network. Worse, **`getContentByPath` costs TWO round trips** (a content-type metadata
  lookup, then the content query). A page doing content + settings + breadcrumbs + a listing easily
  makes ~9 calls; sequential, that's a multi-second page. Two fixes, both needed:
  **(a)** `Promise.all` anything independent (breadcrumbs don't depend on the content fetch; a tag
  vocabulary doesn't depend on the children query); **(b)** cache Graph reads **across** requests
  with `unstable_cache` — React's `cache()` only dedupes *within* one request, so it does nothing
  for the next navigation. Published content changes rarely, so a short revalidate window plus
  tag-based invalidation from the publish webhook is the right trade. See `src/lib/cache.ts`.
- **`searchParams` + `generateStaticParams` = every page 500s in production.** A route that reads
  `searchParams` is request-time by nature, but with `generateStaticParams` present Next still tries
  to prerender it and the bailout surfaces as `DYNAMIC_SERVER_USAGE` — an Internal Server Error on
  **every** content page, while `next build` reports success and `next dev` works fine. Declare
  `export const dynamic = 'force-dynamic'` on such routes. Get performance back from **data**
  caching, not route caching.
- **Always check status codes when benchmarking, not just timings.** A 500 returns fast and looks
  like a healthy number in a timing column; we briefly "measured" a broken page as a 3.2s baseline.

- **SaaS CMS has no component-picker thumbnail (confirmed Aug 2026).** There is no way to attach a
  preview image to a component/block in Optimizely SaaS today. The content-type schema rejects a
  thumbnail key on a real push (`Error 400 InvalidModel: The field 'thumbnailUrl' does not exist on
  type 'ContentType'`), and the Visual Builder "Add Section" dialog shows a generic icon for every
  component. **`--dryRun` does NOT catch this** — it only bundles locally; the CMA is the only
  authority, so a *real* `config push` is the true validator (a good reminder for any model change).
  Optimizely support confirmed it needs a feature request or a custom solution. Until the platform
  adds it, lean on author-first names (and per-property `description`). See COMPONENT-NAMING.md.

> These gotchas are prime blog material (BLOG-PLAN.md #2/#3) — they're exactly what the community
> searches for.

## 13. Component naming conventions
- **Name author-first, by purpose.** The `displayName` is read by marketers in a scrolling picker,
  not developers. "Two Column Text" beats "SplitContentBlockV2"; keep technical suffixes in the `key`.
- **Variants are dropdowns, not new components.** Left/right, tone, and columns are `selectOne`
  properties (or the shared display template), not duplicate blocks. This one rule halves a library.
- **Test the name in the full alphabetical list, not alone** — that is where collisions like
  "Card" / "Card Grid" / "Highlight Card" show up.
- **Global fixtures stay out of the page picker.** Top Navigation / Footer / Cookie / Announcement
  live in **Site Settings**; their data models carry **no composition behaviour** so they never
  appear as placeable sections (see `src/components/content/Navigation.tsx`).
- **Reserve "AI" for disclosure** ("AI Answer"), not for tech-flavour ("AI Search"); technology
  prefixes age badly.
- **A thumbnail is half the label** — ship a plain 16:9 wireframe per component, filename-matched.
- Full playbook, category taxonomy, and worked examples (why we keep "Highlight Card" and
  "Curated Content"): **COMPONENT-NAMING.md**.
