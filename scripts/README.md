# Scripts Index

This folder holds the **automation scripts** for the This is Dubai project. They talk directly to the Optimizely SaaS CMS (and its media library) to create, update, tidy, or publish content in bulk, so we never have to do repetitive work by hand in the CMS UI.

This page explains, in plain language, **what each script is for and when you would use it** — no coding knowledge needed. If you are a developer, each script's own file has the technical detail in a comment at the top.

---

## How to read this (please read first)

A few concepts make everything below easy to follow:

- **Dry run vs Apply.** Almost every script is **safe by default**: running it just *prints what it would do* and changes nothing. It only makes real changes when you add `--apply`. So you can always preview first.
- **Idempotent** means **safe to run again**. If a script has already done its job, running it a second time does nothing harmful (it skips work that is already done). You will see this word a lot; it is a good thing.
- **Read-only** scripts never change anything; they just show you the current state.
- **Who runs these:** a developer, from a terminal. They need project credentials (kept in a local `.env` file). These are not run from inside the CMS.
- **The commands** look like `npm run <name>`. Where a script has no `npm run` shortcut, the full command is shown.

**Status legend used below:**

| Tag | Meaning |
|-----|---------|
| 🟢 **Reusable** | Run whenever you need it (e.g. after adding content). |
| 🔵 **Read-only** | Shows information only. Completely safe. |
| 🟠 **One-time / historical** | A migration we already ran once. Kept for the record; not for day-to-day use. |

---

## 1. Building and seeding content

Scripts that create content in the CMS from our project's source data.

| Script | Command | What it does | Status |
|--------|---------|--------------|--------|
| **seed** | `npm run seed` | Creates and publishes the core content tree (Home, the Places / Neighbourhoods / Events sections, and all the individual place, area, and event pages) from our source data. The backbone of the whole site. | 🟢 Reusable |
| **create-section** | `npm run create-section` | Creates a new section landing page (a Visual Builder page) with a starter layout. Used when we add a brand-new section to the site. | 🟢 Reusable |
| **create-things-to-do** | `npm run create-things-to-do` | Seeds the "Things to Do" campaign: a landing page plus its themed sub-pages, each with a starter layout. | 🟢 Reusable |

---

## 2. Imagery pipeline (photos for every page)

Getting a real photo onto every content item is a four-step chain. These run in order.

| Step | Script | Command | What it does | Status |
|------|--------|---------|--------------|--------|
| 1 | **asset-manifest** | `npm run asset-manifest` | Produces the master list of which image belongs to which content item, derived from our source data so it can never fall out of sync. | 🟢 Reusable |
| 2 | **cmp-folders** | `npm run cmp-folders` | Creates the matching folder structure in the media library (CMP / the DAM) so uploaded images have a home. | 🟢 Reusable |
| 3 | **source-images** | `npm run source-images` | Finds royalty-free photos (Unsplash / Pexels), uploads one per content item into the media library, and records the photo credits. | 🟢 Reusable |
| 4 | **attach-assets** | `npm run attach-assets` | Attaches the uploaded photos to the right content items in the CMS, so no image slot is left blank. | 🟢 Reusable |

> Note: the actual *uploading* of a brand-new image file cannot be fully automated by the CMS, which is why sourcing and attaching are separate steps.

---

## 3. Search-engine optimisation (SEO)

| Script | Command | What it does | Status |
|--------|---------|--------------|--------|
| **seo-fill** | `npm run seo:fill` | Fills in the SEO title and meta description on every page (used by Google and social shares), derived from each page's own name and summary. Never overwrites text an editor has already written, unless told to. | 🟢 Reusable |

---

## 4. Localization (Arabic)

Helpers for running the site in English and Arabic.

| Script | Command | What it does | Status |
|--------|---------|--------------|--------|
| **publish-ar** | `npm run publish:ar` | After translators have prepared Arabic versions and left them as drafts, this publishes all the Arabic drafts across the whole site in one pass. | 🟢 Reusable |
| **align-ar-slugs** | `npm run align:ar-slugs` | Makes each Arabic page's web address (the part after `/ar/`) match its English one, so switching language keeps you on the same page. Fixes a quirk where the CMS auto-generates a different Arabic address. Run this as the final step after a translation batch. | 🟢 Reusable |

---

## 5. Utilities

