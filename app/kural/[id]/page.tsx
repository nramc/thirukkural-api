import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import kuralService from '@/app/service/kural-service';

const MIN_KURAL_NUMBER = 1;
const MAX_KURAL_NUMBER = 1330;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kural.codewithram.dev';
const traditionalMeaningLabels: Record<string, string> = {
    ta_mu_va: 'Mu. Va.',
    ta_salamon: 'Solomon Pappayya',
    ta_kalaignar: 'Kalaignar',
};

type KuralPageProps = {
    params: Promise<{ id: string }>;
};

function getKuralNumber(id: string): number | undefined {
    if (!/^[1-9]\d*$/.test(id)) {
        return undefined;
    }

    const number = Number(id);
    return number >= MIN_KURAL_NUMBER && number <= MAX_KURAL_NUMBER ? number : undefined;
}

function getKuralFromParams(id: string) {
    const number = getKuralNumber(id);
    return number === undefined ? undefined : kuralService.search(number);
}

function getDescription(kural: NonNullable<ReturnType<typeof getKuralFromParams>>): string {
    const englishMeaning = kural.meaning.en?.trim();
    const chapterName = `${kural.chapter.names.ta} (${kural.chapter.names.en})`;
    return englishMeaning
        ? `Read Thirukkural ${kural.number} from the chapter ${chapterName}, with the original Tamil couplet and English meaning: ${englishMeaning}`
        : `Read Thirukkural ${kural.number} from the chapter ${chapterName}, with the original Tamil couplet and traditional meanings.`;
}

export async function generateStaticParams() {
    return Array.from({ length: MAX_KURAL_NUMBER }, (_, index) => ({ id: String(index + MIN_KURAL_NUMBER) }));
}

