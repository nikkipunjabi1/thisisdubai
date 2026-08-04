---
title: "Security best practices with Optimizely SaaS CMS (headless)"
status: outline
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, security, hmac, secrets, headless, bff]
---

> **Outline / research notes for post #17.** Not a draft yet. This captures the key material
> (especially HMAC key handling) so the detail is not lost; expand into the full post later, in the
> generic, professional voice (see docs/BLOG-PLAN.md editorial standards). Screenshot placeholders
> and code stay high-level in the final piece.

## Why this post

A headless Optimizely SaaS build has more credentials in play than a classic monolith: a public
delivery key, an HMAC App key + Secret, CMA client credentials, preview tokens, and webhook secrets.
Each has a different blast radius. Getting one of them into a browser bundle or a committed `.env` is
the classic, avoidable mistake. This post is the map of which key does what and how to handle each.

## The headline topic: handling HMAC keys (Optimizely Graph)

Optimizely Graph offers two very different credentials, and the whole security story starts with
telling them apart.

### Single key vs HMAC App key + Secret

| Credential | Header | Access | Safe in the browser? |
|---|---|---|---|
| **Single key** | `epi-single …` | Read-only; **published, non-expired, public** content only | **Yes**: the only browser-safe Graph credential |
| **HMAC (App key + Secret)** | `epi-hmac APP_KEY:TIMESTAMP:NONCE:SIGNATURE` | **Super-user**: returns all content regardless of publish status / RBAC, and grants **read AND write** to the schema | **No, never** |

The critical fact to record: **HMAC is effectively unrestricted.** Optimizely's own docs describe an
HMAC query as *"equivalent to querying as a super user"*; it returns everything regardless of
publication status or role-based access control, and the App key + Secret allow **read and write**
access to the CMS schema (it is the same credential used for content ingestion/sync). Anyone holding
it can read unpublished content and write to your index.

### The rule: HMAC keys are server-side secrets, full stop

- **Never put the HMAC App key or Secret in frontend/client code**, a browser bundle, a public repo,
  or any client-reachable config. Optimizely's guidance is explicit that these must not be used from
  frontend code because they provide *"full access to all Graph resources without restriction."*
- **If the browser needs authenticated/draft data, put a Backend-for-Frontend (BFF) in front of
  Graph.** The browser calls your server; your server signs the HMAC request and proxies it. The
  Secret never leaves the server. (In a Next.js app this is a server component / route handler doing
  the signed call; the client only ever sees the response.)
- **Use the single key for everything public.** Published delivery to the browser should authenticate
  with the single key, which can only ever return public, published content, so a leak is low-impact.
- **Scope HMAC reads to RBAC when needed** with the `cg-username` and `cg-roles` request headers: a
  content item is only returned if it matches `u:{username}:Read` or `r:{role}:Read`. Useful for
  gated/personalized content behind the BFF.

### How to store and rotate

- Keep the Secret in **server-side secret storage / environment variables**, never committed.
  `.env` is gitignored; secrets live in the host's secret manager (e.g. the deploy platform's env
  vars), not in the repo.
- **Rotate regularly** and treat the keys as sensitive credentials, like a password or API token.
  Have a rotation runbook so a suspected leak is a 10-minute fix, not a rebuild.
- **HTTPS on every request.** The HMAC header carries a **timestamp + nonce** specifically for
  **replay protection**; don't strip, cache, or replay them.
- **Least privilege by default:** reach for the single key first; reserve HMAC for the narrow set of
  server-side jobs that genuinely need it (draft/preview reads, ingestion, admin queries).

📷 **[Screenshot: the Optimizely Graph keys screen showing the single key vs the App key + Secret.]**
📷 **[Diagram: browser → BFF (holds HMAC secret) → Optimizely Graph; single key path for public reads.]**

## The other credentials in a headless SaaS build (to expand)

The HMAC section above is the priority; these round out the post.

- **CMA (Content Management API) client credentials**: the OAuth `client_id`/`client_secret` used by
  content-write scripts (seed, imagery, SEO fill). Also **read/write**; same rule: server-side only,
  gitignored, rotated. Run bulk writes as reviewable, dry-run-first, named scripts (never ad-hoc).
- **Preview tokens**: short-lived (~5 min), scoped to the preview flow; fine for live editing, not a
  durable share mechanism. Don't treat a preview token as an auth substitute.
- **Revalidation / webhook secrets**: the Graph-publish -> `revalidateTag` webhook must be
  **secret-gated** (verify a shared secret / signature on every call) so it can't be triggered by the
  public. Server-side only.
- **Least-privilege access**: separate credentials per purpose and environment; don't reuse the prod
  HMAC secret in dev; grant only the scope each integration needs.
- **Safe content-write scripts**: dry-run first, read-merge-write (never blind overwrite), and keep
  the write credentials out of the repo and out of CI logs.

## Lessons / checklist (to draft)

- The single key is the only credential that belongs in the browser.
- HMAC App key + Secret = super-user (all content + write): server-side only, behind a BFF.
- Secrets in env/secret-store, `.env` gitignored, rotate on a schedule and on any suspected leak.
- HTTPS everywhere; don't defeat the timestamp/nonce replay protection.
- Secret-gate every webhook; scope every integration to least privilege.

## Sources (verify before publishing)

- [Optimizely Graph: HMAC authentication](https://docs.developers.optimizely.com/platform-optimizely/docs/hmac-auth)
- [Optimizely Graph: Authentication (Basic, Bearer, HMAC, Single Key)](https://docs.developers.optimizely.com/platform-optimizely/docs/authentication)
- [Optimizely Graph: Basic auth (App key + Secret)](https://docs.developers.optimizely.com/platform-optimizely/docs/basic-auth)
- [Optimizely Graph Best Practices: Security, Access Control and Performance (community, Jan 2026)](https://world.optimizely.com/blogs/jon-williams/dates/2026/1/optimizely-graph-best-practices---security-access-control-and-performance-optimisation/)
