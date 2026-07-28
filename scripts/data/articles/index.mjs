// All Articles, concatenated. Batched by theme purely so each file stays
// reviewable — the seed treats them as one flat list.
//
// Target for SC2 is 100 long-form articles; they land batch by batch so each one
// can be reviewed and published rather than arriving as a single unreadable diff.

import { guideArticles } from './01-guides.mjs';

export const articles = [...guideArticles];
