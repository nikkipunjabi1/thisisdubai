/**
 * Verifying the CMS's own `preview_token`, so an author can mint a stakeholder link
 * from inside the editor without ever handling a secret.
 *
 * When the CMS renders our app in its preview pane it appends `preview_token`, a JWT it
 * issues to an authenticated editor session (see the Live Preview settings, "Use Preview
 * Tokens"). Possession of an unexpired one is therefore proof that the request came from
 * somebody logged into the CMS. That is the whole authentication story for the in-editor
 * "create stakeholder link" button: the CMS login IS the login, which is why there is no
 * separate admin page or shared password.
 *
 * ## What this token does and does not prove
 * It proves: a live, authenticated CMS editor session against THIS instance, right now
 * (the token lives five minutes).
 * It does NOT prove: which user (the `sub` claim is a service subject, not a person), or
 * that they have rights to the specific item being shared. Documented in
 * docs/PREVIEW-WORKFLOW.md rather than papered over.
 *
 * ## Why Graph is the authority, not the signature
 * The token happens to be an HS256 JWT signed with our own Graph secret, so it can be
 * verified locally with no network call. That is an undocumented implementation detail
 * and Optimizely can change it at any time. What IS documented is that the token is sent
 * to Graph as `Authorization: Bearer …`, so we let Graph decide: only 401/403 means "not
 * authenticated". The cheap local checks below run first purely to reject obvious junk
 * without a round trip, and they are deliberately lenient: anything we cannot positively
 * disprove goes to Graph.
 *
 * SERVER ONLY.
 */

export type CmsTokenClaims = {
  appKey?: string;
  sub?: string;
  iss?: string;
  aud?: string;
  nbf?: number;
  exp?: number;
  iat?: number;
};

/** Decode the JWT payload without verifying it. Returns null if it is not a JWT at all. */
export function decodeCmsPreviewToken(token: string): CmsTokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as CmsTokenClaims;
  } catch {
    return null;
  }
}

/**
 * A fast, local pre-filter. Returns false ONLY when the token can be positively shown to
 * be expired, not-yet-valid, or issued for a different instance. Unparseable or
 * unexpected shapes return true so the authoritative Graph check still gets to run: a
 * format change at Optimizely's end should not silently disable the feature.
 *
 * `nowSeconds` is injectable for deterministic tests.
 */
export function isPlausibleCmsPreviewToken(
  token: string,
  expectedAppKey: string | undefined = process.env.OPTIMIZELY_GRAPH_APP_KEY,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!token) return false;

  const claims = decodeCmsPreviewToken(token);
  if (!claims) return true; // not a JWT we recognise: let Graph decide

  // A small skew allowance, because the token's five-minute window is tight and clocks drift.
  const SKEW = 60;
  if (typeof claims.exp === 'number' && claims.exp + SKEW < nowSeconds) return false;
  if (typeof claims.nbf === 'number' && claims.nbf - SKEW > nowSeconds) return false;
  // A token minted for a different Graph application is never ours to trust.
  if (expectedAppKey && claims.appKey && claims.appKey !== expectedAppKey) return false;

  return true;
}

const GRAPH_URL = (
  process.env.OPTIMIZELY_GRAPH_GATEWAY || 'https://cg.optimizely.com/content/v2'
).replace(/\/$/, '');

/**
 * Ask Graph whether it accepts this token. Only an explicit 401/403 counts as a
 * rejection: any other response means the credential authenticated, even if the probe
 * query itself were unhappy, and we do not want a query-shape change to read as an auth
 * failure. Network errors fail CLOSED, because "we could not check" must never mean
 * "allowed to mint a link".
 */
export async function verifyCmsPreviewToken(token: string): Promise<boolean> {
  if (!isPlausibleCmsPreviewToken(token)) return false;

  try {
    const response = await fetch(GRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: '{ _Content(limit: 1) { total } }' }),
      cache: 'no-store',
    });
    return response.status !== 401 && response.status !== 403;
  } catch (error) {
    console.error('[preview] could not verify the CMS preview token against Graph:', error);
    return false;
  }
}
