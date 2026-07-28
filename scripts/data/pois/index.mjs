// All Places to Visit, concatenated. Split across files by district purely so each
// stays reviewable — the seed treats them as one flat list.

import { downtownPois } from './01-downtown.mjs';
import { oldDubaiPois } from './02-old-dubai.mjs';
import { jumeirahPois } from './03-jumeirah.mjs';
import { palmMarinaPois } from './04-palm-marina.mjs';
import { beyondPois } from './05-beyond.mjs';

export const pois = [
  ...downtownPois,
  ...oldDubaiPois,
  ...jumeirahPois,
  ...palmMarinaPois,
  ...beyondPois,
];