export async function generateMetadata({ params }: KuralPageProps): Promise<Metadata> {
    const { id } = await params;
    const kural = getKuralFromParams(id);

    if (!kural) {
        return { title: 'Kural not found' };
    }

    const description = getDescription(kural);
    const title = `Kural ${kural.number} — ${kural.chapter.names.ta} (${kural.chapter.names.en})`;
    const url = `/kural/${kural.number}`;

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

export default async function KuralPage({ params }: Readonly<KuralPageProps>) {
    const { id } = await params;
    const kural = getKuralFromParams(id);

    if (!kural) {
        notFound();
    }

    const previousKural = kural.number > MIN_KURAL_NUMBER ? kural.number - 1 : undefined;
    const nextKural = kural.number < MAX_KURAL_NUMBER ? kural.number + 1 : undefined;
    const description = getDescription(kural);
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: `Kural ${kural.number}`,
        headline: `Kural ${kural.number} — ${kural.chapter.names.ta} (${kural.chapter.names.en})`,
        description,
        url: `${siteUrl}/kural/${kural.number}`,
        isPartOf: {
            '@type': 'Book',
            name: 'Thirukkural',
        },
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_36%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#eef2ff_100%)] px-4 py-6 text-slate-900 sm:px-8 sm:py-10 lg:px-10">
            <article className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-2xl shadow-blue-950/10 backdrop-blur-sm sm:rounded-5xl">
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', String.raw`\u003c`) }} />

                <header className="relative overflow-hidden bg-linear-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-8 text-white sm:px-10 sm:py-11 lg:px-14">
                    <div className="absolute -right-20 -top-24 size-72 rounded-full bg-blue-400/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-32 left-1/3 size-64 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />
                    <div className="relative">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                            <span className="rounded-full border border-blue-300/30 bg-white/10 px-3 py-1.5">Thirukkural</span>
                            <span className="text-blue-300" aria-hidden="true">
                                ·
                            </span>
                            <span>{kural.section.names.en}</span>
                        </div>
                        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">{kural.chapter.names.ta}</h1>
                        <p className="mt-3 text-xl text-blue-100 sm:text-2xl">{kural.chapter.names.en}</p>
                        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-blue-100/80">
                            <span>
                                {kural.section.names.ta} · {kural.section.names.en}
                            </span>
                            <span className="hidden text-blue-300 sm:inline" aria-hidden="true">
                                •
                            </span>
                            <span>Kural {kural.number} of 1,330</span>
                        </div>
                        <Link
                            href={`/chapters/${kural.chapter.id}`}
                            className="mt-7 inline-flex items-center rounded-full border border-blue-300/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-blue-50 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/50"
                        >
                            Read the full chapter{' '}
                            <span className="ml-2" aria-hidden="true">
                                →
                            </span>
                        </Link>
                    </div>
                </header>

                <div className="px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
                    <section aria-labelledby="kural-text-heading">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">The original couplet · குறள்</p>
                                <h2 id="kural-text-heading" className="mt-2 text-3xl font-semibold tracking-tight text-blue-950 sm:text-4xl">
                                    Read it in Tamil
                                </h2>
                                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                                    Start with the original words, then use the learner-friendly guides below to explore their meaning.
                                </p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">No. {kural.number}</span>
                        </div>

                        <div className="mt-8 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5">
                            <div className="border-l-4 border-blue-600 bg-linear-to-br from-blue-50 to-indigo-50 px-6 py-8 sm:px-10 sm:py-11">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Tamil original</p>
                                    <span className="text-lg text-blue-300" aria-hidden="true">
                                        ❝
                                    </span>
                                </div>
                                <blockquote className="mt-4 font-serif text-2xl leading-[2.7rem] text-blue-950 sm:text-3xl sm:leading-14">
                                    <p>{kural.kural[0]}</p>
                                    <p>{kural.kural[1]}</p>
                                </blockquote>
                            </div>
                            <div className="grid gap-6 border-t border-slate-100 bg-slate-50/60 px-6 py-6 sm:px-10 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Read the sounds · Transliteration</p>
                                    <p className="mt-2 text-sm italic leading-7 text-slate-600 sm:text-base">
                                        {kural.transliteration[0]}
                                        <br />
                                        {kural.transliteration[1]}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Understand the idea · English meaning</p>
                                    <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">{kural.meaning.en}</p>
                                </div>
                                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 lg:col-span-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Connect it to life today · Modern meaning</p>
                                    <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">{kural.meaning.en_modern}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-12" aria-labelledby="meanings-heading">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Explore the layers</p>
                            <h2 id="meanings-heading" className="mt-2 text-3xl font-semibold tracking-tight text-blue-950 sm:text-4xl">
                                Traditional meanings
                            </h2>
                            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                                Compare traditional Tamil explanations to discover the layers of meaning within this couplet.
                            </p>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {Object.entries(kural.meaning)
                                .filter(([name]) => !['en', 'en_modern'].includes(name))
                                .map(([name, meaning]) => (
                                    <div
                                        key={name}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                                    >
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700">{traditionalMeaningLabels[name] ?? name}</h3>
                                        <p className="mt-2 leading-7 text-slate-700">{meaning}</p>
                                    </div>
                                ))}
                        </div>
                    </section>
                </div>

                <nav
                    className="grid gap-4 border-t border-slate-200/80 bg-slate-50/70 px-6 py-8 sm:grid-cols-2 sm:px-10 lg:px-14"
                    aria-label="Kural navigation"
                >
                    {previousKural ? (
                        <Link
                            href={`/kural/${previousKural}`}
                            className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                        >
                            <span className="block text-xs font-bold uppercase tracking-[0.16em]">← Previous Kural</span>
                            <span className="mt-2 block font-semibold group-hover:text-blue-950">Kural {previousKural}</span>
                        </Link>
                    ) : (
                        <div />
                    )}
                    {nextKural ? (
                        <Link
                            href={`/kural/${nextKural}`}
                            className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 text-right text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                        >
                            <span className="block text-xs font-bold uppercase tracking-[0.16em]">Next Kural →</span>
                            <span className="mt-2 block font-semibold group-hover:text-blue-950">Kural {nextKural}</span>
                        </Link>
                    ) : (
                        <div />
                    )}
                </nav>
            </article>
        </main>
    );
}
