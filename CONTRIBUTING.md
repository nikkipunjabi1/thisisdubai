# Contributing & Workflow — This is Dubai

Our DevOps branching/merging process. **`main` is protected and always deployable; all changes
land via reviewed Pull Requests.**

## Branching model (trunk-based, PR-per-unit-of-work)
- **`main`** — protected, always deployable, production source of truth. No direct pushes.
- **Feature branches** — one per sprint or self-contained unit of work, branched off `main`.
- **Naming:** `type/short-kebab-description`
  - `feat/…` new feature · `fix/…` bug fix · `docs/…` documentation ·
    `chore/…` tooling/config · `refactor/…` · `perf/…` · `test/…`
  - Examples: `feat/scaffold-optimizely-sdk`, `feat/semantic-search`, `docs/planning-foundation`

## The loop (who does what)
1. **Claude** creates a feature branch, does the work in small commits, pushes, and opens (or
   provides a link to open) a **PR into `main`** with a clear description + checklist.
2. **Nikki** reviews the PR at intervals and **merges to `main`** (squash-merge preferred for a
   clean history). Claude does **not** merge to `main`.
3. Merges to `main` trigger the production deploy (Vercel); PRs get **preview deployments** once
   the app exists.

## Commit convention (Conventional Commits)
`type(scope): summary` — e.g. `feat(search): add semantic search page`,
`fix(preview): correct draft-mode cookie`. Keep commits focused; write present-tense summaries.
Every commit is co-authored by the assistant per repo policy.

## PR guidelines
- **Small and reviewable** — roughly one sprint per PR (see `docs/SPRINTS.md`).
- Title mirrors the sprint/goal; body states what changed, how to verify, and any follow-ups.
- Must pass: typecheck, lint, build (once the app exists). No secrets committed (`.env` is ignored).
- Link the relevant sprint (e.g. "Closes S2.3").

## Keep docs in sync (no silent drift)
Some files are human-readable indexes that must be updated in the **same PR** as the change they describe, or they quietly go stale:
- **Add or change a script in `/scripts`** → add/adjust its row in [`scripts/README.md`](scripts/README.md) (the plain-language index for PMs/BAs/new joiners). Every script also carries a `//` purpose comment at the top of its own file.
- **Add a new `docs/` file** → add it to the Docs table in [`README.md`](README.md).
- **Change content/imagery source data** → the derived lists (`docs/ASSET-MANIFEST.md`, CMP folders) regenerate from data, so re-run the generator rather than hand-editing.

## Environments (once the app exists)
- `main` → **Vercel production**.
- Open PRs → **Vercel preview deployments** (share these for quick UI review).
- Content preview for stakeholders is separate — see `docs/PREVIEW-WORKFLOW.md`.

## Optional: enable `gh` CLI
Installing GitHub CLI (`brew install gh` → `gh auth login`) lets Claude open PRs directly instead
of sharing a compare link. Until then, Claude pushes the branch and provides the PR link.
