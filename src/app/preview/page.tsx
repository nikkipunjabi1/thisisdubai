import { cache } from 'react';
import type { Metadata } from 'next';
import { getClient, type PreviewParams } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { PreviewComponent } from '@optimizely/cms-sdk/react/client';
import { withAppContext } from '@optimizely/cms-sdk/react/server';
import Script from 'next/script';
import { getSiteSettings, buildContentMetadata, type PageSeo } from '@/lib/seo';
import { StakeholderLinkPanel } from './StakeholderLinkPanel';
import { articleHref } from '@/lib/articles';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Fetch the previewed (draft) content once; keyed by the serialized preview
// params so `generateMetadata` and the page share one Graph call.
const getPreview = cache((paramsJson: string) =>
  getClient().getPreviewContent(JSON.parse(paramsJson) as PreviewParams),
);

// Reflect the draft's authored SEO title in the preview tab, so editors see title
// changes live (unlike `/`, which only updates on publish).
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  try {
    const [content, settings] = await Promise.all([
      getPreview(JSON.stringify(await searchParams)),
      getSiteSettings(),
    ]);
    return buildContentMetadata(content as PageSeo, settings, 'Preview');
  } catch {
    return {};
  }
}

async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const content = await getPreview(JSON.stringify(sp));

  // The author-facing "share with a stakeholder" control (docs/PREVIEW-WORKFLOW.md).
  // Rendered only when the CMS supplied a preview token, i.e. only inside the editor:
  // that token is what authenticates the link generator, so without it there is nothing
  // to render and nothing to authorise.
  const previewToken = typeof sp.preview_token === 'string' ? sp.preview_token : '';
  const node = content as {
    slug?: string;
    publishDate?: string;
    _metadata?: {
      key?: string;
      version?: string;
      locale?: string;
      displayName?: string;
      types?: string[];
      url?: { default?: string };
    };
  };
  const meta = node?._metadata;

  // Where the share link should land. Most content carries its own CMS URL, but content
  // modelled as shared BLOCKS has none: articles are `ArticlePost` components whose route
  // this app derives from slug + publishDate (docs/CONTENT-ARCHITECTURE.md). Without this
  // the token would carry no path and the reviewer would land on the home page.
  const sharePath =
    meta?.url?.default ??
    (meta?.types?.includes('ArticlePost') && node.slug
      ? articleHref(node.slug, node.publishDate, isLocale(meta.locale) ? meta.locale : DEFAULT_LOCALE)
      : undefined);

  return (
    <>
      <Script
        src={
          new URL(
            '/util/javascript/communicationinjector.js',
            process.env.OPTIMIZELY_CMS_URL,
          ).href
        }
      ></Script>
      <PreviewComponent />
      <OptimizelyComponent content={content} />
      {previewToken && meta?.key && (
        <StakeholderLinkPanel
          previewToken={previewToken}
          contentKey={meta.key}
          version={meta.version ?? String(sp.ver ?? '')}
          locale={meta.locale ?? String(sp.loc ?? '')}
          path={sharePath}
          displayName={meta.displayName}
        />
      )}
    </>
  );
}

export default withAppContext(Page);
