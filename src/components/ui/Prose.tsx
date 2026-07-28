import type { ComponentProps } from 'react';
import { RichText } from '@optimizely/cms-sdk/react/richText';

/**
 * Prose — the single place editorial rich text is styled.
 *
 * The CMS stores rich text as HTML and Graph returns it BOTH as `html` and as a
 * parsed node tree (`json`); we always render the `json` via the SDK's <RichText>
 * so nothing user-authored is ever passed to `dangerouslySetInnerHTML`.
 *
 * Element styles are applied with Tailwind arbitrary-variant selectors rather than
 * a plugin, matching the rest of the design system. Measure is capped at 68ch per
 * DESIGN-SYSTEM.md — long lines are the fastest way to make body copy unreadable.
 */
const PROSE =
  'max-w-[68ch] text-lg leading-relaxed text-muted ' +
  '[&_a]:text-accent [&_a]:underline ' +
  '[&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-fg [&_h2]:mt-10 ' +
  '[&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-fg [&_h3]:mt-8 ' +
  '[&_p]:mt-5 [&_strong]:text-fg [&_strong]:font-semibold ' +
  '[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-2 ' +
  '[&_blockquote]:mt-6 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-5 [&_blockquote]:italic';

type Props = {
  /** The `json` half of a rich-text field, e.g. `content.body?.json`. */
  content: ComponentProps<typeof RichText>['content'];
  className?: string;
};

export function Prose({ content, className }: Props) {
  // An unauthored rich-text field yields no children — render nothing rather than
  // an empty styled block that would add stray vertical rhythm.
  if (!content?.children?.length) return null;
  return (
    <div className={className ? `${PROSE} ${className}` : PROSE}>
      <RichText content={content} />
    </div>
  );
}

export { PROSE as proseClassName };
