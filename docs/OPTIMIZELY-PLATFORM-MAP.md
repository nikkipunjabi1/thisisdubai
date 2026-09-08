# The Optimizely Platform — a working map

**Who this is for:** anyone at Gravitas who needs to talk credibly about Optimizely, whether that is
answering an RFP, scoping a build, or holding a conversation with a client's CMO or CTO. It is
written to be useful to business development and delivery equally.

**Why it exists:** "This is Dubai" is our playground on Optimizely, and we have sandbox access to
the full suite. This map records what each product is, why a client buys it, what we have actually
proven, and where the gaps are. Being honest about the gaps is the point: it tells us what to build
next and stops us overclaiming in a bid.

---

## 1. The suite at a glance

Optimizely markets the suite as **Optimizely One**, with **Opal**, its AI agent layer, embedded
across the products rather than sold as a separate tool.

| Product | The problem it solves | Who cares in the client |
|---|---|---|
| **CMS (SaaS)** | Create, model and govern content; publish to any channel | Marketing ops, content teams, IT |
| **CMS (PaaS, v12/13)** | Same, for organisations wanting .NET control and on-prem/cloud choice | Enterprise IT, regulated sectors |
| **Content Graph** | One GraphQL API delivering all content, with search built in | Front-end and integration teams |
| **Visual Builder** | Non-technical authors compose pages by drag and drop | Marketing, campaign teams |
| **CMP (Content Marketing Platform)** | Plan, brief, review, approve and schedule marketing work | CMO, marketing operations |
| **DAM** | One governed home for images, video and creative | Brand, creative, legal |
| **ODP (Data Platform)** | Unify customer data into profiles and real-time audiences | CRM, data, growth |
| **Connect Platform (OCP)** | Build and install integrations around ODP; extend the CMS UI | IT, integration architects |
| **Personalization** | Show different content to different audiences | Marketing, growth |
| **Web Experimentation** | A/B and multivariate testing on the front end | Growth, CRO, marketing |
| **Feature Experimentation** | Feature flags, staged rollout and server-side experiments | Engineering, product |
| **Configured Commerce** | B2B commerce out of the box | Commerce, sales ops |
| **Commerce Connect** | Commerce capability alongside an existing stack | Commerce, IT |
| **Warehouse-Native Analytics** | Analytics that runs on the client's own data warehouse | Data teams, CFO, CTO |
| **Opal** | AI agents embedded across the suite to automate marketing work | CMO, marketing ops |

---

## 2. What we have actually proven

Evidence, not assertion. Everything below is running in "This is Dubai".

| Product | Depth | What we can show |
|---|---|---|
| **CMS (SaaS)** | 🟢 Deep | Schema-first content model in Git, promoted by CI across DEV and UAT; 187 published items per locale; full EN/AR localisation with RTL |
| **Content Graph** | 🟢 Deep | Delivery for the whole site, bilingual **semantic search** with facets, draft reads for preview, cross-request caching |
| **Visual Builder** | 🟢 Deep | Section experiences, a campaign built from composable blocks, display templates, live on-page preview |
| **CMP / DAM** | 🟡 Partial | Folder structure created and imagery attached at scale through a scripted pipeline |
| **Opal** | 🟡 Partial | Whole-site Arabic translation, then bulk-published and slug-aligned by script |
| **Connect Platform** | 🔵 Knowledge | We understand the app types and that CMS UI Extensions exist; nothing built yet |
| **ODP** | ⚪ Not started | Sandbox available |
| **Personalization** | ⚪ Not started | Backlogged as S3.17 |
| **Web Experimentation** | ⚪ Not started | Backlogged as S3.17 |
| **Feature Experimentation** | ⚪ Not started | Backlogged as S3.20 |
| **Warehouse-Native Analytics** | ⚪ Not started | Sandbox available |
| **Configured Commerce / Commerce Connect** | ⚪ Not started | Considered in S3.12 |

**The honest summary:** we are strong on the content side and thin on data, experimentation and
commerce. That is enough to lead a CMS-led pursuit today. A full-suite pursuit needs proof points in
the other three areas, which is what the backlog is now aimed at.

---

## 3. Why a client buys each one

Useful in a first conversation, when the question is "what would this actually do for us".

**CMS.** They are slowed down by their current platform: developers needed for routine changes,
channels drifting apart, a painful authoring experience. The pitch is speed and control for the
people who own the content.

**Content Graph.** They have, or want, more than one front end. One API for every channel, with
search included rather than bolted on.

**Visual Builder.** Marketing cannot build a landing page without a ticket. The pitch is campaign
velocity without losing brand control.

**CMP.** Marketing work lives in spreadsheets, email and chat. Nobody can answer "what is shipping
next week and who is blocking it". The pitch is visibility and governance across campaigns.

**DAM.** Assets are scattered, versions are wrong, rights are unclear. The pitch is one governed
source, with the CMS consuming it directly.

**ODP.** Customer data sits in silos, so the same person looks like three different people.
The pitch is one profile and real-time audiences that every channel can act on.

**Connect Platform.** Integrations are bespoke and brittle. The pitch is a catalogue of connectors
plus a supported way to build the missing ones.

**Personalization.** Everyone sees the same page. The pitch is relevance, and revenue per visit.

**Web Experimentation.** Decisions are made on opinion. The pitch is evidence, and the confidence to
change things.

