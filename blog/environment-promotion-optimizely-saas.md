# Dev, UAT, Production on Optimizely SaaS: what moves with your code and what doesn't

Every CMS project reaches the same conversation. You have work running happily in one environment,
someone asks "how do we get this to UAT", and the room discovers that nobody agrees on what "this"
means.

On Optimizely SaaS the answer is less obvious than it looks, because the platform quietly splits
your project into layers that promote in completely different ways. Get the split right and
promotion becomes routine. Get it wrong and you will spend a release weekend hand-copying content,
or worse, overwrite a tester's work an hour before sign-off.

This is a project manager's guide to that split: what actually moves, what does not, and the
failures worth designing against before they find you.

## The mental model: three layers, three different rules

Most teams arrive with a two-layer model in their heads: "code" and "content". That model is
incomplete, and the missing layer is where the surprises live.

**Layer one, the content model.** Your content types, their fields, validation rules, and which
fields are translatable. This is a schema. It is deterministic, it belongs in version control, and
it should be applied to each environment by your pipeline. It promotes with your code.

**Layer two, instance settings.** Which languages are enabled. The application definition and its
hostname. API keys. Users and permissions. This layer promotes with nothing at all. It is
configured by hand, once per environment, and no deployment will ever create it for you.

**Layer three, content items.** The actual pages, text, images and translations. This layer does
not promote either, but for a different and more important reason: content has a home. It is
authored where it lives, and copying it upward is a deliberate act, not a routine one.

The second layer is the one teams forget, and it fails in a particularly annoying way. A content
type can declare a field as translatable, promote perfectly, pass every check, and land on an
environment that has no second language enabled at all. The model is ready for a language the
instance does not have. Nothing errors. It simply does not work, and the error you eventually see
points at the wrong thing entirely.

Write the three layers on a whiteboard at the start of the project. It will save you an argument
later.

## Why "an environment" means something different here

On a traditional CMS, environments are often a deployment target: same application, different
configuration, sometimes a shared or copied database.

On SaaS, an environment is generally a separate CMS instance. There is no "promote this branch of
the content tree to Production" button, because Production is a different system, not a different
folder.

That sounds like a limitation. In practice it clarifies things, because it forces the question
teams usually dodge: **what is the source of truth for content?** Once environments are genuinely
separate systems, the honest answer is "wherever it is authored", and a great deal of pointless
synchronisation work simply disappears.

Promotion then means something refreshingly simple: point the same code at a different instance.
That is entirely a credentials question. Same repository, different target.

## Branching: forward only, and one setting that enforces it

The branching model that fits this cleanly is trunk-based with promotion branches. One trunk where
all work lands, and one long-lived branch per upper environment, each pinned to a known commit.

You promote by merging forward, never backward, and never by committing directly to an upper
branch. Every promotion is a pull request, so it has a diff, a pipeline run and an approval.

There is one detail here that looks cosmetic and is not.

**Promotion pull requests must be merged as a merge commit, never squashed.** Squashing rewrites
the promoted commits into a new identity with identical content. The branches then diverge
permanently, every later promotion carries phantom differences, and eventually you get conflicts on
changes that were already promoted.

The good news is that you do not have to rely on anyone remembering. Modern repository rulesets let
you restrict which merge methods are allowed per branch. Set the trunk to squash only, and each
promotion branch to merge commit only. The wrong button is then simply not there.

I learned this one by doing it wrong, which is the usual way.

## The ordering problem nobody mentions

Here is a failure worth designing against before it happens.

Your front end queries the content model. So the model has to exist on the target instance before
the new front end goes live, or delivery queries fail on types the instance has never heard of.

Meanwhile, most hosting platforms deploy the moment a branch is pushed. That is normally a feature.
Here it is a race: the deployment starts at zero seconds, the model finishes landing a minute or so
later, and any release that introduces a new content type has a window where the live application
is asking for something that does not exist yet.

The fix is to invert the control. Turn off the hosting platform's automatic build for your
environment branches, and let your pipeline trigger the deployment through a deploy hook, only
after the model push has succeeded. The sequence becomes explicit:

```
push branch  ->  snapshot the current model  ->  push the model
             ->  wait for propagation        ->  trigger the deployment
```

That snapshot step costs nothing and gives every promotion a rollback reference. Take it.

One thing to watch: disabling automatic builds makes your pipeline the *only* path to a deployment.
That is the point, but it has a consequence covered below.

