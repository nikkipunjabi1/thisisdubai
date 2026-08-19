# Environments & Promotion — Dev → UAT → Production on Optimizely SaaS

How work moves between environments on a code-first Optimizely SaaS build: what promotes
automatically, what does not, and the rules that keep a promotion from going wrong.

> This doc is also the backbone of the community blog "Dev, UAT, Production on Optimizely SaaS:
> what moves with your code and what doesn't."

## The one idea: two layers promote differently

| Layer | What it is | How it promotes | Where it lives |
|---|---|---|---|
| **Model (content types)** | Types, fields, validation, per-language flags | **Through code.** Same repo, pushed at each instance | Git → `opti-push` |
| **Content (items)** | The actual pages, text, images, translations | **It does not.** Authored where it lives; only *reference* content is scripted | The CMS instance |

The common and expensive mistake is treating content like code and trying to sync it up the chain.
Content types flow upward through code. Content is authored where it lives (usually Production), and
only reference/seed data is scripted.

## The topology

| Tier | CMS instance | Branch | Vercel project | URL | Indexable |
|---|---|---|---|---|---|
| **DEV / Integration** | Instance 1 | `main` (trunk) | `thisisdubai-dev` | https://thisisdubai-dev.vercel.app | No |
| **UAT** | Instance 2 | `uat` | `thisisdubai-uat` | _(to come)_ | No |
| **Production** | Instance 3 | `production` | `thisisdubai` | _(to come)_ | **Yes** |

**DEV is live and verified** (2026-08-18): EN/AR routes 200, Graph delivering real content, RTL correct
(`<html lang="ar-AE" dir="rtl">`), locale-aligned slugs resolving in both languages, absolute canonical
+ hreflang, a 159-URL bilingual sitemap, and `robots.txt` returning `Disallow: /` so DEV is never indexed.

