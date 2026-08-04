import { DEFAULT_LOCALE, type Locale } from './i18n';

/**
 * UI string catalog — the visitor-facing chrome that isn't CMS content (nav, footer,
 * search, listing controls, breadcrumbs, detail micro-labels). CMS-authored text
 * (titles, bodies…) is localized in Graph; this covers everything the app renders itself.
 *
 * Hand-rolled and dependency-light on purpose (see docs/LOCALIZATION.md). `t(locale)`
 * returns the whole dictionary for that locale — components read `m.nav.home` etc.
 * Interpolated strings are functions (`m.footer.copyright(year)`). `en` is the source of
 * truth for the shape; `ar: Messages` forces every key to exist in Arabic.
 *
 * The AR strings are a solid first pass — refine in-editor / via Opal as needed.
 */
const en = {
  nav: {
    home: 'Home',
    places: 'Places to Visit',
    neighbourhoods: 'Neighbourhoods',
    events: 'Events',
    articles: 'Articles',
    search: 'Search',
    homeAria: 'This is Dubai — home',
  },
  footer: {
    tagline:
      'An independent demo exploring travel & tourism experiences, built on Optimizely SaaS CMS with a Next.js frontend.',
    disclaimer:
      'Unofficial, independent demo — not affiliated with, sponsored by, or endorsed by any tourism authority, destination brand, or government entity. For learning and showcase purposes only.',
    copyright: (year: number) => `© ${year} — a demo project. All branding is original.`,
  },
  search: {
    eyebrow: 'Search',
    prompt: 'What are you looking for?',
    results: 'Results',
    poweredBy:
      'Powered by Optimizely Graph’s semantic search — it matches on meaning, not just keywords.',
    tryThese: 'Try one of these:',
    /** Example queries that show off semantic (meaning-based) matching. */
    suggestions: ['skyscraper', 'fish tank', 'traditional heritage', 'swimming sea'],
    noMatchesPre: 'No matches for',
    browseHint: 'Try fewer or more general words — or browse',
    and: 'and',
    browseAll: (label: string) => `Browse all ${label}`,
    resultsFor: (n: number) => `${n} ${n === 1 ? 'result' : 'results'} for`,
    placeholder: 'Try “rooftop dining” or “traditional heritage”',
    button: 'Search',
    boxLabel: 'Search This is Dubai',
    metaDescription: 'Search places to visit, events and neighbourhoods across This is Dubai.',
    filterByType: 'Filter by type',
    filterAll: 'All',
  },
  preview: {
    banner: 'Preview: you are viewing unpublished draft content.',
    exit: 'Exit preview',
  },
  listing: {
    result: 'result',
    results: 'results',
    sort: 'Sort',
    price: 'Price',
    tags: 'Tags',
    clearAll: 'Clear all filters',
    sortAsc: 'A–Z',
    sortDesc: 'Z–A',
    sortNewest: 'Newest',
    free: 'Free',
  },
  crumbs: {
    home: 'Home',
    articles: 'Articles',
    search: 'Search',
  },
  detail: {
    price: 'Price',
    openingHours: 'Opening hours',
    location: 'Location',
    viewOnMap: 'View on map →',
    tickets: 'Tickets & info →',
    placesMentioned: 'Places mentioned',
    by: (author: string) => `By ${author}`,
  },
  media: {
    playVideo: 'Play video',
    watchOnYouTube: 'Watch on YouTube',
  },
};

export type Messages = typeof en;

const ar: Messages = {
  nav: {
    home: 'الرئيسية',
    places: 'أماكن للزيارة',
    neighbourhoods: 'الأحياء',
    events: 'الفعاليات',
    articles: 'المقالات',
    search: 'بحث',
    homeAria: 'This is Dubai — الصفحة الرئيسية',
  },
  footer: {
    tagline:
      'تجربة مستقلة تستكشف تجارب السفر والسياحة، مبنية على Optimizely SaaS CMS مع واجهة Next.js.',
    disclaimer:
      'تجربة توضيحية مستقلة وغير رسمية — غير مرتبطة بأي هيئة سياحية أو علامة وجهة أو جهة حكومية، ولا معتمدة منها. لأغراض التعلّم والعرض فقط.',
    copyright: (year: number) => `© ${year} — مشروع تجريبي. جميع العلامات أصلية.`,
  },
  search: {
    eyebrow: 'بحث',
    prompt: 'عمّ تبحث؟',
    results: 'النتائج',
    poweredBy: 'مدعوم بالبحث الدلالي من Optimizely Graph — يطابق المعنى لا الكلمات فقط.',
    tryThese: 'جرّب أحد هذه:',
    suggestions: ['ناطحة سحاب', 'حوض أسماك', 'التراث التقليدي', 'السباحة في البحر'],
    noMatchesPre: 'لا نتائج لـ',
    browseHint: 'جرّب كلمات أقل أو أعمّ — أو تصفّح',
    and: 'و',
    browseAll: (label: string) => `تصفّح كل ${label}`,
    resultsFor: (n: number) => `${n} ${n === 1 ? 'نتيجة' : 'نتائج'} لـ`,
    placeholder: 'جرّب «مطاعم السطح» أو «التراث التقليدي»',
    button: 'بحث',
    boxLabel: 'ابحث في This is Dubai',
    metaDescription: 'ابحث في أماكن الزيارة والفعاليات والأحياء عبر This is Dubai.',
    filterByType: 'تصفية حسب النوع',
    filterAll: 'الكل',
  },
  preview: {
    banner: 'معاينة: أنت تشاهد محتوى مسودة غير منشور.',
    exit: 'إنهاء المعاينة',
  },
  listing: {
    result: 'نتيجة',
    results: 'نتائج',
    sort: 'ترتيب',
    price: 'السعر',
    tags: 'الوسوم',
    clearAll: 'مسح كل عوامل التصفية',
    sortAsc: 'أ–ي',
    sortDesc: 'ي–أ',
    sortNewest: 'الأحدث',
    free: 'مجاني',
  },
  crumbs: {
    home: 'الرئيسية',
    articles: 'المقالات',
    search: 'بحث',
  },
  detail: {
    price: 'السعر',
    openingHours: 'ساعات العمل',
    location: 'الموقع',
    viewOnMap: 'عرض على الخريطة ←',
    tickets: 'التذاكر والمعلومات ←',
    placesMentioned: 'أماكن مذكورة',
    by: (author: string) => `بقلم ${author}`,
  },
  media: {
    playVideo: 'تشغيل الفيديو',
    watchOnYouTube: 'المشاهدة على يوتيوب',
  },
};

const CATALOG: Record<Locale, Messages> = { en, ar };

/** The full string dictionary for a locale. `const m = t(locale); m.nav.home`. */
export function t(locale: Locale): Messages {
  return CATALOG[locale] ?? CATALOG[DEFAULT_LOCALE];
}
