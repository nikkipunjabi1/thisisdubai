---
title: "Shareable stakeholder previews on Optimizely SaaS CMS (headless): login-free links to unpublished content, and how they work"
status: ready
audience: Optimizely community / dev.to / LinkedIn
author: Nikki Punjabi
tags: [optimizely, saas-cms, optimizely-graph, headless, preview, security, governance, nextjs]
---

## The request

A few weeks before go-live, someone always asks:

> "Can you send the client a link so they can see the page before we publish it?"

It sounds like a setting. It is not. On a headless build it is a small feature with a surprising
amount going on underneath, and it is worth understanding before you promise a date.

The reviewer is usually a legal contact, a brand manager, or a client sponsor. They will not get a
CMS account, they will not be trained, and they will open the link on their phone.

## There are two previews, and people mix them up

Optimizely SaaS already gives you a preview: the CMS shows your site in a frame while the author
edits, updating as they type. It is great, and it is for the author.

It is tied to that editing session, so you cannot paste that URL into an email on Tuesday and expect
it to work on Thursday.

| | Editor preview | Stakeholder link |
|---|---|---|
| Who is it for? | The author, while editing | A reviewer with no account |
| How long does it last? | Minutes | Days, you decide |
| Comes with the CMS? | Yes | No, you build it |

## Why you have to build it

In a traditional CMS the server renders the page, so it can render the draft too. Go headless and
your app does the rendering. Nothing shows a draft unless you write the code that asks for one.

There is also a credential problem. Optimizely Graph gives you two keys:

- a **public key** that reads published content only, safe in a browser
- an **app key and secret** that can read every unpublished draft you have

Only the second one can see a draft, and you absolutely do not want it in a browser. So the real
request is "let this reviewer see this draft, without any powerful key leaving my server".

## How it works

![How a stakeholder preview link works: the author clicks Share inside the CMS preview pane, the server mints a signed token, the reviewer opens the link, the app checks the network, signature, expiry and item scope, and only then reads the draft with credentials that never leave the server](assets/stakeholder-preview-flow.png)

The author clicks a button. Your server creates a **signed link**. The reviewer opens it, your server
checks the link is genuine, and then your server (not the browser) fetches the draft and renders it.

The important idea: **the link is a permission slip, not a key.** It says "show the bearer this one
page, until this time". It contains no credentials. The key that reads drafts stays on your server
and never travels.

Because the link is signed, nobody can edit the URL to see a different page or extend the expiry.
Anyone can read what it says, which is fine, but nobody can change it.

There is also no database behind any of this. Nothing is stored, so there is nothing to clean up.
The one honest downside: you cannot cancel a single link early. You lean on short expiry dates
instead, and if you ever need to kill everything at once, you change the signing secret.

## Default to the boring option

The realistic risk here is not a hacker. It is an email forwarded one hop too far.

So links are **Internal** by default: they only open from your office or VPN. **Shareable** (opens
from anywhere) is a deliberate choice per link, for a genuine external reviewer.

That one default has saved more trouble than any of the clever parts.

## Three things that broke

**The newest draft is not the highest version number.** I sorted versions and took the highest. The
preview loaded, the banner appeared, everything looked right. It was showing the published page,
because the draft happened to have a lower number. Sort by status, not by number.

The lesson is bigger than the bug: **test for a difference, not for a page load.** Make an edit,
then check the preview shows it and the live page does not. A preview quietly showing published
content passes every other test you would think to write.

**Turning on preview mode unlocked everything.** Most frameworks have a "this visitor can see
drafts" switch. I turned it on, browsed to another page, and saw that draft too. One link had opened
the whole site. The switch does not know which page the link was for, so you have to carry that
yourself and check it on every request.

**The cache nearly published a draft for me.** Caching pages by URL is right for published content
and dangerous for a draft: the first reviewer loads it, it lands in a shared cache, and the public
gets served an unpublished page. Draft reads have to skip the shared cache completely.

## The bit I got most wrong

All of the above makes the link work. What I underestimated was making it easy to get.

My first version was a small admin page with a shared password. It worked. It was still wrong.
Asking authors to keep a password is a smell, and asking them to leave the CMS to find the page they
were already looking at is a workflow nobody uses twice.

The better answer was already on screen. The CMS shows your app inside its preview pane, so that
frame is your interface, inside their CMS, on the exact page they are editing. Put the button there.
Their CMS login is the authentication, so there is no second password to hand out.

The measure is not "can we produce a link". It is "does the author reach for it instead of messaging
a developer".

## Decide these on purpose

The build takes a few days. These questions outlast it, and they are much easier to answer now than
later:

- How long should a link last? Whatever you pick is what almost everyone will use.
- Can a link be cancelled before it expires?
- Do you log who created which link? "No" tends not to survive an audit.
- What happens when the page goes live? Ideally the link quietly becomes the real page.

And a few guardrails that are cheap now and awkward later: force `noindex` on anything showing a
draft, make the link read-only so a reviewer can never trigger a publish, fall back to the live page
if anything fails rather than showing an error, and refuse to work at all if the configuration is
missing.

## What I would tell the next team

1. Check which credential your SDK actually sends before you design anything. Half an hour, read
   only, against the real service.
2. Test that the preview shows something the live page does not.
3. A preview switch is not a permission. Carry the scope yourself and re-check it every request.
4. Treat every shared cache as a way to accidentally publish.
5. Default to the safe option, and fail closed when configuration is missing.
6. Run the whole thing in your second language, and design the route to the button before you build
   the button.

## In short

"Can you just send them a link" turns into a feature that touches authentication, caching,
localization, search indexing and publishing policy. But it leaves almost nothing behind: no table
of links, no cleanup job, nothing to sync.

A link is just a signed sentence saying "show this one draft, to someone on this network, until this
time", checked honestly on every request until the clock runs out.

Get the defaults right, keep the real key on the server, and it stays a small, well-behaved feature
instead of a liability.

I would love to hear how other teams handle cancelling links early, and tracking who created them,
when the reviewers are outside your organisation.