## The safety property that matters most

Before you let a pipeline near an upper environment, you need a confident answer to one question:
can this destroy content?

For a model push on Optimizely SaaS, the answer is reassuring. The push is additive. It creates and
updates, and it does not delete. A type removed from your repository stays on the instance.
Deletion is a separate, explicitly dangerous command. Content items are never touched by a model
push at all.

There is one deliberate exception. A genuinely breaking change (adding a required field, removing
or retyping a field, switching a field from shared to per-language) is refused unless you force it.

Direction matters more than most people realise. Turning localization **on** preserves existing
values. Turning it **off** deletes them, in every language, permanently.

Which gives one rule that belongs in your team's documentation:

> **Never put the force flag in your pipeline for UAT or Production.** A promotion that fails on a
> breaking change is the safety net doing its job. Snapshot it, review what would be lost, and
> apply it deliberately during a maintenance window.

Resist the temptation to "just add force so the pipeline goes green". The green tick is not the
goal.

## Moving content, honestly

Content is the part everyone wants automated and mostly should not be.

Optimizely's own guidance splits it the same way experience suggests: automate the model through
the API or CLI in your pipeline, and use the export and import package for actual content and media
during test cycles.

That split is not laziness. A pipeline that routinely copies one environment's content into another
will, one day, flatten a tester's work in the middle of a UAT cycle. Content movement is a decision
someone makes, so it should have a human trigger.

For seeding a new environment, you have two options, and they are good at different things.
**Scripted seeding** gets you a known, reproducible baseline and is versioned alongside your code.
**Export and import** gets you today's real corpus, translations included, in a handful of passes.
Use scripts for a baseline you will recreate often, and a package for a one-time bootstrap.

And a liberating point that teams take too long to accept: **UAT does not need to mirror
Production.** It needs *representative* content. Once seeded, let it diverge. Divergence means
people are testing.

### The import lesson

Exporting the whole tree and importing it in one action is the obvious first attempt, and it fails.

The importer does not necessarily resolve the tree from the top down, so it can attempt to create
child items before their parent exists, and the placement is rejected. The error names a folder type
and a page type and reads like a permissions problem, which sends you looking in the wrong place
entirely.

Import in batches, in dependency order, instead:

1. The content model, so every type exists.
2. The home page, the root everything else hangs from.
3. Then stop importing and do some configuration: create the application, set that environment's
   hostname, enable language-specific assets. This step is instance settings, layer two, so nothing
   promotes it and nothing warns you it is missing.
4. Shared assets and blocks that pages reference.
5. Each section and its children, one section per pass.

Crucially, tick the option that updates existing items with matching identifiers. That preserves
the original identifiers across instances, which means a pass that fails halfway can simply be run
again: existing items update rather than duplicate. Batched imports stop being scary once you know
they are re-runnable.

## Four failures that stay completely silent

The pipeline failures were easy. Every genuinely costly problem in this exercise produced no error
at all.

**A missing public host setting.** The site rendered, every page returned 200, and the build was
green. But canonical and hreflang tags were emitted as relative URLs, which makes them invalid, and
the sitemap returned a technically valid but completely empty document. Nothing failed. The SEO was
simply broken. Worth noting that on a brand new hosting project you cannot know the final URL until
after the first deployment, so this configuration is inherently a second pass.

**Secrets stored as variables.** The pipeline reported success and promoted nothing. The
credentials had been added to the environment, but on the variables tab rather than the secrets
tab. The pipeline read secrets, found nothing, and skipped. Both tabs look nearly identical and
both show a padlock.

That one exposed a design flaw of my own making. The pipeline was written to skip cleanly when an
environment was not yet configured, which is correct for an automatic push (a branch may genuinely
not have an instance yet) and completely wrong for a manual run. If a human explicitly asked for a
promotion, silence is the wrong answer.

> **Fail safe on automatic triggers. Fail loud on manual ones.** A green tick over an empty
> environment is worse than a red cross.

**A path filter on the deployment pipeline.** The pipeline only ran when model-relevant files
changed, which was sensible while the hosting platform handled its own deployments. The moment
automatic builds were switched off, that pipeline became the only route to production, and a filtered
route means some changes silently never ship. A merge touching only scripts and documentation matched
no path, nothing ran, nothing built, and the environment quietly stayed on the previous release.

