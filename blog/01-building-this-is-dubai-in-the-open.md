---
title: "Building a Reference Project on Optimizely SaaS in the Open: Approach and Guardrails"
status: draft
audience: Optimizely community / dev.to / LinkedIn (long-form)
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, visual-builder, nextjs, headless]
---

> **Draft for review.** Screenshot placeholders are marked 📷; swap in real captures from your own
> Optimizely SaaS instance and GitHub before publishing.

## Why build in the open at all

There is a particular kind of learning that only happens when you ship. You can read the docs for a
platform end to end and still not understand it, because the docs describe the parts and never the
seams: the decision you regret three sprints later, the setting that turns out to matter, the feature
that looks trivial and eats a week. The fastest way to learn a modern CMS is to build a real,
production-shaped site on it, in public, where the mistakes are visible and the write-ups are honest.

I have come to believe a public, open-source reference project on **Optimizely SaaS CMS** is one of
the more useful things a practitioner can do, both for their own understanding and for everyone who
hits the same wall six months later and finds their notes. This post is not about any one site. It is
about the *approach*: why to do it, the one early decision that matters most, how to do it
responsibly, and a working method that keeps the whole thing honest.

If you are weighing up a learning project, a portfolio piece, or an internal proof of concept on
Optimizely SaaS, this is the advice I wish I had written down before starting rather than after.

## Pick a content-rich domain, not a toy

The first choice is what to build, and the temptation is to keep it small. Resist that. A five-page
brochure site will teach you almost nothing, because the interesting problems on a CMS only appear at
volume and variety: many content types, real relationships between them, editorial workflows, search
that has to be relevant, layouts an author actually composes.

Choose a domain that is genuinely content-heavy. It does not matter what the subject is (a travel
guide, a product catalogue, a news archive, an events directory); what matters is that it forces you
to model dozens of interrelated types, index a meaningful amount of content, and give editors a
composition experience worth defending. Neutral, invented content is fine and often better, for
reasons I will come back to. The point is to pick something with enough surface area that the platform
has to earn its keep.

## The one early decision that matters most: align with the official tooling

If you take one thing from this post, take this. Early on you will face a fork in the road: build on a
well-established **community SDK and demo** (mature, familiar, plenty of prior art) or build on
Optimizely's **first-party, official tooling**. I went back and forth on it, and I now think aligning
with the official tooling is the more future-proof foundation, for a reason that was not obvious to me
at first.

Optimizely now ships **first-party Agent Skills** alongside its official SDK: small, installable
guides that teach an AI coding assistant how to do things the "Optimizely way." Model a content type,
generate a component for it, wire up live preview: the skill encodes the current, sanctioned approach
and hands it to your assistant. That changes the calculus. A community SDK gives you a head start today;
the official tooling gives you an assistant that stays current with the platform as it evolves, and a
codebase that lines up with the patterns Optimizely itself is documenting and improving.

There is a subtler benefit too. When your project mirrors the first-party conventions, everything you
write about it is directly useful to the next person, because they are almost certainly on the same
tooling. Build on a fork of a community demo and half your hard-won lessons are really lessons about
the fork. Build on the official path and your notes generalise.

📷 **[Screenshot: the official Optimizely SDK CLI and its Agent Skills, for example a skill being
installed or invoked to scaffold a content type.]**

## The modern stack, at a high level

Without turning this into a spec sheet, it helps to name the shape of a modern Optimizely SaaS build
so a reader knows what they are signing up for:

- **Optimizely SaaS CMS**: the headless, cloud-native CMS at the centre.
- **Optimizely Graph**: the content-delivery layer, with **semantic search** worth showing off (it
  surfaces the right content even when the exact words are not on the page).
- **Optimizely Visual Builder**: drag-and-drop composition and on-page editing for authors.
- **The official CMS SDK**: first-party, code-first content modeling with a CLI that syncs your types
  to the CMS, and the Agent Skills above.
- **A headless frontend** (a modern React framework such as Next.js on the App Router) for
  server-rendered pages, strong SEO, and fast delivery.

You do not need all of it on day one, and you should not try. But knowing the destination keeps early
decisions from painting you into a corner.

