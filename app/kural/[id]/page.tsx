import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import kuralService from '@/app/service/kural-service';

const MIN_KURAL_NUMBER = 1;
const MAX_KURAL_NUMBER = 1330;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kural.codewithram.dev';

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
    return englishMeaning
        ? `Read Thirukkural ${kural.number} from the chapter ${kural.chapter}, with the original Tamil couplet and English meaning: ${englishMeaning}`
        : `Read Thirukkural ${kural.number} from the chapter ${kural.chapter}, with the original Tamil couplet and traditional meanings.`;
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
    const title = `Kural ${kural.number} — ${kural.chapter}`;
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
        headline: `Kural ${kural.number} — ${kural.chapter}`,
        description,
        url: `${siteUrl}/kural/${kural.number}`,
        isPartOf: {
            '@type': 'Book',
            name: 'Thirukkural',
        },
    };

    return (
        <main className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4 py-12 text-slate-900 sm:px-8 lg:px-10">
            <article className="mx-auto max-w-4xl rounded-4xl border border-blue-200/80 bg-white/90 p-6 shadow-2xl shadow-blue-900/10 sm:p-10 lg:p-14">
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', String.raw`\u003c`) }} />

                <header>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Kural {kural.number}</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 sm:text-5xl">{kural.chapter}</h1>
                    <p className="mt-3 text-base text-slate-600">{kural.section}</p>
                </header>

                <blockquote className="mt-10 rounded-3xl bg-linear-to-br from-blue-700 to-indigo-900 p-6 font-serif text-xl leading-10 text-white shadow-xl shadow-blue-900/20 sm:p-10 sm:text-2xl">
                    <p>{kural.kural[0]}</p>
                    <p>{kural.kural[1]}</p>
                </blockquote>

                <section className="mt-10" aria-labelledby="meanings-heading">
                    <h2 id="meanings-heading" className="text-2xl font-semibold text-blue-950 sm:text-3xl">
                        Meanings
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {Object.entries(kural.meaning).map(([name, meaning]) => (
                            <div key={name} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700">{name === 'en' ? 'English meaning' : name}</h3>
                                <p className="mt-2 leading-7 text-slate-700">{meaning}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <nav className="mt-10 flex flex-wrap justify-between gap-4 border-t border-blue-100 pt-6" aria-label="Kural navigation">
                    {previousKural ? (
                        <Link href={`/kural/${previousKural}`} className="font-semibold text-blue-700 hover:text-blue-900">
                            ← Previous Kural
                        </Link>
                    ) : (
                        <span />
                    )}
                    {nextKural ? (
                        <Link href={`/kural/${nextKural}`} className="font-semibold text-blue-700 hover:text-blue-900">
                            Continue Reading →
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            </article>
        </main>
    );
}
