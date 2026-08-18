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
