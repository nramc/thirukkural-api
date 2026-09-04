'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { Kural } from '@/app/domain/kurals-db';
import { buttonVariants } from '@/components/ui/button';
import { getKuralChatHref } from '@/lib/ai/kural-prompt';

type Explanation = 'modern' | 'ta';

const TOTAL_KURALS = 1330;

export default function DailyKuralWidget() {
    const [kural, setKural] = useState<Kural | null>(null);
    const [explanation, setExplanation] = useState<Explanation>('modern');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const fetchKuralOfTheDay = async () => {
            try {
                const response = await fetch('/api/daily', { signal: AbortSignal.timeout(10_000) });
                if (!response.ok) {
                    setHasError(true);
                    return;
                }
                const data: Kural = await response.json();
                setKural(data);
            } catch {
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchKuralOfTheDay();
    }, []);

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4" aria-label="Loading today’s Kural">
                <div className="h-4 w-24 rounded bg-white/20" />
                <div className="h-16 rounded-xl bg-white/10" />
                <div className="h-4 w-40 rounded bg-white/20" />
                <div className="h-20 rounded-xl bg-white/10" />
            </div>
        );
    }

    if (hasError || !kural) {
        return (
            <p role="alert" className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sm leading-6 text-blue-50">
                Today’s Kural is taking a short pause. Please refresh to try again.
            </p>
        );
    }

    const previousKural = kural.number === 1 ? TOTAL_KURALS : kural.number - 1;
    const nextKural = kural.number === TOTAL_KURALS ? 1 : kural.number + 1;
    const isTamilExplanation = explanation === 'ta';

    return (
        <article aria-labelledby="daily-kural-title">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={`/kural/${kural.number}`}
                        id="daily-kural-title"
                        className="group inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
                    >
                        <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-xs font-bold text-amber-200 transition group-hover:bg-white/25">
                            {kural.number}
                        </span>
                        <span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">Today’s Kural</span>
                            <span className="block">Read the full couplet</span>
                        </span>
                    </Link>
                </div>

                <fieldset className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1">
                    <legend className="sr-only">Choose explanation</legend>
                    <Sparkles className="ml-2 size-3.5 text-amber-200" aria-hidden="true" />
                    {(['modern', 'ta'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={explanation === option}
                            onClick={() => setExplanation(option)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${
                                explanation === option ? 'bg-white text-blue-800 shadow-sm' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {option === 'modern' ? 'Modern view' : 'தமிழ் விளக்கம்'}
                        </button>
                    ))}
                </fieldset>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-blue-200">
                <span>{kural.chapter.names.en}</span>
                <span className="size-1 rounded-full bg-amber-300" aria-hidden="true" />
                <span>{kural.section.names.en}</span>
            </div>

            <blockquote className="relative mt-6 rounded-3xl border border-white/15 bg-white/10 p-5 pb-16 font-serif text-xl font-medium leading-9 text-white shadow-inner shadow-white/5 sm:p-6 sm:pb-16 sm:text-2xl sm:leading-10">
                <span lang="ta">
                    {kural.kural[0]}
                    <br />
                    {kural.kural[1]}
                </span>
                <div className="absolute bottom-4 right-4 sm:right-5">
                    <Link
                        href={getKuralChatHref(kural)}
                        aria-label="Explain this Kural with Valluvar AI"
                        className={buttonVariants({
                            variant: 'default',
                            size: 'lg',
                            className:
                                'rounded-full shadow-lg shadow-blue-950/20 transition-transform hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary/90 hover:shadow-xl hover:shadow-blue-950/30 hover:ring-4 hover:ring-blue-200/30',
                        })}
                    >
                        <MessageCircle className="size-4" aria-hidden="true" />
                        <span>Explain this Kural</span>
                    </Link>
                </div>
            </blockquote>

            <div className="mt-6 rounded-2xl border border-amber-200/25 bg-amber-200/10 p-4 text-sm leading-6 text-blue-50">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
                    {isTamilExplanation ? 'தமிழ் விளக்கம்' : 'In today’s words'}
                </p>
                <p lang={isTamilExplanation ? 'ta' : 'en'}>{isTamilExplanation ? kural.meaning.ta_mu_va : kural.meaning.en_modern}</p>
            </div>

            <nav className="mt-7 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-2" aria-label="Browse Kurals">
                <Link
                    href={`/kural/${previousKural}`}
                    className="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                >
                    <ArrowLeft className="size-4 text-amber-200 transition group-hover:-translate-x-1" aria-hidden="true" />
                    <span>
                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">Previous</span>
                        <span className="font-semibold text-white">Kural {previousKural}</span>
                    </span>
                </Link>
                <Link
                    href={`/kural/${nextKural}`}
                    className="group flex items-center justify-end gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-right text-sm transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                >
                    <span>
                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">Next</span>
                        <span className="font-semibold text-white">Kural {nextKural}</span>
                    </span>
                    <ArrowRight className="size-4 text-amber-200 transition group-hover:translate-x-1" aria-hidden="true" />
                </Link>
            </nav>
        </article>
    );
}