| Script | Command | What it does | Status |
|--------|---------|--------------|--------|
| **inspect-tree** | `node --env-file=.env scripts/inspect-tree.mjs` | Prints the current shape of parts of the content tree (where shared blocks and articles live). A quick "what does the CMS look like right now" check. | 🔵 Read-only |

---

## 6. Environments (promotion & teardown)

Moving work between CMS instances (Dev → UAT → Production). Full runbook: [docs/ENVIRONMENTS.md](../docs/ENVIRONMENTS.md).

| Command | What it does | Status |
|---------|--------------|--------|
| `npm run opti-push` / `opti-push:uat` | Sends the **content model** (field definitions) to an instance. Same code, different credentials: `.env` targets the primary instance, `.env.uat` targets a second one. | 🟢 Reusable |
| `npm run opti-snapshot` / `opti-snapshot:uat` | Saves a JSON snapshot of an instance's current content types. Run this **before** any risky model change so you have a rollback reference. | 🔵 Read-only |
| `npm run seed:uat` | Seeds the core content tree into the second instance (so UAT has representative content to test against). | 🟢 Reusable |
| **teardown-env** — `npm run teardown:env -- --env=uat` | ⚠️ **Deletes all content items** from a throwaway instance, for cleaning up a demo/sandbox environment. Dry-run by default; needs `--apply` **and** a matching `--confirm-host`, and flatly refuses to run against the primary instance. Delete content types afterwards with the CLI's `danger delete-all-content-types`. | 🔴 Destructive |

> 🔴 **Destructive** means irreversible. `teardown-env` is only ever for a throwaway environment, never the live one.

---

## 6. One-time migrations (historical record)

These were each run **once** to restructure content during the project's evolution. They are kept so the history is auditable and reproducible, but they are **not** part of normal operations. Do not run them unless you are deliberately redoing that specific migration.

| Script | What it did (once) | Status |
|--------|--------------------|--------|
| **migrate-experiences** | Converted the old section pages into the newer Visual Builder page format. | 🟠 One-time |
| **migrate-sitesettings** | Moved the global Site Settings from a hidden page into a reusable "shared block" so editors manage it from one place. | 🟠 One-time |
| **flatten-articles** | Moved articles out of year-based folders so they are visible and editable in the CMS Pages panel, and simplified their web addresses. | 🟠 One-time |
| **organize-shared-blocks** | Tidied reusable blocks (like the tag list) into named folders instead of a flat pile. | 🟠 One-time / occasional |
| **cleanup-legacy** | Removed retired content and empty folders left over after the shared-blocks migration. | 🟠 One-time |
| **retire-legacy-articles** | Deleted the old article pages after articles were re-modelled as shared blocks. | 🟠 One-time |

---

## Typical order for a fresh build

If someone were standing the site up from scratch, the reusable scripts run roughly in this order:

1. `npm run opti-push` — send the content model (the field definitions) to the CMS. *(This is a project command, not in this folder.)*
2. `npm run seed` — create the core content tree.
3. `npm run create-section` / `npm run create-things-to-do` — add section and campaign pages.
4. Imagery: `asset-manifest` → `cmp-folders` → `source-images` → `attach-assets`.
5. `npm run seo:fill` — fill in SEO fields.
6. Translation happens in the CMS, then `npm run publish:ar` and `npm run align:ar-slugs`.

Every one of these is safe to preview first (leave off `--apply`).

---

## Mini glossary

| Term | Plain meaning |
|------|---------------|
| **CMS** | The Optimizely system where content lives and editors work. |
| **CMA** | The behind-the-scenes interface the scripts use to read and write CMS content. |
| **CMP / DAM** | The media library where images are stored. |
| **Graph** | The fast read-only service the website uses to fetch published content. |
| **Experience** | A page built visually from blocks (Optimizely "Visual Builder"). |
| **Shared block** | A reusable piece of content (e.g. Site Settings, a tag) used in many places. |
| **Slug / route segment** | The readable part of a web address, e.g. `al-marmoom` in `/neighbourhoods/al-marmoom`. |
| **Locale** | A language + region, e.g. English (`en`) or Arabic (`ar`). |
| **Draft vs Published** | Draft = work in progress, not live. Published = live on the website. |
| **Dry run** | A safe preview that changes nothing. |
