---
title: "Shareable stakeholder previews on Optimizely SaaS CMS (headless): login-free links to unpublished content"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, headless, preview, draft-mode, governance, nextjs]
---

> **Draft for review.** Written from a delivery/architecture point of view: the decisions and the
> traps, not the implementation. Screenshot placeholders marked for capture before publishing.

## The request that has no button

Every content team I have worked with eventually asks the same thing, usually about three weeks
before go-live:

> "Can you send the client a link so they can see the new page before we publish it?"

It sounds like a settings toggle. It is not. On a headless Optimizely SaaS build it is a small
feature with a surprising amount of architecture behind it, and the way you answer it says a lot
about how your publishing governance actually works.

The reviewer in this scenario is almost never a CMS user. They are a legal reviewer, a brand
manager, a client sponsor, a regional lead. They will not be given an account, they will not be
trained, and they will open the link on a phone. They need to see the page as it will look, know
that it is not live yet, and reply "approved".

📷 [Screenshot: the CMS editor's preview pane, with the content still in Draft status]

## Why this is trickier than it looks

### The built-in preview is for the author, not the audience

Optimizely SaaS gives you a genuine on-page preview: the CMS iframes your application and passes a
preview token so your app can render the draft version, with live updates as the author types. It is
excellent, and it is the right tool for the person doing the editing.

It is also, by design, bound to the editing session. The preview token is short-lived (think minutes,
refreshed as the author saves) and it arrives inside the editor context. You cannot copy that URL
into an email on Tuesday and expect it to work on Thursday. That is not a flaw. A credential that
unlocks unpublished content *should* be short-lived. It just means the external-reviewer use case is
a different feature, not the same one used differently.

I find it helps to name the two layers explicitly with stakeholders:

| | Layer 1: editor preview | Layer 2: stakeholder link |
|---|---|---|
| Who is it for? | The author, while editing | A reviewer with no CMS account |
| How long does it last? | Minutes, tied to the session | Days, chosen when the link is created |
| Where does it live? | Inside the CMS editor | Any browser, any device |
| Ships out of the box? | Yes | No, you build it |

Being clear about this early stops the conversation where someone insists the feature already exists
because they once saw a preview pane.

### Deployment previews are not content previews

If your frontend is on a platform that builds a preview URL per branch, someone will suggest using
that. It is a genuinely useful thing, and it is answering a different question. A deployment preview
shows *unreleased code against published content*. A stakeholder preview shows *released code against
unpublished content*. Conflating them leads to a reviewer approving a page that nobody can actually
ship, or worse, signing off on content they were never shown.

Worth putting that sentence in a project glossary. I have watched it save an hour in a status
meeting more than once.

### Headless means preview is your problem

In a coupled CMS, the server renders the page, so it can render a draft version of the page. Go
headless and your application owns rendering. That is the trade you accepted for the performance and
the flexibility, and preview is where the bill arrives. Nothing renders a draft unless you write the
code that asks for one.

### The credential that reads drafts is the dangerous one

This is the part that turns a nice-to-have into an architecture conversation. Optimizely Graph gives
you two very different credentials:

- a **public delivery key**, read-only and published-content-only, which is safe in a browser
- an **application key plus secret**, which reads unpublished content and can write to the index

Only the second one can see a draft. It is effectively a super-user credential. So the feature
request "let this reviewer see the draft" contains, hidden inside it, the requirement "without
letting anything reach the browser that could read every draft on the estate, or write to the index".

That constraint drives the whole design.

## The approach

The shape that worked is a signed link plus a server-side read. Nothing clever, but each piece is
doing a specific job.

```
Author                      Your app (server)                 CMS / Graph
  |                              |                                |
  |-- create link -------------> |                                |
  |                              | sign {item, locale, version,   |
  |                              |       path, expiry}            |
  |<-- https://…/share?token=…   |                                |
  |                              |                                |
  |== send to reviewer ==>       |                                |
                          Reviewer opens link                     |
                                 |                                |
                                 | verify signature + expiry      |
                                 | enable draft mode (cookie)     |
                                 | redirect to the page           |
                                 |                                |
                                 |-- read draft (server creds) -> |
                                 |<-- unpublished version --------|
                                 | render, uncached, noindex      |
```

The token is the whole security model, so it is worth being precise about what it is. It is a signed
statement, not a credential. It says "the bearer may view this one item, in this locale, until this
timestamp". It contains no keys. It grants the *server* permission to do a privileged read on the
bearer's behalf, and only for that one item. The keys never move.

Four decisions inside that flow are worth calling out, because they are where teams diverge.

**Scope the link to one item, not to a mode.** More on this below. It is the mistake I made.

**Default to "latest draft", offer "pin this version".** If the link always shows the newest
unpublished state, the author can keep working after sending it, which is what actually happens. A
pinned version is the right default only when someone needs a frozen artefact for a compliance
record. Offering both, with latest as the default, matched how teams behave.

**Choose an expiry, and make it short by default.** A week covers a normal review cycle. Thirty days
covers an awkward one. Anything longer is a standing grant that nobody remembers issuing.

**Never render a draft through a shared cache.** Covered below, and it is the one that would have
been a genuine incident.

📷 [Screenshot: the link generator UI, showing items with unpublished edits and the expiry selector]

## What broke

This is the useful part. Six things went wrong, and four of them were silent.

### 1. The SDK could not do what the design assumed

The plan said, in effect, "call the SDK's preview method with the application key". I had written
that down before checking, on the reasonable-sounding assumption that an official SDK with a preview
concept would accept the credential that can read previews.

It does not. The client authenticates as either the public delivery key or the editor's short-lived
token, and there is no third option. There was no preview-enabling switch to flip.

The fix was straightforward once the fact was established: extend the client at the transport layer
so the privileged credential is used for the authorization header, and let the SDK keep doing
everything else (query generation, type resolution, response shaping). That is a small, contained
override rather than a reimplementation.

The lesson is about sequencing, not about the SDK. **Validate the authentication model of a
dependency before you design on top of it.** A thirty-minute read-only spike against the live
service would have saved the design a rewrite. I now treat "which credential does this library
actually send?" as a question to answer during planning, not during implementation.

### 2. The newest draft is not the highest version number

This one is my favourite, because it fails silently and convincingly.

The obvious way to find the draft is to list the versions of an item and take the highest number.
I did that. The preview worked. The page rendered. The banner appeared. Everything looked correct.

Then I compared the output against the live page and they were identical, because in the CMS I was
querying, the item's draft carried a **lower** version number than its published version. Version
numbers are identifiers, not a chronology, and they are certainly not a status.

The correct approach is to select on the version's **status** and break ties on the last-modified
timestamp. Never on the number.

📷 [Screenshot: the version list for a single item, showing a Draft with a lower version number than
the Published one]

The wider lesson is about how this class of bug presents. A preview that shows the published page
looks exactly like a preview that works, right up until a stakeholder approves a page they never
saw. If you build this, put the acceptance test on a *difference*: make an edit, do not publish it,
and assert the preview shows the change and the live URL does not. Do not test that the page loads.

### 3. A privileged credential changed the query semantics

Once requests were authenticated with the application key, a query that had reliably returned one
result per locale started returning every locale's versions interleaved. The locale argument on the
query was no longer narrowing anything. The fix was to filter on the item metadata explicitly rather
than rely on the argument.

I had half-expected a privileged credential to show me *more rows*. I had not expected it to change
what a filter meant. Notably, a colleague on the same project had already been bitten by this in a
content-migration script months earlier, and the knowledge had not made it anywhere durable.

**Write down cross-cutting gotchas where the next person will trip on them**, not in the pull request
that discovered them. This one now lives in the repository's architecture notes with a one-line
explanation, because it will happen again.

### 4. Draft mode is a boolean, and I needed a scope

Most frontend frameworks have a draft or preview mode: a cookie that tells the server "this visitor
may see unpublished content". I turned it on when the link was verified, and moved on.

Then I opened a preview link for one page and browsed to a completely different page. It showed me
that page's draft too. One link had unlocked every unpublished item on the site.

The framework's flag was doing exactly its job. It answers "may this visitor see drafts?" It has no
opinion on *which* drafts, because it has no idea what the link was for. The signed token knew, and I
had thrown it away after verifying it.

The fix: keep the signed token in an HTTP-only cookie alongside the draft flag, re-verify it on every
request, and serve unpublished content only when the token's item matches the page being rendered.
Anywhere else, the reviewer gets the normal published site. Two independent conditions now have to
hold, and the second one carries the scope.

This is the single most important design point in the whole feature, and it is the one that is
easiest to miss, because the naive version demos perfectly. You only find it by deliberately
wandering off the page you were sent.

### 5. The cache would have published the draft for me

The site had cross-request caching on content reads, keyed by path and shared by every visitor. That
is exactly what you want for published content and exactly what you must not do for a draft. The
first reviewer to open a preview link would have written the unpublished version into a cache that
the anonymous public then reads.

Draft reads have to bypass the shared cache completely and tell the content service not to serve a
cached response either. Within a single request you can still deduplicate, which is worth doing
because the page and its metadata both want the same data. Across requests, never.

The general rule I would give anyone building this: **any cache keyed on something less specific than
the viewer's authorization is a leak waiting for privileged content to be put into it.** Path is less
specific than authorization. So is locale. So is almost everything convenient to key on.

### 6. The locale prefix got applied twice

A small one, but representative. On a multilingual site the CMS path for a non-default language
already carries its language segment, and the routing layer adds one when it redirects. Pass the
CMS path straight into the token and the reviewer lands on a doubled path that does not exist.

Trivial to fix once seen. Impossible to see without testing the second language. Which is the point:
if you have a multilingual site, **every preview test has to be run twice.** The English path is the
one that hides this class of bug.

## Guardrails worth building in from the start

These are cheap at design time and awkward to retrofit.

| Guardrail | Why |
|---|---|
| Force `noindex` on any draft response | An unpublished page must never reach a search index. Set it at the edge, not just in page metadata, so it holds regardless of other settings |
| Disallow the preview and admin routes in `robots.txt` | Belt and braces, and free |
| Make the link read-only | A reviewer with no login should not be able to trigger a publish. Keep publishing in the CMS where the audit trail lives |
| Fail closed on missing configuration | If the signing secret is absent, refuse to sign and refuse to verify. A misconfigured deployment should mint nothing, not mint forgeable links |
| Fall back to published content on any error | A preview link should degrade to the live page, never to a 500. Log the failure for the operator |
| Keep privileged credentials server-side, always | The reason the whole design exists |

One more that is easy to overlook: if you sign both your share links and any admin session with the
same secret, **separate the two domains** by including a distinguishing prefix in what you sign.
Otherwise a share token, which every reviewer holds for weeks, is byte-for-byte a valid admin
session. That is a five-line change and a genuinely nasty hole if you skip it.

## The governance conversation you should have

The engineering is a few days. The policy questions outlast it, and they are the ones a delivery lead
should be asking:

- **Who can generate a link?** A single shared secret is fine for a small team and terrible for
  attribution. If it matters who shared what, put link generation behind the same identity provider
  as the CMS.
- **How long should links live, by default?** Whatever you set as the default is what almost every
  link will use. Choose it deliberately.
- **Can a link be revoked before it expires?** If you have not built per-link revocation, the
  emergency lever is rotating the signing secret, which invalidates every outstanding link at once.
  Know that in advance rather than discovering it during an incident.
- **Are generated links logged?** For most marketing sites, no. For regulated content, that answer
  will not survive an audit.
- **What happens when the content is published?** The preview link should quietly become identical to
  the live page. If your cache invalidates on publish, this is already true. If it does not, the
  reviewer sees stale content and calls it a bug.

I would rather ship a small feature with the gaps written down than a bigger one with them assumed
away. Naming "no revocation, no audit log, shared secret" as known limitations in the documentation
took ten minutes and made the follow-up conversation with the client honest.

📷 [Screenshot: a previewed page showing the unpublished-draft banner and an exit control]

## What I would tell the next team

1. **Spike the credentials before you design.** Which credential does your SDK actually send, and what
   does the privileged one change about your queries? Half an hour, read-only, against the real
   service.
2. **Test for a difference, not for a page load.** Make an unpublished edit and assert the preview
   shows it and the live URL does not. A preview that silently renders published content passes every
   other test you would think to write.
3. **A preview mode flag is not an authorization scope.** Carry the scope yourself, in something
   signed, and re-check it on every request.
4. **Assume every shared cache is a publishing mechanism.** Because for privileged content, it is.
5. **Run the whole flow in your second language.** Half of these bugs only exist off the default
   locale.
6. **Write the guardrails down as guardrails.** The noindex, the fail-closed behaviour, the read-only
   constraint. They read as paranoia in a pull request and as diligence in a security review.

None of this is exotic. It is the ordinary shape of putting a privileged read behind a public link,
which is a problem plenty of teams solve and comparatively few write up. The Optimizely-specific part
is small: know which credential reads drafts, know that it is a super-user, and know that version
numbers will lie to you about which version is newest.

## Closing

The feature that started as "can you just send them a link" ended up touching authentication,
caching, localization, search indexing, and publishing governance. That is usually the sign of a
requirement worth taking seriously rather than one worth deflecting.

I would genuinely like to hear how other teams have handled this. In particular: has anyone built
per-link revocation and found it worth the complexity, and how are you handling attribution when the
reviewers are external and the authors are not all in the same organization? If you have solved the
audit-trail question elegantly, I would like to steal it.

## Related
- Securing a headless Optimizely SaaS build: which credential does what, and where each one is allowed
  to live
- Live Visual Builder preview for a headless application: wiring the editor-side preview end to end
- Fast and fresh: content caching and on-demand revalidation on publish