The fix was to remove the filter. Running an idempotent no-op model push on every merge costs about
fifteen seconds, and buys "merged means deployed" being true without exception. That is a good
trade.

**A language that was never enabled.** Covered above, and the one that most cleanly proves the
three-layer model. The verification tooling reported that a locale did not exist in the schema
enumeration, which reads like a code problem and is actually a configuration fact.

Notice the pattern. None of these threw an exception. Each was found by checking rather than by
being told. Which leads to the last point, and the one I would keep if I could keep only one.

## Verify with a command, not an opinion

"It looks fine" does not scale past about ten pages. Across a couple of hundred items in two
languages, nobody can eyeball equivalence, and the failure modes are exactly the ones eyes are worst
at: an item translated but not published, or a URL that differs in one language only.

So build the check. A short read-only script that inventories what is *published* on an instance,
grouped by type and by language, and flags two specific things: items with no counterpart in the
other language, and URLs that differ between languages once the language prefix is removed.

Two design notes made it genuinely useful rather than merely reassuring.

The first was a lucky property of the delivery API: it only returns published content. So an item
appearing in the inventory is itself the proof that it is published, and a draft is simply absent.
That single fact turns "did publish state survive the migration" from a manual audit into a count.

The second was an embarrassing bug in my own tool. It printed the delivery gateway hostname to
identify the instance, and that hostname is shared across all instances. Two completely different
environments printed identical headers. A verification tool that cannot distinguish the thing it is
verifying is worse than no tool, because it manufactures false confidence. It now prints a
fingerprint of the environment's own key.

Run it before the migration to capture a baseline, run it after to prove the target matches:

```
verify content            --out=baseline.json     # before, against the source
verify content --target   --compare=baseline.json # after, against the destination
```

Ending on "identical to the source snapshot, migration is complete" is a meaningfully different
experience from ending on "looks right to me".

## A note on "code-first"

One piece of terminology, because it comes up in every conversation about this and it is worth
being precise.

On traditional Optimizely, content models were defined code-first, through backend classes. SaaS
does not work that way. It is decoupled and headless, and content modeling is schema-first, either
through the CMS interface or programmatically through the API. There is no backend class that
becomes a content type.

What a modern project does instead is hold the schema definitions in source control and apply them
from the pipeline. Optimizely recommends exactly this. The discipline of the code-first workflow
survives intact (version control, code review, repeatable promotion) and only the mechanism
differs.

So describe it as **schema-first with definitions in source control**. Calling it "code-first"
invites an entirely correct objection that makes the rest of your argument look shaky, and you will
be arguing about vocabulary instead of the thing that matters.

## The checklist

If you take one thing from this, take this list.

**Design**
- Write the three layers down: model, instance settings, content. Agree what promotes.
- Decide the source of truth for content before anyone asks how to sync it.
- Trunk-based branching, forward-only promotion, promotion by pull request.

**Configure, once per environment**
- Enable the languages. Nothing promotes them.
- Create the application and set that environment's hostname.
- Least-privilege API credentials per instance. Store them as **secrets**, not variables.
- Generate fresh signing and webhook secrets per environment. Never share them across tiers.
- Leave search indexing off everywhere except Production, and make the code fail closed.
- Set the public host, then redeploy, and verify the canonical tags and the sitemap.

**Enforce in the tooling**
- Restrict merge methods per branch: squash on the trunk, merge commit on promotion branches.
- Snapshot the model before every push.
- Never force a breaking change from the pipeline on an upper environment.
- Disable the hosting platform's automatic builds and trigger deployments from the pipeline after
  the model lands.
- No path filter on the pipeline that owns deployment.
- Fail safe on automatic triggers, fail loud on manual ones.

**Verify**
- Inventory published content per type and per language, before and after.
- Check for items missing in one language, and URLs that differ across languages.
- Never accept "looks fine" as the completion criterion for a migration.

## Closing thought

The reason this topic is worth writing up is that almost none of it is hard. There is no clever
architecture here. Every single problem was a small piece of configuration that failed without
saying anything, and the entire discipline consists of knowing which small pieces those are and
checking them deliberately.

That is also why it is worth designing up front rather than discovering during a release. The cost
of getting it right is an afternoon. The cost of getting it wrong is discovering, at the worst
possible moment, that your green tick meant nothing.

If you are running Optimizely SaaS across multiple environments, I would genuinely like to hear
which of these caught you, and which ones you have hit that I have not.
