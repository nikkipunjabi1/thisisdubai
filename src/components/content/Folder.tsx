import { contentType } from '@optimizely/cms-sdk';
import { ArticleContentType } from './Article';

/**
 * Folder — an ORGANISATIONAL container. Never routable, never rendered.
 *
 * Reintroduced for article bucketing. Optimizely's guidance is to keep a container
 * under ~100 immediate children: beyond that the editor tree becomes slow to
 * expand, and it is the editing experience that degrades first, not delivery.
 * Articles are therefore bucketed into year folders under the Articles section —
 * see docs/CONTENT-ARCHITECTURE.md §10.
 *
 * (An earlier `Folder` type was retired in 6dee364 when Tags and Site Settings
 * moved to application shared blocks and nothing was left to organise. This is a
 * different need, not a reversal.)
 *
 * `_folder` is non-localized: the CMA rejects a `locale` on its version writes.
 * The `[...slug]` router already treats folder types as 404 (NON_ROUTABLE_TYPES),
 * so a folder can never be served as a page.
 */
export const FolderContentType = contentType({
  key: 'Folder',
  displayName: 'Folder',
  baseType: '_folder',
  // `_self` allows nesting (year → month, if a year ever exceeds ~100 articles).
  // Extend this list as other sections adopt bucketing.
  mayContainTypes: ['_self', ArticleContentType],
  properties: {},
});
