import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import KuralResultList from '@/components/kural-result-list';
import kuralService from '@/app/service/kural-service';
import taxonomyService from '@/app/service/taxonomy-service';

const KURALS_PER_PAGE = 10;
const MIN_KURAL_NUMBER = 1;
const MAX_KURAL_NUMBER = 1330;
const MAX_CHAPTER_NUMBER = 133;

type BrowsePageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SearchState = {
    query: string;
    sectionId?: number;
    chapterId?: number;
    page: number;
};

export const metadata: Metadata = {
    title: 'Browse Kurals',
    description: 'Find Thirukkural couplets by number, keyword, section, or chapter.',
    alternates: { canonical: '/browse' },
};

function getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function getId(value: string, maximum: number): number | undefined {
    if (!/^[1-9]\d*$/.test(value)) {
        return undefined;
    }

    const id = Number(value);
    return id <= maximum ? id : undefined;
}

function getPage(value: string): number {
    return getId(value, Number.MAX_SAFE_INTEGER) ?? 1;
}

function getSearchState(params: Record<string, string | string[] | undefined>): SearchState {
    const query = getParam(params.q).trim();
    const sectionId = getId(getParam(params.section), 3);
    const chapterId = getId(getParam(params.chapter), MAX_CHAPTER_NUMBER);
    const page = getPage(getParam(params.page));

    return { query, sectionId, chapterId, page };
}

export default async function BrowsePage({ searchParams }: Readonly<BrowsePageProps>) {
    const state = getSearchState(await searchParams);
    const isKuralNumberQuery = /^[1-9]\d*$/.test(state.query);
    const requestedKuralNumber = isKuralNumberQuery ? Number(state.query) : undefined;
    const resultPage = isKuralNumberQuery ? 1 : state.page;
    const keywords = state.query
        ? state.query
              .split(',')
              .map((keyword) => keyword.trim())
              .filter(Boolean)
        : [];

    const searchResult =
        requestedKuralNumber !== undefined
            ? (() => {
                  const kural =
                      requestedKuralNumber >= MIN_KURAL_NUMBER && requestedKuralNumber <= MAX_KURAL_NUMBER
                          ? kuralService.search(requestedKuralNumber)
                          : undefined;
                  return { results: kural ? [kural] : [], total: kural ? 1 : 0 };
              })()
            : kuralService.searchByKeyword(keywords, state.page, KURALS_PER_PAGE, state.sectionId, state.chapterId);

    const chapters = taxonomyService.getChapters(state.sectionId);
    const hasFilters = Boolean(state.query || state.sectionId || state.chapterId);
    const totalPages = Math.ceil(searchResult.total / KURALS_PER_PAGE);
    const resultCountLabel = searchResult.total === 1 ? 'Kural' : 'Kurals';
    const resultDescription = hasFilters ? `${searchResult.total} ${resultCountLabel} found` : 'Browse all 1,330 Kurals';
    const firstResultNumber = (resultPage - 1) * KURALS_PER_PAGE + 1;
    const lastResultNumber = Math.min(resultPage * KURALS_PER_PAGE, searchResult.total);
    const getBrowseHref = (page: number) => {
        const params = new URLSearchParams();
        if (state.query) params.set('q', state.query);
        if (state.sectionId) params.set('section', String(state.sectionId));
        if (state.chapterId) params.set('chapter', String(state.chapterId));
        params.set('page', String(page));
        return `/browse?${params.toString()}`;
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_36%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#eef2ff_100%)] px-4 py-6 text-slate-900 sm:px-8 sm:py-10 lg:px-10">
            <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-2xl shadow-blue-950/10 backdrop-blur-sm sm:rounded-5xl">
                <header className="relative overflow-hidden bg-linear-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-14">
                    <div className="absolute -right-20 -top-24 size-72 rounded-full bg-blue-400/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-32 left-1/3 size-64 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />
                    <div className="relative">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Your reading path</p>
                        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Find a Kural</h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100/85 sm:text-lg">
                            Search 1,330 couplets by number or by the ideas that matter to you. Narrow the journey by section or chapter.
                        </p>
                    </div>
                </header>

                <section className="border-b border-slate-200/80 px-5 py-7 sm:px-10 sm:py-9 lg:px-14" aria-labelledby="browse-form-heading">
                    <h2 id="browse-form-heading" className="sr-only">
                        Search and filter Kurals
                    </h2>
                    <form action="/browse" method="get" className="space-y-4">
                        <label htmlFor="kural-search" className="block text-sm font-bold text-blue-950">
                            Search by Kural number or keyword
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                <input
                                    id="kural-search"
                                    name="q"
                                    type="search"
                                    defaultValue={state.query}
                                    placeholder="Try 42, அறம், kindness, or love"
                                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base text-blue-950 shadow-sm outline-none transition focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                            >
                                Search
                            </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-sm font-semibold text-slate-700">
                                <span>Section</span>
                                <select
                                    name="section"
                                    defaultValue={state.sectionId ?? ''}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="">All sections</option>
                                    {taxonomyService.getSections().map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.id}. {section.names.en} — {section.names.ta}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sm font-semibold text-slate-700">
                                <span>Chapter</span>
                                <select
                                    name="chapter"
                                    defaultValue={state.chapterId ?? ''}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="">All chapters</option>
                                    {chapters.map((chapter) => (
                                        <option key={chapter.id} value={chapter.id}>
                                            {chapter.id}. {chapter.names.en} — {chapter.names.ta}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        {hasFilters && (
                            <Link href="/browse" className="inline-flex text-sm font-semibold text-blue-700 hover:text-blue-950">
                                Clear search and filters
                            </Link>
                        )}
                    </form>
                </section>

                <section className="px-5 py-8 sm:px-10 sm:py-12 lg:px-14" aria-labelledby="browse-results-heading">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Explore wisdom</p>
                            <h2 id="browse-results-heading" className="mt-2 text-3xl font-semibold tracking-tight text-blue-950 sm:text-4xl">
                                {resultDescription}
                            </h2>
                        </div>
                        <p className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">Tamil + modern meaning</p>
                    </div>

                    <div className="mt-8">
                        {searchResult.results.length > 0 ? (
                            <>
                                <p className="mb-5 text-sm font-medium text-slate-500">
                                    Showing {firstResultNumber}–{lastResultNumber} of {searchResult.total}
                                </p>
                                <KuralResultList
                                    kurals={searchResult.results}
                                    total={searchResult.total}
                                    showPosition={!isKuralNumberQuery}
                                    startIndex={firstResultNumber - 1}
                                />
                                {!isKuralNumberQuery && totalPages > 1 && (
                                    <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Browse result pages">
                                        {resultPage > 1 ? (
                                            <Link
                                                href={getBrowseHref(resultPage - 1)}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                            >
                                                ← Previous
                                            </Link>
                                        ) : (
                                            <span className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-300">
                                                ← Previous
                                            </span>
                                        )}
                                        <span className="text-sm font-semibold text-slate-500">
                                            Page {resultPage} of {totalPages}
                                        </span>
                                        {resultPage < totalPages ? (
                                            <Link
                                                href={getBrowseHref(resultPage + 1)}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                            >
                                                Next →
                                            </Link>
                                        ) : (
                                            <span className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-300">
                                                Next →
                                            </span>
                                        )}
                                    </nav>
                                )}
                            </>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
                                <p className="text-lg font-semibold text-blue-950">No Kurals found</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Try a different keyword, a number from 1 to 1,330, or remove one of the filters.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </article>
        </main>
    );
}
