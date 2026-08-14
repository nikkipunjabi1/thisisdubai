'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { HeaderItem, ResolvedLink } from '@/lib/navigation';

/**
 * The header's primary navigation, rendered from CMS-configured items. Top-level items with
 * `children` become a dropdown ("mega menu"): it opens on hover and on keyboard focus, closes
 * on Escape or when focus/pointer leaves, and the trigger carries `aria-expanded`/`aria-haspopup`.
 * A client component because the dropdown needs open/close state; the data is resolved server-side.
 */

function NavAnchor({
  link,
  className,
  role,
}: {
  link: Pick<ResolvedLink, 'href' | 'external' | 'newTab' | 'label'>;
  className?: string;
  role?: string;
}) {
  const target = link.newTab ? '_blank' : undefined;
  const rel = link.newTab ? 'noopener noreferrer' : undefined;
  // Internal links use next/link; external ones a plain anchor.
  return link.external ? (
    <a href={link.href} target={target} rel={rel} className={className} role={role}>
      {link.label}
    </a>
  ) : (
    <Link href={link.href} target={target} rel={rel} className={className} role={role}>
      {link.label}
    </Link>
  );
}

export function PrimaryNav({ items }: { items: HeaderItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const navRef = useRef<HTMLUListElement>(null);

  // Close on Escape, and on a click/focus outside the nav.
  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenIdx(null);
    const onOutside = (e: Event) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenIdx(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('focusin', onOutside);
    };
  }, [openIdx]);

  const linkCls = 'text-muted transition hover:text-accent';

  return (
    <ul ref={navRef} className="flex items-center gap-6 text-sm">
      {items.map((item, i) => {
        if (item.children.length === 0) {
          // Plain link (or, if it has no destination, static text).
          return (
            <li key={i}>
              {item.href ? (
                <NavAnchor link={{ ...item, href: item.href }} className={linkCls} />
              ) : (
                <span className="text-muted">{item.label}</span>
              )}
            </li>
          );
        }
        const open = openIdx === i;
        return (
          <li
            key={i}
            className="relative"
            onMouseEnter={() => setOpenIdx(i)}
            onMouseLeave={() => setOpenIdx((o) => (o === i ? null : o))}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpenIdx((o) => (o === i ? null : i))}
              onFocus={() => setOpenIdx(i)}
              // No `text-muted` here on purpose: the global `a { color: inherit }` rule makes
              // the sibling <a> links render at --fg, and a <button> would keep `text-muted`
              // and look greyer than them. Inheriting (like the links) keeps the bar uniform.
              className="flex items-center gap-1 transition hover:text-accent"
            >
              {item.label}
              <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={`size-3.5 transition ${open ? 'rotate-180' : ''}`}>
                <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open ? (
              // Outer wrapper touches the trigger (`top-full`, no margin) and provides the
              // visual gap as PADDING (`pt-2`), so the pointer never crosses empty space when
              // moving from the trigger into the menu — the dropdown no longer closes mid-move.
              <div className="absolute start-0 top-full z-50 pt-2">
                <div
                  role="menu"
                  className="min-w-56 rounded-xl border border-line bg-bg p-2 shadow-2xl"
                >
                  {item.href ? (
                    <NavAnchor
                      link={{ ...item, href: item.href }}
                      role="menuitem"
                      className="block rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent/10 hover:text-accent"
                    />
                  ) : null}
                  {item.children.map((c, ci) => (
                    <NavAnchor
                      key={ci}
                      link={c}
                      role="menuitem"
                      className="block rounded-lg px-3 py-2 text-sm transition hover:bg-accent/10 hover:text-accent"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
