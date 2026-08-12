'use client';

import { useActionState, useRef, useState } from 'react';
import { createShareLink, type ShareLinkState } from './actions';

/**
 * Copy `value`, working inside the CMS's iframe.
 *
 * `navigator.clipboard` is not enough here. The async Clipboard API needs the embedding
 * iframe to carry `allow="clipboard-write"`, and that iframe belongs to the CMS, so we
 * cannot add it. In that situation `writeText` rejects (or silently no-ops), which is why
 * the button appeared to do nothing.
 *
 * So: try the modern API, and fall back to selecting the input and using the legacy
 * `execCommand('copy')`, which is not subject to that permission. Returns false only when
 * both fail, and the caller then tells the user to press the keyboard shortcut, with the
 * text already selected for them.
 */
async function copyToClipboard(value: string, input: HTMLInputElement | null): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Permissions-Policy or a non-focused document. Fall through.
  }

  if (!input) return false;
  try {
    input.focus();
    input.select();
    input.setSelectionRange(0, value.length);
    // Deprecated, but the only clipboard write available in a third-party iframe.
    return document.execCommand('copy');
  } catch {
    return false;
  }
}

/**
 * "Share with a stakeholder" control, rendered inside the CMS preview pane.
 *
 * SaaS CMS has no UI extensibility (no add-ons, no custom editors or menu items), so the
 * preview pane is the only place we can put an author-facing control that is still
 * *inside* the CMS. The author is editing the page, sees the button on it, clicks once,
 * and gets a link to paste into an email.
 *
 * It starts collapsed as a single small button so it does not fight with Visual Builder's
 * on-page editing overlays, and it is `position: fixed` in the bottom corner so it never
 * displaces the content being reviewed.
 */

const TTL_OPTIONS = [
  { label: '24 hours', value: 24 * 60 * 60 },
  { label: '7 days', value: 7 * 24 * 60 * 60 },
  { label: '30 days', value: 30 * 24 * 60 * 60 },
];

type Props = {
  previewToken: string;
  contentKey: string;
  version: string;
  locale: string;
  /** The CMS path (`url.default`). Absent for content that has no URL yet. */
  path?: string;
  displayName?: string;
};

export function StakeholderLinkPanel({
  previewToken,
  contentKey,
  version,
  locale,
  path,
  displayName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'internal' | 'shareable'>('internal');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<ShareLinkState, FormData>(
    createShareLink,
    {},
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] rounded-full bg-black/85 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-black"
      >
        Share with a stakeholder
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 rounded-xl bg-black/90 p-4 text-white shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Share with a stakeholder</p>
          {displayName && <p className="truncate text-xs text-white/60">{displayName}</p>}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="shrink-0 rounded px-2 text-white/60 transition hover:text-white"
        >
          ✕
        </button>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-white/60">
        Creates a link that shows this unpublished draft to someone with no CMS login.
      </p>

      <form action={formAction} className="mt-3">
        <input type="hidden" name="previewToken" value={previewToken} />
        <input type="hidden" name="key" value={contentKey} />
        <input type="hidden" name="locale" value={locale} />
        {path && <input type="hidden" name="path" value={path} />}

        <label htmlFor="sp-mode" className="block text-xs font-medium">
          Who can open it
        </label>
        <select
          id="sp-mode"
          name="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as 'internal' | 'shareable')}
          className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs"
        >
          <option value="internal">Internal — organization network only</option>
          <option value="shareable">Shareable — anyone with the link</option>
        </select>
        <p className="mt-1 text-[11px] leading-relaxed text-white/50">
          {mode === 'internal'
            ? 'Opens only from an allowed network (office / VPN). Safest default for internal review.'
            : 'Opens from anywhere — use only for external reviewers who are off the network.'}
        </p>

        <label htmlFor="sp-version" className="mt-3 block text-xs font-medium">
          Shows
        </label>
        <select
          id="sp-version"
          name="version"
          defaultValue="latest"
          className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs"
        >
          <option value="latest">The latest draft, including later edits</option>
          <option value={version}>Only this version (v{version})</option>
        </select>

        <label htmlFor="sp-ttl" className="mt-3 block text-xs font-medium">
          Expires after
        </label>
        <select
          id="sp-ttl"
          name="ttl"
          defaultValue={TTL_OPTIONS[1].value}
          className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs"
        >
          {TTL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {pending ? 'Creating…' : 'Create link'}
        </button>
      </form>

      {!path && (
        <p className="mt-3 text-xs text-amber-300">
          This content has no URL yet, so the link will open the site home page. Publish once to
          give it a URL.
        </p>
      )}

      {state.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-500/20 px-2 py-1.5 text-xs">
          {state.error}
        </p>
      )}

      {state.url && (
        <div className="mt-3">
          <div className="flex gap-2">
            <label htmlFor="sp-url" className="sr-only">
              Share link
            </label>
            <input
              id="sp-url"
              ref={urlInputRef}
              readOnly
              value={state.url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-[11px]"
            />
            <button
              type="button"
              onClick={async () => {
                const ok = await copyToClipboard(state.url!, urlInputRef.current);
                setCopyState(ok ? 'copied' : 'manual');
                if (ok) setTimeout(() => setCopyState('idle'), 2000);
              }}
              className="shrink-0 rounded-full border border-white/30 px-3 text-xs transition hover:border-white"
            >
              {copyState === 'copied' ? 'Copied' : 'Copy'}
            </button>
          </div>
          {copyState === 'manual' && (
            <p role="status" className="mt-2 text-[11px] text-amber-300">
              The browser blocked clipboard access here. The link is selected, so press
              Ctrl/Cmd + C to copy it.
            </p>
          )}
          {state.expiresAt && (
            <p className="mt-2 text-[11px] text-white/50">
              Expires {new Date(state.expiresAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
