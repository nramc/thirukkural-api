import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import kuralService from '@/app/service/kural-service';
import taxonomyService from '@/app/service/taxonomy-service';

const MIN_CHAPTER_NUMBER = 1;
const MAX_CHAPTER_NUMBER = 133;
const KURALS_PER_CHAPTER = 10;

type ChapterPageProps = {
    params: Promise<{ chapterNumber: string }>;
};

function getChapterNumber(chapterNumber: string): number | undefined {
    if (!/^[1-9]\d*$/.test(chapterNumber)) {
        return undefined;
    }

    const number = Number(chapterNumber);
    return number >= MIN_CHAPTER_NUMBER && number <= MAX_CHAPTER_NUMBER ? number : undefined;
}

function getChapterFromParams(chapterNumber: string) {
    const number = getChapterNumber(chapterNumber);
    return number === undefined ? undefined : taxonomyService.getChapter(number);
}

function getDescription(chapter: NonNullable<ReturnType<typeof getChapterFromParams>>): string {
    return `Read all 10 Thirukkural couplets from chapter ${chapter.id}, ${chapter.names.ta} (${chapter.names.en}), with the original Tamil text.`;
}

export async function generateStaticParams() {
    return Array.from({ length: MAX_CHAPTER_NUMBER }, (_, index) => ({ chapterNumber: String(index + MIN_CHAPTER_NUMBER) }));
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
    const { chapterNumber } = await params;
    const chapter = getChapterFromParams(chapterNumber);

    if (!chapter) {
        return { title: 'Chapter not found' };
    }

    const description = getDescription(chapter);
    const title = `Chapter ${chapter.id} — ${chapter.names.ta} (${chapter.names.en})`;
    const url = `/chapters/${chapter.id}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'article',
        },
    };
}

export default async function ChapterPage({ params }: Readonly<ChapterPageProps>) {
    const { chapterNumber } = await params;
    const chapter = getChapterFromParams(chapterNumber);

    if (!chapter) {
        notFound();
    }

    const { results: kurals, total } = kuralService.searchByKeyword([], 1, KURALS_PER_CHAPTER, undefined, chapter.id);
    if (total !== KURALS_PER_CHAPTER || kurals.length !== KURALS_PER_CHAPTER) {
        notFound();
    }

    const previousChapterId = chapter.id === MIN_CHAPTER_NUMBER ? MAX_CHAPTER_NUMBER : chapter.id - 1;
    const nextChapterId = chapter.id === MAX_CHAPTER_NUMBER ? MIN_CHAPTER_NUMBER : chapter.id + 1;
    const previousChapter = taxonomyService.getChapter(previousChapterId);
    const nextChapter = taxonomyService.getChapter(nextChapterId);

    if (!previousChapter || !nextChapter) {
        notFound();
    }

    const section = taxonomyService.getSection(chapter.sectionId);
    if (!section) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_36%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#eef2ff_100%)] px-4 py-6 text-slate-900 sm:px-8 sm:py-10 lg:px-10">
            <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-2xl shadow-blue-950/10 backdrop-blur-sm sm:rounded-5xl">
                <header className="relative overflow-hidden bg-linear-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-8 text-white sm:px-10 sm:py-11 lg:px-14">
                    <div className="absolute -right-20 -top-24 size-72 rounded-full bg-blue-400/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-32 left-1/3 size-64 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />
                    <div className="relative">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                            <span className="rounded-full border border-blue-300/30 bg-white/10 px-3 py-1.5">
                                Chapter {chapter.id} of {MAX_CHAPTER_NUMBER}
                            </span>
                            <span className="text-blue-300" aria-hidden="true">
                                ·
                            </span>
                            <span>{section.names.en}</span>
                        </div>
                        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">{chapter.names.ta}</h1>
                        <p className="mt-3 text-xl text-blue-100 sm:text-2xl">{chapter.names.en}</p>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100/80">
                            Read all ten original Tamil couplets from this chapter with clear, modern interpretations for everyday learning.
                        </p>

                        <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Kurals</p>
                                <p className="mt-1 text-lg font-semibold">
                                    {chapter.firstKural}–{chapter.lastKural}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Reading</p>
                                <p className="mt-1 text-lg font-semibold">{KURALS_PER_CHAPTER} couplets</p>
                            </div>
                            <div className="col-span-2 rounded-2xl border border-white/15 bg-white/10 p-4 sm:col-span-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Section</p>
                                <p className="mt-1 text-lg font-semibold">{section.names.ta}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="px-5 py-8 sm:px-10 sm:py-12 lg:px-14" aria-labelledby="chapter-kurals-heading">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">A simple reading path</p>
                            <h2 id="chapter-kurals-heading" className="mt-2 text-3xl font-semibold tracking-tight text-blue-950 sm:text-4xl">
                                Read the chapter
                            </h2>
                        </div>
                        <p className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">Tamil + modern meaning</p>
                    </div>

                    <div className="mt-8 space-y-5">
                        {kurals.map((kural, index) => (
                            <Link
                                key={kural.number}
                                href={`/kural/${kural.number}`}
                                className="group relative block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                            >
                                <div
                                    className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-blue-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"
                                    aria-hidden="true"
                                />
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
                                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Kural {kural.number}</p>
                                    <span className="text-xs font-semibold text-slate-400">
                                        {index + 1} of {KURALS_PER_CHAPTER}
                                    </span>
                                </div>

                                <div>
                                    <div className="border-l-4 border-blue-600 bg-linear-to-br from-blue-50 to-indigo-50 px-5 py-6 sm:px-7">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Tamil original · தமிழ்</p>
                                        <blockquote className="mt-3 font-serif text-xl leading-10 text-blue-950 sm:text-2xl sm:leading-[2.7rem]" lang="ta">
                                            <p>{kural.kural[0]}</p>
                                            <p>{kural.kural[1]}</p>
                                        </blockquote>
                                    </div>
                                    <div className="border-t border-slate-100 px-5 py-6 sm:px-7" lang="en">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Modern interpretation</p>
                                        <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">{kural.meaning.en_modern}</p>
                                    </div>
                                </div>
                                <p className="border-t border-slate-100 px-5 py-4 text-sm font-semibold text-blue-700 transition-colors group-hover:text-blue-950 sm:px-7">
                                    Read Kural {kural.number} in full <span aria-hidden="true">→</span>
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                <nav
                    className="grid gap-4 border-t border-slate-200/80 bg-slate-50/70 px-6 py-8 sm:grid-cols-2 sm:px-10 lg:px-14"
                    aria-label="Chapter navigation"
                >
                    <Link
                        href={`/chapters/${previousChapter.id}`}
                        className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                        <span className="block text-xs font-bold uppercase tracking-[0.16em]">← Previous chapter</span>
                        <span className="mt-2 block font-semibold group-hover:text-blue-950">{previousChapter.names.ta}</span>
                        <span className="block text-sm text-slate-600">{previousChapter.names.en}</span>
                    </Link>
                    <Link
                        href={`/chapters/${nextChapter.id}`}
                        className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 text-right text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                        <span className="block text-xs font-bold uppercase tracking-[0.16em]">Next chapter →</span>
                        <span className="mt-2 block font-semibold group-hover:text-blue-950">{nextChapter.names.ta}</span>
                        <span className="block text-sm text-slate-600">{nextChapter.names.en}</span>
                    </Link>
                </nav>
            </article>
        </main>
    );
}
