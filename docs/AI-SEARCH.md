# AI Search & Trip Planner — Architecture (Phase 4)

_Retrieval + generation design for the Claude-powered features. Companion: AI-PLATFORM.md
(observability, prompt management, guardrails, safety, scalability)._

## Headline decision: **no separate vector DB for CMS content**
**Optimizely Graph already provides semantic (vector) search** (`orderBy: { _ranking: SEMANTIC }`,
`_semanticWeight`). For content that lives in the CMS (restaurants/POIs, news, events, articles),
**Graph *is* our vector search.** Adding Supabase pgvector to search CMS content would duplicate
this and force a second index kept in sync with Graph — avoid it. Showcasing Graph's semantic
power is a project goal, so we lean into it.

## A query is not one thing — decompose it
Example: *"nearest Michelin-star restaurant"* → three distinct capabilities:

| Part | Capability | Handled by |
|------|-----------|-----------|
| "Michelin-star restaurant" (meaning) | **Semantic search** | **Optimizely Graph** (`_ranking: SEMANTIC` + synonyms) |
| "nearest" (proximity) | **Geospatial** — *not* vectors | **App layer** — Graph returns each POI's lat/lng; we compute distance (Haversine) from the user's location and sort |
| "restaurants + news + other info" | **Multi-type retrieval + facets** | **Graph** — federated query across `PointOfInterest`, `Article`/News, `Event` |

> Key insight: **"nearest" is geo, not semantic** — a vector DB wouldn't help. Graph gives the
> semantically-relevant candidate set + coordinates; the API route ranks by distance.

## Flow: retrieval (Graph) → generation (Claude)
```
User query + location
  → (optional) Claude: parse intent → { entities, keywords, filters, location }
  → Optimizely Graph: semantic + faceted query across POI / News / Events → candidates (lat/lng, categories, _score)
  → App (Next.js route /api/ai/search): compute distance, sort "nearest", assemble grounded context
  → Claude: generate (a) creative card copy per result, (b) 3 follow-up questions
            grounded in the query + the ACTUAL facets/related data returned
  → Frontend: render rich cards (restaurant + related news + info) + 3 clickable follow-ups
```
- **Graph = retrieval. Claude = reasoning/generation.** Claude never invents data — it only
  phrases/curates what Graph returns → cards stay grounded, hallucination stays low.
- **The 3 follow-ups are grounded**: generated from real available facets (categories, areas,
  "open now", nearby events) so each maps to a real query returning real results — e.g. "Only
  ones open now?", "Michelin restaurants in [nearby area]?", "Events near [restaurant] this weekend?"
- **Creative card** = a structured JSON card model Claude fills from retrieved data, rendered by
  our design-system card components (COMPONENT-STANDARDS.md).

## AI Trip Planner (same spine)
Constraints (dates/interests/budget/pace) → Graph retrieval (POI/Event/Tour/Hotel, semantic +
facet + geo) → Claude assembles a day-by-day plan → output written as an **`Itinerary`** content
type (CONTENT-MODEL.md), shareable.

## Content-model implications (already mostly covered)
- `PointOfInterest` has **geo (lat/lng)** + `categories` ✓ → add an **accolades/rating** field or
  a "Michelin" `Category` for restaurants.
- `Article` (news) + `Event` exist ✓ → multi-type results work out of the box.
- Ensure fields used for search are marked **searchable/filterable** in the CMS (Graph requirement).

## When pgvector (or another vector DB) *would* earn its place — later, if ever
- Ingesting data **not in the CMS** (external reviews, PDFs, a large knowledge base) → embed those.
- **Conversational memory** (embedding chat history for retrieval).
- Hybrid retrieval logic Graph can't express.
Until one of those is real, **Graph semantic search + app-side geo + Claude** is the right,
simpler, cheaper, lower-latency stack.

## What shipped (S3.2 — the retrieval layer, measured against real content)

`/search` (`src/app/search/page.tsx` + `src/lib/search.ts`) is the Graph retrieval half of the
pipeline above, live today without Claude in the loop. It is what the AI Search feature will call.

**Semantic ranking genuinely works** — verified by comparing `_ranking: RELEVANCE` vs `SEMANTIC`
on queries with **zero lexical overlap** with the target content:

| Query | `RELEVANCE` (BM25) | `SEMANTIC` |
|-------|--------------------|-----------|
| "skyscraper" | 0 results | **Burj Khalifa** ("tallest building") |
| "fish tank" | 0 results | **The Dubai Mall** ("aquarium") |

Four findings that shaped the implementation:

1. **Strip stop words before querying.** `_fulltext` is BM25-scored and stop words dominate:
   *"swimming in the sea"* ranked a historical district top (7.5) on `in`/`the` alone, while the
   beaches it should surface scored ~0.09. Removing stop words fixes it → Jumeirah Beach + Palm
   Jumeirah. BM25 magnitudes also dwarf the semantic contribution, which is why `_semanticWeight`
   looks inert on raw natural-language queries.
2. **Query concrete types, not `_Content`.** The `_Content` interface also matches non-routable
   shared blocks — a `TagTerm` scored **115** on "traditional culture and heritage" and would have
   been the top (unclickable) result. Per-type queries also allow projecting price/event dates.
3. **Scores are not comparable across types**, so results are **grouped by type**, not merged into
   one list. The same query scored an `Area` 13.7 and a `PointOfInterest` 1.5 — Graph normalizes
   BM25 per index. A blended ranking would be fiction.
4. **Denormalize taxonomy synonyms into the item.** `_fulltext` searches a type's OWN fields only —
   it does NOT follow a `contentReference` to a Tag's `synonyms`. So a query like *"swimming"* under-
   ranked beaches (their prose says "boardwalk/beach club", not "swim") even though the `Beaches` tag
   carries `swimming` as a synonym. Fix: a `searchKeywords` (searchable) field on `PointOfInterest`/
   `Event`, populated by `scripts/seed.mjs` with each item's tag names + synonyms — so the concept is
   in the item's own BM25 index AND its semantic embedding. No `search.ts` change (`_fulltext` auto-
   covers searchable fields). Trade-off: denormalized → repopulate on tag edits (reseed / webhook).

**Relevance floor.** Vector search always returns nearest neighbours, so weak queries trail a tail
of near-zero matches. We drop results below **10% of their group's top score** — relative, not
absolute, because measured top scores span 0.185 → 1538 and any absolute floor high enough to
suppress noise also deletes good results ("swimming sea" scores its beaches at 0.092/0.078).

**Known limitation:** the floor trims tails, it does not detect nonsense. Most gibberish
("asdfgh", "quantum blockchain accounting") returns zero results naturally, but a near-miss token
like "zzzzqqq" returns a flat low-score spread that no relative floor separates. Re-tune once
there is substantially more content.

**Result type facets (shipped).** A `?in=<type>` filter narrows the grouped results to one type via
a chip bar. The chip counts always come from the **full** result set (so the bar stays stable while
the displayed groups narrow), and the pure helpers `searchFacets` / `filterByType` / `isGroupKey`
live in `src/lib/search.ts` (covered by `src/lib/search.test.ts`). Zero client JS — the chips are
plain links that re-render the server component.

## Implementation notes (Phase 4)
- Server-only Next.js route handlers under `app/api/ai/*`; `ANTHROPIC_API_KEY` server-scope only.
- Use **structured outputs** (tool/JSON schema) so card + follow-up payloads are always valid.
- **Stream** responses for perceived speed; cache hot queries.
- Gate the feature behind **Optimizely Feature Experimentation** to roll out / A-B safely.
- All observability, prompt config, and guardrails: see **AI-PLATFORM.md**.