## Doing it responsibly

A public, open-source project carries obligations a private prototype does not, and it is worth being
deliberate about them from the first commit rather than cleaning up later.

- **Original branding only.** Invent a name and a wordmark. Do not borrow a real organisation's logo,
  even as a placeholder, even "just for the demo." Placeholders have a way of becoming permanent.
- **Royalty-free imagery only.** Every image in a public repo should be something you are clearly
  licensed to redistribute. This is easy to get right up front and painful to untangle later.
- **A clear, unofficial-demo disclaimer.** If the site resembles a real category, say plainly that it
  is an independent demo, not affiliated with or endorsed by anyone. Make it unambiguous.
- **Real facts are fair game; someone else's assets are not.** You can use true, public information
  freely. What you cannot use is another party's logo, photo library, or copyrighted content. The line
  is between *facts* and *assets*, and it is a clean one to hold.

None of this slows you down. It is mostly a matter of choosing neutral, original, and licensed inputs
from the start, and it is the difference between a project you can share proudly and one you quietly
take down.

## How to work: small sprints, PRs, and a write-up at each milestone

The working method matters as much as the stack, because a public project lives or dies on whether you
keep it moving and keep it legible.

- **Small sprints, each ending in something deployable.** Not "build the whole thing," but a series of
  slices that each leave the project in a working, shippable state. Momentum compounds, and a
  deployable checkpoint is a natural place to stop, reflect, and write.
- **Everything on GitHub, with a real branch to pull request to review to merge flow.** Even solo, a
  PR is where you slow down enough to explain the change to your future self. The diff, the description,
  the review notes: that is a large part of the documentation, for free.
- **A write-up at each meaningful milestone.** Not a diary of every commit. Write when something is
  genuinely new, when something broke and you fixed it (usually the most valuable post you will ever
  publish), or when you extracted something reusable that another team could lift wholesale.

📷 **[Screenshot: a pull request in the GitHub review flow, showing the diff and review conversation
that doubles as documentation.]**

📷 **[Screenshot: the Optimizely SaaS CMS project open, showing composed content and the author
experience the reference project is exercising.]**

That last habit is the one that turns a build into a contribution. A reference project that ships is
useful to you; a reference project that ships *and explains itself* is useful to everyone. Building in
the open, on shared tooling, is also the most natural on-ramp for others to contribute back, which is
where a learning project quietly becomes a community one.

## The shortlist worth pinning up

If I could hand my past self a sticky note before starting:

- **Pick a content-rich domain.** Toy sites teach nothing; volume and variety surface the real
  problems.
- **Align with the official first-party tooling.** The Agent Skills that teach your assistant the
  "Optimizely way" make it the future-proof foundation, and they make your notes generalise.
- **Sort the responsibility questions on day one.** Original branding, royalty-free imagery, a clear
  disclaimer, facts not assets. Trivial early, painful late.
- **Ship in small, deployable slices, through PRs.** The review flow is half your documentation.
- **Write at the milestones, especially the breakages.** The post about the thing that broke is the
  one people find and thank you for.

## Closing thoughts

Building a reference project on Optimizely SaaS in the open is not really about the destination site.
It is about learning a platform the only way that sticks, and leaving a trail that helps the next
person. The stack rewards it: the official SDK and its Agent Skills, Graph and semantic search, and
Visual Builder for composition all reward a code-first, headless, documented approach.

If you are thinking about starting one, or you are mid-way through your own, I would love to compare
notes: what you chose to build, where the official tooling helped or surprised you, and how you have
handled the responsibility side of doing it in public. That exchange is the whole point of building in
the open.

---

### Related reading

- _From Content Areas to the Visual Builder canvas: rethinking page composition in Optimizely SaaS_
- _Content modeling for Visual Builder: pages vs experiences vs components_
- _Semantic search with Optimizely Graph: a practical guide_

For the authoritative details on any of the tooling above, start with the official Optimizely SaaS CMS
documentation.

_Have a correction or a better way to frame any of this? Reach out and let me know; I keep these posts
updated as the platform evolves._
