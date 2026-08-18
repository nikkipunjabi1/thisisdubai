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

## Promoting the model

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

1. **Dev** — change the content type in a branch → `npm run opti-push` → build the component → verify.
2. **PR review** → merge to `main`.
3. **UAT** — `npm run opti-snapshot:uat` (backup) → `npm run opti-push:uat` → deploy the app → seed
   representative content (`npm run seed:uat`) → test.
4. **Production** — snapshot → push the model → deploy the app. Existing author content is untouched,
   because only the schema moved.

In CI, hold each environment's credentials as secrets and run the push as a pre-deploy step, so
promotion is identical every time and never hand-clicked. (Our `ci.yml` currently runs quality gates
only — type-check, lint, tests, build — so model promotion is a deliberate manual step today.)

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
