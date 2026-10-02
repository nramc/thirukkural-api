import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowRight, BookOpen, CircleUserRound, Code2, Heart, Lightbulb} from 'lucide-react';

export const metadata: Metadata = {
    title: 'About',
    description: 'Learn about the purpose, sources, and vision behind this open-source Thirukkural project and its free public REST API.',
    alternates: {
        canonical: '/about',
    },
};

const sections = [
    {
        title: 'What is the Thirukkural?',
        description:
            'The Thirukkural is a classic Tamil work of 1,330 concise couplets. It explores how to live with integrity, take part in society, and build human relationships. Its three sections are commonly understood as virtue, wealth, and love.',
        icon: BookOpen,
    },
    {
        title: 'A poet remembered as Valluvar',
        description:
            'Thiruvalluvar, often called Valluvar, is the poet and thinker traditionally credited with composing the Thirukkural. Many details of his life remain uncertain; his couplets continue to be read and interpreted across generations.',
        icon: Heart,
    },
    {
        title: 'A practical way to explore',
        description:
            'We want the work to feel approachable to curious readers and useful to people who teach, study, and build. Browse a couplet, compare interpretations, or use the REST API to create a thoughtful learning experience with modern technology.',
        icon: Lightbulb,
    },
];

export default function AboutPage() {
    return (
        <main
            className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4 py-12 text-slate-900 sm:px-8 sm:py-16 lg:px-10">
            <div className="mx-auto max-w-5xl">
                <header className="max-w-3xl">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">About this project</p>
                    <h1 className="mt-4 text-4xl font-semibold tracking-tight text-blue-950 sm:text-6xl">Old wisdom,
                        open to new possibilities.</h1>
                    <p className="mt-6 text-lg leading-8 text-slate-600">
                        We created this project to make the Thirukkural easier to discover and use. When we could not
                        find a public REST API for the Kurals, we
                        began building one—alongside a welcoming place to read, learn, and explore.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href="/browse"
                            className="inline-flex items-center gap-2 rounded-full bg-blue-800 px-5 py-3 text-sm font-semibold text-white! transition hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        >
                            Explore the Kurals <ArrowRight className="size-4" aria-hidden="true"/>
                        </Link>
                        <Link
                            href="/openapi/swagger-ui.html#Kural"
                            target={'_blank'}
                            rel={'noreferrer'}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        >
                            <Code2 className="size-4" aria-hidden="true"/> View the API
                        </Link>
                    </div>
                </header>

                <section aria-labelledby="kural-intro" className="mt-16 grid gap-5 md:grid-cols-3">
                    {sections.map(({title, description, icon: Icon}) => (
                        <article key={title}
                                 className="rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-sm sm:p-7">
                            <div
                                className="flex size-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                                <Icon className="size-5" aria-hidden="true"/>
                            </div>
                            <h2 id={title === sections[0].title ? 'kural-intro' : undefined}
                                className="mt-5 text-xl font-semibold text-blue-950">
                                {title}
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                        </article>
                    ))}
                </section>

                <section aria-labelledby="vision-heading"
                         className="mt-16 rounded-4xl bg-blue-950 px-6 py-9 text-white sm:px-10 sm:py-12">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Our vision and mission</p>
                    <h2 id="vision-heading"
                        className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                        Help timeless Tamil wisdom find a place in everyday life.
                    </h2>
                    <p className="mt-5 max-w-3xl text-base leading-7 text-blue-100">
                        Our mission is to make the Thirukkural approachable for readers and practical for learners,
                        educators, and developers. We do this by
                        bringing the collection, attributed interpretations, and a free public API together in one
                        open-source project—and by staying open to
                        learning and improving along the way.
                    </p>
                </section>

                <section aria-labelledby="languages-heading" className="mt-16">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Content and languages</p>
                    <h2 id="languages-heading" className="mt-3 text-3xl font-semibold tracking-tight text-blue-950">
                        Tamil at the centre, with ways in for more readers.
                    </h2>
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <article className="rounded-3xl border border-blue-100 bg-white/80 p-6">
                            <h3 className="text-lg font-semibold text-blue-950">Tamil</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                The couplets are presented in Tamil. Tamil meanings are credited to Mu. Varadarajan
                                (Mu.Va), Solomon Pappayya, and M.
                                Karunanidhi (Kalaignar).
                            </p>
                        </article>
                        <article className="rounded-3xl border border-blue-100 bg-white/80 p-6">
                            <h3 className="text-lg font-semibold text-blue-950">English and transliteration</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                The English translation is credited to G. U. Pope. A separate modern-English
                                interpretation offers a plain-language explanation;
                                it is not a literal translation. Latin-script transliterations help readers sound out
                                the Tamil couplets.
                            </p>
                        </article>
                    </div>
                    <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-600">
                        The transliteration data is based on the{' '}
                        <a
                            href="https://github.com/tk120404/thirukkural/blob/master/thirukkural.json"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-blue-950"
                        >
                            public Thirukkural dataset
                        </a>
                        ; English chapter labels are based on its{' '}
                        <a
                            href="https://github.com/tk120404/thirukkural/blob/master/detail.json"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-blue-950"
                        >
                            chapter metadata
                        </a>
                        . The modern-English interpretations are explanatory editorial content prepared for this
                        project.
                    </p>
                </section>

                <section
                    aria-labelledby="open-source-heading"
                    className="mt-16 grid gap-8 rounded-4xl border border-blue-100 bg-white/80 p-6 sm:p-9 md:grid-cols-[1fr_auto] md:items-center"
                >
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Open source and public
                            use</p>
                        <h2 id="open-source-heading"
                            className="mt-3 text-3xl font-semibold tracking-tight text-blue-950">
                            Free to explore. Open to build with.
                        </h2>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                            The application code is open source under the MIT License, and the public REST API is
                            available free of charge for public use. We
                            hope it helps people learn, experiment, and build useful tools. Please use the service
                            considerately and check the original terms
                            for third-party texts and datasets before reusing them; the software license does not
                            automatically cover every content source.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 md:justify-end">
                        <a
                            href="https://github.com/nramc/thirukkural-api"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        >
                            View source on GitHub <ArrowRight className="size-4" aria-hidden="true"/>
                        </a>
                        <a
                            href="https://codewithram.dev/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        >
                            <CircleUserRound className="size-4" aria-hidden="true"/> Contact
                        </a>
                    </div>
                </section>

                <section aria-labelledby="thanks-heading" className="mt-16 border-t border-blue-100 pt-8">
                    <h2 id="thanks-heading" className="text-xl font-semibold text-blue-950">
                        With thanks
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                        We are grateful to G. U. Pope for the English translation; to Mu. Varadarajan, Solomon Pappayya,
                        and M. Karunanidhi (Kalaignar) for the
                        Tamil meanings; and to Vercel, Google, and OpenRouter for technology and services that support
                        this project.
                    </p>
                    <p className="mt-3 max-w-3xl text-xs leading-6 text-slate-500">
                        These acknowledgments describe the sources and services used by the project; source texts,
                        translations, and datasets may have terms
                        separate from the MIT-licensed application code.
                    </p>
                </section>
            </div>
        </main>
    );
}