**Feature Experimentation.** Releases are risky and hard to reverse. The pitch is shipping safely:
flags, staged rollout, and switching a feature off without a deploy.

**Warehouse-Native Analytics.** They already invested in a warehouse and do not want another copy of
their data in another vendor's cloud. The pitch is analytics where the data already lives. This one
lands especially well with CTOs and data teams, and it neutralises the usual data-residency
objection.

**Opal.** The team is drowning in production work. The pitch is agents doing the repetitive parts
inside the tools people already use.

---

## 4. How the pieces fit together

A single sentence per relationship, which is usually all a whiteboard conversation needs.

- **CMS** holds the content. **Content Graph** delivers it. **Visual Builder** is how authors compose it.
- **DAM** holds the assets the CMS references; **CMP** is where the work of producing them is planned and approved.
- **ODP** builds the audience. **Personalization** acts on it. **Connect Platform** is how ODP talks to everything else.
- **Web Experimentation** tests the front end; **Feature Experimentation** tests and controls the code.
- **Warehouse-Native Analytics** measures it all, in the client's own warehouse.
- **Opal** sits across the suite, automating work inside each product.

**The most common client confusion,** worth pre-empting:

- *ODP versus Connect Platform.* ODP is the capability; OCP is how it integrates. They are not alternatives.
- *Web Experimentation versus Feature Experimentation.* One tests what visitors see; the other controls what the code does. Marketing buys the first, engineering the second.
- *CMS versus CMP.* CMS manages published content; CMP manages the work of producing it.
- *SaaS CMS versus PaaS CMS.* Different products with different extensibility models, not versions of one another. Add-ons for one do not run on the other.

---

## 5. Where each product shows up in an RFP

Most enterprise DXP RFPs are structured around capability areas. This is the usual mapping.

| Typical RFP capability | Optimizely answer |
|---|---|
| Content management, asset storage | CMS + DAM + Content Graph |
| A/B testing and experimentation | Web Experimentation + Feature Experimentation |
| Customer data platform, real-time data | ODP |
| Personalization and decisioning | Personalization, fed by ODP |
| Digital analytics and reporting | Warehouse-Native Analytics |
| Enterprise work management | CMP for marketing, plus the client's own tooling for engineering |
| Cross-channel orchestration | Partner platform in most cases, integrated through OCP |
| Integration and extensibility | Connect Platform |
| AI and automation | Opal, embedded across the above |

Two things worth knowing when responding:

- Optimizely covers most capability areas natively, which supports a single-vendor answer, but
  cross-channel messaging is usually a partner product. Say so plainly rather than stretching.
- Warehouse-native analytics is a genuine differentiator against suites that insist on holding the
  data themselves. Lead with it when the client has already invested in a warehouse.

---

## 6. Questions clients ask, and honest answers

**"Is it one platform or several products stitched together?"**
One commercial platform, with products that integrate well and are still distinct systems with their
own interfaces. Saying that plainly builds more trust than claiming seamlessness.

**"Can our authors build anything without developers?"**
They can compose, configure and rearrange freely from the component library. A genuinely new type of
component is a development activity. That boundary is deliberate: it is what protects brand
consistency, accessibility and performance.

**"Can we extend the CMS interface?"**
On SaaS, through Connect Platform's CMS UI Extensions, currently in beta, installed like any other
app. On PaaS, through the traditional add-on model. The two are not interchangeable.

**"Do we have to take the whole suite?"**
No, and most clients do not start there. Content-led is the common entry point, with data and
experimentation following.

**"Where does AI fit?"**
Opal across the suite for marketing work, and the platform's APIs make it straightforward to build
bespoke AI features on top of the content, which is what we are doing in our own build.

---

## 7. What we build next, and why

Ordered by what unlocks the most commercial ground.

1. **[S3.19] Experience API** — proves multi-channel delivery. Needed for any pursuit involving an app or kiosk.
2. **[S3.17] Personalization with ODP audiences** — opens the data and personalization conversation, the most common gap in a content-led pitch.
3. **[S3.20] Feature Experimentation** — a short build, and a credible answer to engineering stakeholders.
4. **Warehouse-Native Analytics** — the strongest differentiator we have not yet touched.
5. **[S3.18] Connect Platform** — connector catalogue and CMS UI Extensions; changes how we scope integration work.
6. **CMP end to end** — we use the DAM; we have not used the planning and approval side that a CMO actually buys.

---

## 8. Learning resources

Optimizely Academy is free and the courses are short. Where one exists for a product we are about to
build with, taking it first is cheaper than learning the model by trial and error.

| Product | Course | Length | Take it before |
|---|---|---|---|
| **ODP** | [Introduction to Optimizely Data Platform (ODP)](https://academy.optimizely.com/student/page/2563794-introduction-to-optimizely-data-platform-odp) | ~1 hour | [S3.17] personalization and audiences |

Add to this table as we find the courses that are actually worth the time.

## Related
- [`docs/OPTIMIZELY-BEST-PRACTICES.md`](OPTIMIZELY-BEST-PRACTICES.md) — the technical playbook
- [`docs/ENVIRONMENTS.md`](ENVIRONMENTS.md) — how work promotes between instances
- [`docs/SPRINTS.md`](SPRINTS.md) — the backlog referenced above