Trunk-based with **forward-only promotion branches**: all PRs land on `main`; you promote by merging
`main → uat → production`, never backwards and never by committing directly to an upper branch.
See [`CONTRIBUTING.md`](../CONTRIBUTING.md#branching-model-trunk-based--forward-only-promotion-branches).

### The deploy race (get this ordering right)

The app queries the content types, so **the model must land on the instance before the new frontend
deploys** or delivery queries fail on types the instance does not have yet. Vercel's Git integration
auto-deploys the moment a branch is pushed, which races exactly that.

**So: turn Vercel's Git auto-deploy OFF for `main`/`uat`/`production`, and let CI trigger the deploy
via a Deploy Hook after the model push succeeds.** That is what `promote.yml` does:

```
push branch → snapshot model → config push → wait for propagation → trigger Vercel deploy
```

## A note on "code-first"

On SaaS there is no C#/.NET class-driven content modeling, so "code-first" in the traditional
Optimizely (PaaS / CMS 12) sense does not exist here — Optimizely's own docs are explicit that SaaS
modeling is **schema-first**, via the UI or the REST API. The accurate description of what this
project does is **schema-first with the definitions held in source control**: TypeScript
`contentType()` definitions in Git, applied to each instance by the CLI. Optimizely recommends
precisely that ("save the exported JSON schema files into your repository, or use CLI scripts, to
version and deploy content models alongside your application code"). Same practice; "code-first" is
just the wrong label for it on SaaS.

## An environment is an instance, not a folder

On Optimizely SaaS, one environment is generally **one CMS instance**. There is no "promote this
branch of the tree to Production" button. So "promotion" means **pointing the same code at a
different instance**, which is entirely a matter of credentials:

```
.env        → primary instance   (npm run opti-push)
.env.uat    → second instance    (npm run opti-push:uat)
```

`optimizely.config.mjs` contains **no environment settings at all** — it just lists which components
to push. The target is decided by `OPTIMIZELY_CMS_URL` + client ID/secret in the env file. Same code
plus different credentials equals the same model, everywhere. `.env.*` is gitignored (only
`.env.example` is committed).

## What a model push does, and does not do

The single most important table here. `config push` takes only `--dryRun`, `--force`, `--host` and
`--output`: **there is no `--prune`, `--delete` or `--sync`.**

| Change in your code | Effect on the target instance | Content impact |
|---|---|---|
| **New** type | Created | None |
| **Safe edit** (add optional field, change display name / help text / group) | Updated in place | None |
| **Breaking edit** (add required field, remove or retype a field, shared → per-language) | **Refused** unless `--force` | With `--force`, that field's data can be lost |
| **Type deleted from the repo** | **Nothing — it stays on the instance** | None |
| Content items | **Never touched by a model push** | — |

**Push is additive/upsert only. It never deletes.** Proof from this project: the scaffold's demo types
were excluded from the config glob and still had to be removed by explicit scripts
(`cleanup-legacy.mjs`, `retire-legacy-articles.mjs`), and the CLI keeps deletion behind a separate
`danger delete-all-content-types` command.

So **content on an upper environment is safe by default**. The only ways content data is lost are a
*forced* breaking change that removes or retypes a field, or flipping localization ON → OFF (which
deletes that field's values in every language). Both need a human to pass `--force` deliberately.

> **Never put `--force` in CI for UAT or Production.** A promotion that fails on a breaking change is
> the safety net working. Snapshot, review, and apply it by hand, with a maintenance note.

## Promoting the model

CI does this automatically per branch (`promote.yml`). Manually, against any instance:

```bash
npm run opti-login:uat     # verify the credentials reach the right instance
npm run opti-snapshot:uat  # JSON snapshot of the CURRENT types = your rollback reference
npm run opti-push:uat      # sync the model
```

Four rules, all learned the hard way on this project:

1. **A real push is the only validator.** `--dryRun` bundles locally and does not call the CMS, so it
   cannot catch what the API will reject (we proved this: a field the CMA refuses passes dry run
   happily). Never treat a clean dry run as a green light.
2. **Breaking changes need `--force`, and direction matters.** Adding a required field, removing or
   retyping a field, or flipping shared → per-language is "breaking". Optimizely's semantics:
   **OFF → ON preserves** existing values (they become the master-language version); **ON → OFF
   deletes** them, in every language, permanently. So `--force` is documented-safe in the OFF → ON
   direction and genuinely destructive in reverse. Snapshot first, force, then verify counts.
3. **Push the model BEFORE deploying the app.** The front end queries the new types, so if the app
   ships first, delivery queries fail on unknown types. Model push is a *pre-deploy* step.
4. **Schema propagation is not instant.** A just-pushed type can take a few minutes to be queryable.

## Promoting content (the honest answer)

| Approach | Use it for | Reality |
|---|---|---|
| **Author directly in the target** | Real editorial content | Content's home is Production. Authors write there; drafts and preview cover review. Nothing to promote. |
| **Scripted seeding via the CMA** | Taxonomy, reference data, demo/baseline content | What `/scripts` does: content defined as data in the repo, pushed to any instance. Repeatable and idempotent. |
| **Export / import** | Bulk one-off moves | Limited on SaaS; usually ends up being a CMA script anyway. |
| **Manual re-entry** | A handful of pages | Fine at small volume, does not scale. |

The platform actively nudges you this way: our CLI key can push content **types** but is *Forbidden*
from creating content **instances** or applications. Content authoring is deliberately a CMS-UI (or
scoped-key) activity.

**UAT does not need to mirror Production.** It needs *representative* content, enough to validate the
model and the front end. Seed it with the scripts.

## The two migration routes (and which to use when)

Optimizely's own guidance for SaaS splits the job in two, and so do we:

| What | Route | Trigger | Endpoint / tool |
|---|---|---|---|
| **Content model** (types, property groups, display templates) | **Manifest REST API or the CLI**, from CI | Automatic, every promotion | `optimizely-cms-cli config push` — the CLI wraps `GET/POST /v1/manifest` |
| **Content data + media** (pages, blocks, assets, language variants) | **Export / Import package** | Manual, deliberate, per test cycle | Admin UI **Settings → Export Data / Import Data**, or `POST /v1/experimental/packages` |

**Why the model is automated and the content is not.** The model is a deterministic function of the
repo, so a machine should apply it on every promotion. Content is not: an environment's content is
authored *in* that environment, and a pipeline that routinely copies DEV content into UAT will one
day flatten a tester's work in the middle of a UAT cycle. Content movement is a decision, so it gets
a human trigger.

Optimizely recommends exactly this split: automate model deployment via the Manifest REST API or CLI,
and use Export/Import for actual content data and media during testing cycles.

### Route 1 — the model, from CI only

Already built: [`promote.yml`](../.github/workflows/promote.yml). It runs on a push to
`main`/`uat`/`production`, **and** on `workflow_dispatch` with an environment picker — so a model
push to any instance can be run from the Actions tab with **nothing executed from a laptop**. The
`npm run opti-push:uat` script stays in `package.json` as a local escape hatch for debugging; it is
not the promotion path.

Two useful details from the API docs:

- **`cms-ignore-data-loss-warnings: true`** is the raw-API equivalent of the CLI's `--force`. Same
  semantics, same danger, same rule: **never in CI.** A promotion that fails on a breaking change is
  the safety net working.
- A manifest export doubles as a **rollback reference**; the workflow already snapshots one to a
  90-day artifact before every push.

### Route 2 — content data, deliberately triggered

`.episerverdata` packages carry content, definitions and assets. Import offers **"Update existing
content items with matching ID"**, which preserves GUIDs across instances — that is what makes a
*repeat* import an update rather than a duplicate. Always tick it.

Limits: ~500MB via the UI, ~2GB via the API, plus an execution-time ceiling Optimizely
acknowledges it is still working on.

> ⚠️ **`POST /v1/experimental/packages` is marked *experimental*** — the word is in the URL. Good
> enough for a bootstrap or a refresh you supervise; do **not** make it the unattended backbone of
> production promotion until it leaves experimental.

**Unknowns to verify empirically before trusting it** (the docs do not state these, and they matter
most to this project):

1. Do **language variants** survive the round trip? We have 187 EN + 187 AR.
2. Does **publish state** survive, or does everything arrive as Draft?
3. Do **`routeSegment` values** survive per language? Our AR slugs were hand-aligned; regenerating
   them would reintroduce the 404s that S3.9 fixed.
4. Does the CMS API key need broader scope to import content? Ours is deliberately **Forbidden from
   creating content instances** — a restriction we want to keep, so if import needs more, the extra
   scope belongs to a separate, tightly-held key.

Answer these on the first UAT bootstrap and record the results here, rather than assuming.

### Bootstrapping UAT content

UAT does not need to mirror DEV. It needs **representative** content. Two options, in preference order:

1. **Seed scripts** (`npm run seed:uat` and friends) — reproducible, reviewable, versioned, and they
   already work. Best when you want a known baseline.
2. **Export/Import package** — best when you specifically want *today's DEV corpus*, translations and
   all, without re-running the whole content pipeline.

Do one, verify counts in both languages, then leave UAT alone and let it diverge. Divergence is
correct: it means people are testing.

### Verifying a content migration

Do not eyeball 187 items in two languages. `npm run verify:content` prints a per-type, per-locale
inventory of everything **published** on an instance, and flags the two failure modes that matter:
items with no counterpart in the other locale, and URLs that differ between locales (the S3.9
language-switch 404).

```bash
npm run verify:content -- --out=dev.json      # BEFORE: inventory the source
# ... run the migration ...
npm run verify:content:uat -- --compare=dev.json   # AFTER: prove the target matches
```

It reads Optimizely Graph, which only ever returns **published** content — so an item appearing in
the inventory *is* the proof it is published, and a draft is simply absent. That is what makes the
count a sufficient answer to "did publish state survive the import?".

## A promotion runbook

1. **Feature branch** — change the content type → `npm run opti-push` against DEV → build the
   component → verify locally.
2. **PR review** → squash-merge to `main`. CI promotes the model to **DEV** and deploys
   `thisisdubai-dev`. Verify it there.
3. **Promote to UAT** — open a PR **`main → uat`** and **merge it with a merge commit** (never
   squash: see CONTRIBUTING). CI snapshots Instance 2, pushes the model, deploys `thisisdubai-uat`.
   Seed representative content once with `npm run seed:uat`, then test.
4. **Promote to Production** — open a PR **`uat → production`**, same merge-commit rule. CI waits for
   an approving reviewer, snapshots Instance 3, pushes the model, deploys `thisisdubai`. Author
   content is untouched, because only the schema moved.

If step 3 or 4 fails with a breaking-change error, that is the guard working: pull a snapshot, review
what would be lost, and apply it by hand with `--force` during a maintenance window.

## One-time setup checklist

**Per environment, in GitHub → Settings → Environments** (`dev`, `uat`, `production`):
- Secrets: `OPTIMIZELY_CMS_URL`, `OPTIMIZELY_CMS_CLIENT_ID`, `OPTIMIZELY_CMS_CLIENT_SECRET`
- Secret: `VERCEL_DEPLOY_HOOK_URL` (Vercel → Project → Settings → Git → Deploy Hooks)
- On `production` only: add a **Required reviewer** so promotion needs approval

**Per Vercel project** (`thisisdubai-dev`, `thisisdubai-uat`, `thisisdubai`):
- **Disable Git auto-deploy** for the tracked branch (CI triggers the deploy instead — see the deploy
  race above). Vercel → Settings → Git → *Ignored Build Step* returning exit 0, or disconnect the
  branch and rely solely on the Deploy Hook.
- Environment variables pointing at **that tier's instance**: `OPTIMIZELY_CMS_URL`,
  `OPTIMIZELY_GRAPH_SINGLE_KEY`, `OPTIMIZELY_GRAPH_GATEWAY`, **`APPLICATION_HOST`** (that project's own
  public host — see the gotcha below), plus server-only secrets
  (`PREVIEW_SIGNING_SECRET`, `PREVIEW_ADMIN_SECRET`, `REVALIDATE_SECRET`,
  `OPTIMIZELY_GRAPH_APP_KEY`/`SECRET`). **Generate fresh secrets per environment; never share them.**
- `SITE_INDEXABLE`: **unset on dev and uat**, `true` only on production. A UAT site getting indexed is
  a classic, avoidable SEO incident; `robots.ts` fails closed, so leaving it unset is the safe default.

**Per CMS instance:** create its own least-privilege API key. Ours pushes content *types* but is
Forbidden from creating content *instances* — keep that restriction; it is a feature, not a limitation.

### Gotcha: Environment *variables* are not Environment *secrets*

The first UAT dispatch reported **Success** and promoted nothing. The credentials had been added to
the `uat` GitHub Environment, but on the **Variables** tab rather than the **Secrets** tab.
`promote.yml` reads `secrets.*`, so they were invisible to it, and the workflow's
skip-when-unconfigured branch did its job a little too well.

Two fixes, both shipped:

- Put `OPTIMIZELY_CMS_URL`, `OPTIMIZELY_CMS_CLIENT_ID` and `OPTIMIZELY_CMS_CLIENT_SECRET` under
  **Settings → Environments → `<env>` → Environment secrets**. If you can read the value back, it is
  a variable, not a secret.
- `promote.yml` now **fails loudly on a manual dispatch** with missing credentials (a human asked for
  a promotion, so silence is wrong) while still **skipping cleanly on an ordinary push** (a branch may
  legitimately have no instance yet). The error names the likely cause in the job summary.

### Gotcha: a missing `APPLICATION_HOST` fails quietly

Hit on the first DEV deploy. With it unset, the app does not crash, it silently degrades:

- `canonical` and `hreflang` are emitted as **relative** URLs (`href="/en"`). hreflang requires
  absolute URLs, so every alternate is invalid.
- `sitemap.xml` returns a **valid but empty** urlset (the sitemap is gated on an absolute host).

Both are easy to miss because every page still returns 200. Set it per Vercel project to that
project's own public origin and redeploy. After the fix on DEV: absolute canonical/hreflang, and the
sitemap went from 0 to **159** URLs. Verify with:

```bash
curl -s https://<host>/en | grep -oE '<link rel="(canonical|alternate)"[^>]*>'
curl -s https://<host>/sitemap.xml | grep -c "<url>"
```

**Note the ordering trap:** on a brand-new Vercel project you do not know the final URL until after
the first deploy, so `APPLICATION_HOST` is necessarily a second pass (set it, then redeploy). Attaching
a custom domain up front avoids the round trip.

## Tearing down a throwaway environment

When a demo/sandbox instance has served its purpose, remove content **first**, then the types
(a type cannot be deleted while instances of it exist).

```bash
# 1. Content — dry run first (lists everything, deletes nothing)
npm run teardown:env -- --env=uat

# 2. Content — for real
npm run teardown:env -- --env=uat --confirm-host=<the instance host> --apply

# 3. Content types
node --env-file=.env.uat ./node_modules/@optimizely/cms-cli/bin/run.js danger delete-all-content-types
```

`teardown-env.mjs` is irreversible, so it carries four independent guards, all of which must pass:

1. **Dry run by default** — nothing is deleted without `--apply`.
2. **Explicit env file** — `--env=uat` reads `.env.uat` and will *not* fall back to the default `.env`,
   so the primary instance cannot be hit by forgetting a flag.
3. **Host confirmation** — `--confirm-host=<host>` must match the host in that env file.
4. **Protected-host denylist** — if the target host equals the host in the default `.env`, the script
   refuses outright, regardless of every other flag. (Verified: it refuses even with `--apply`.)

Deletion runs **deepest path first** so children go before their containers.

## Front end (Vercel)

Each environment is its own Vercel project (or environment) whose variables point at that instance:
`OPTIMIZELY_CMS_URL`, `OPTIMIZELY_GRAPH_SINGLE_KEY`, `OPTIMIZELY_GRAPH_GATEWAY`, `APPLICATION_HOST`,
plus the server-only secrets (preview signing, revalidation). Any env-var change needs a redeploy.

## Related docs
- [`scripts/README.md`](../scripts/README.md) — what every script does, in plain language
- [`docs/OPTIMIZELY-BEST-PRACTICES.md`](OPTIMIZELY-BEST-PRACTICES.md) §10 (environments) and §12 (gotchas)
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) §8 (environment & secrets)
