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

    return (
        <main className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4 py-12 text-slate-900 sm:px-8 lg:px-10">
            <article className="mx-auto max-w-4xl rounded-4xl border border-blue-200/80 bg-white/90 p-6 shadow-2xl shadow-blue-900/10 sm:p-10 lg:p-14">
                <header>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Chapter {chapter.id}</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 sm:text-5xl">{chapter.names.ta}</h1>
                    <p className="mt-2 text-lg text-slate-600">{chapter.names.en}</p>
                </header>

                <section className="mt-10 space-y-5" aria-labelledby="chapter-kurals-heading">
                    <h2 id="chapter-kurals-heading" className="text-2xl font-semibold text-blue-950 sm:text-3xl">
                        Kurals in this chapter
                    </h2>
                    <div className="space-y-4">
                        {kurals.map((kural) => (
                            <Link
                                key={kural.number}
                                href={`/kural/${kural.number}`}
                                className="group block rounded-3xl border border-blue-100 bg-blue-50/60 p-5 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:p-6"
                            >
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Kural {kural.number}</p>
                                <blockquote className="mt-3 font-serif text-xl leading-10 text-blue-950 sm:text-2xl">
                                    <p>{kural.kural[0]}</p>
                                    <p>{kural.kural[1]}</p>
                                </blockquote>
                                <p className="mt-3 text-sm font-semibold text-blue-700 group-hover:text-blue-900">Read Kural {kural.number} →</p>
                            </Link>
                        ))}
                    </div>
                </section>

                <nav className="mt-10 grid gap-4 border-t border-blue-100 pt-6 sm:grid-cols-2" aria-label="Chapter navigation">
                    <Link
                        href={`/chapters/${previousChapter.id}`}
                        className="rounded-2xl border border-blue-100 px-5 py-4 text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                        <span className="block text-xs font-bold uppercase tracking-[0.16em]">← Previous chapter</span>
                        <span className="mt-2 block font-semibold">{previousChapter.names.ta}</span>
                        <span className="block text-sm text-slate-600">{previousChapter.names.en}</span>
                    </Link>
                    <Link
                        href={`/chapters/${nextChapter.id}`}
                        className="rounded-2xl border border-blue-100 px-5 py-4 text-right text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                        <span className="block text-xs font-bold uppercase tracking-[0.16em]">Next chapter →</span>
                        <span className="mt-2 block font-semibold">{nextChapter.names.ta}</span>
                        <span className="block text-sm text-slate-600">{nextChapter.names.en}</span>
                    </Link>
                </nav>
            </article>
        </main>
    );
}
