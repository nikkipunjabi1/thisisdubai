'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';

/**
 * Sign-in for the preview-link admin UI. The secret is typed once and exchanged for a
 * short-lived signed cookie, instead of being pasted into every request as the curl flow
 * required. `type="password"` + `autoComplete="current-password"` let a password manager
 * hold it, so nobody keeps it in a scratch file.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="mx-auto max-w-sm">
      <label htmlFor="password" className="block text-sm font-medium">
        Admin secret
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-fg outline-none focus:border-accent"
      />
      <p className="mt-2 text-xs text-muted">
        The value of <code>PREVIEW_ADMIN_SECRET</code>. Sessions last 8 hours.
      </p>

      {state.error && (
        <p role="alert" className="mt-4 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}
