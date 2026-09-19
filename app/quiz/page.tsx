'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles, Trophy, XCircle } from 'lucide-react';
import type { Kural } from '@/app/domain/kurals-db';
import TamilKural from '@/components/tamil-kural';
import { buttonVariants } from '@/components/ui/button';
import { getKuralChatHref } from '@/lib/ai/kural-prompt';

const OPTIONS_PER_ROUND = 4;
const RECENT_HISTORY_LIMIT = 60;
const FETCH_TIMEOUT_MS = 8_000;

type QuizOption = {
    kuralNumber: number;
    text: string;
};

type QuizRound = {
    target: Kural;
    options: QuizOption[];
    correctIndex: number;
};

function shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

async function fetchRandomKural(signal: AbortSignal): Promise<Kural> {
    const response = await fetch('/api/random', { signal });
    if (!response.ok) {
        throw new Error('Failed to fetch a random Kural');
    }
    return response.json();
}

async function fetchDistinctRandomKurals(count: number, excludeNumbers: Set<number>, signal: AbortSignal): Promise<Kural[]> {
    const collected = new Map<number, Kural>();
    let attempts = 0;
    const maxAttempts = count * 10 + 30;

    while (collected.size < count && attempts < maxAttempts) {
        attempts += 1;
        const kural = await fetchRandomKural(signal);
        if (!excludeNumbers.has(kural.number) && !collected.has(kural.number)) {
            collected.set(kural.number, kural);
        }
    }

    return [...collected.values()];
}

function buildRound(kurals: Kural[]): QuizRound {
    const target = kurals[Math.floor(Math.random() * kurals.length)];
    const options = shuffle(kurals.map((kural) => ({ kuralNumber: kural.number, text: kural.meaning.en_modern })));
    const correctIndex = options.findIndex((option) => option.kuralNumber === target.number);

    return { target, options, correctIndex };
}

function ScoreBadge({ label, value }: Readonly<{ label: string; value: number | string }>) {
    return (
        <div className="rounded-2xl border border-blue-100 bg-white px-4 py-2.5 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">{label}</p>
            <p className="mt-0.5 text-xl font-semibold text-blue-950">{value}</p>
        </div>
    );
}

function LoadingCard() {
    return (
        <div className="animate-pulse rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8" aria-label="Loading a new question">
            <div className="h-4 w-40 rounded bg-blue-100" />
            <div className="mt-4 h-20 rounded-2xl bg-blue-50" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: OPTIONS_PER_ROUND }, (_, index) => (
                    <div key={index} className="h-16 rounded-2xl bg-blue-50" />
                ))}
            </div>
        </div>
    );
}

function getOptionClassName(showCorrect: boolean, showIncorrectSelection: boolean): string {
    if (showCorrect) return 'border-emerald-300 bg-emerald-50 text-emerald-900';
    if (showIncorrectSelection) return 'border-rose-300 bg-rose-50 text-rose-900';
    return 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50';
}

export default function KuralQuizPage() {
    const [round, setRound] = useState<QuizRound | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const recentNumbers = useRef<number[]>([]);

    // Intentionally has no synchronous setState calls before its first await, so it is safe
    // to invoke directly from the mount effect below (all state updates happen inside the
    // promise's .then()/.catch()/.finally() callbacks, not in the effect's own call stack).
    const runRound = useCallback((signal: AbortSignal) => {
        const excludeNumbers = new Set(recentNumbers.current);
        void fetchDistinctRandomKurals(OPTIONS_PER_ROUND, excludeNumbers, signal)
            .then((kurals) => {
                if (signal.aborted) return;
                if (kurals.length < OPTIONS_PER_ROUND) {
                    throw new Error('Could not gather enough distinct Kurals for a round');
                }

                recentNumbers.current = [...recentNumbers.current, ...kurals.map((kural) => kural.number)].slice(-RECENT_HISTORY_LIMIT);
                setRound(buildRound(kurals));
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                setHasError(true);
            })
            .finally(() => {
                if (!signal.aborted) setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        // The initial useState values already represent "loading, no error, nothing selected",
        // so the first round can start the fetch directly without resetting state up front.
        runRound(controller.signal);
        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
        // Only the very first round should run automatically; "Next question" retriggers explicitly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const nextQuestion = () => {
        setIsLoading(true);
        setHasError(false);
        setSelectedIndex(null);

        const controller = new AbortController();
        window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        runRound(controller.signal);
    };

    const selectOption = (index: number) => {
        if (!round || selectedIndex !== null) return;

        setSelectedIndex(index);
        setAnswered((value) => value + 1);
        if (index === round.correctIndex) {
            setScore((value) => value + 1);
            setStreak((value) => value + 1);
        } else {
            setStreak(0);
        }
    };

    const hasAnswered = selectedIndex !== null;

    return (
        <main className="min-h-dvh bg-linear-to-br from-blue-50 via-white to-indigo-50 pb-16 text-slate-900">
            <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-3xl border border-blue-200 bg-blue-100 text-blue-700 shadow-lg shadow-blue-900/10">
                        <Trophy className="size-7" aria-hidden="true" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700/80 sm:text-xs">A fast, self-graded game</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-blue-950 sm:text-4xl">Kural Quiz</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                        Read the Tamil couplet, then pick the modern meaning that matches it.
                    </p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                    <ScoreBadge label="Score" value={`${score}/${answered}`} />
                    <ScoreBadge label="Streak" value={streak} />
                    <ScoreBadge label="Questions" value={answered} />
                </div>

                <div className="mt-6">
                    {isLoading && <LoadingCard />}

                    {!isLoading && hasError && (
                        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
                            <p className="text-sm text-rose-700">Could not load a question. Please try again.</p>
                            <button type="button" onClick={nextQuestion} className={buttonVariants({ variant: 'default', size: 'lg', className: 'mt-4' })}>
                                <RefreshCw className="size-4" aria-hidden="true" />
                                Try again
                            </button>
                        </div>
                    )}

                    {!isLoading && !hasError && round && (
                        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5">
                            <div className="border-l-4 border-blue-600 bg-linear-to-br from-blue-50 to-indigo-50 px-5 py-6 sm:px-7">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Which meaning matches this couplet?</p>
                                <blockquote className="mt-3 font-serif leading-10 text-blue-950 sm:leading-[2.7rem]">
                                    <TamilKural lines={round.target.kural} className="text-[clamp(1.25rem,4.5vw,1.75rem)]" />
                                </blockquote>
                            </div>

                            <div className="grid gap-3 px-5 py-6 sm:grid-cols-2 sm:px-7">
                                {round.options.map((option, index) => {
                                    const isCorrectOption = index === round.correctIndex;
                                    const isSelectedOption = index === selectedIndex;
                                    const showCorrect = hasAnswered && isCorrectOption;
                                    const showIncorrectSelection = hasAnswered && isSelectedOption && !isCorrectOption;

                                    return (
                                        <button
                                            key={option.kuralNumber}
                                            type="button"
                                            onClick={() => selectOption(index)}
                                            disabled={hasAnswered}
                                            aria-pressed={isSelectedOption}
                                            className={`flex items-start gap-2 rounded-2xl border p-4 text-left text-sm leading-6 transition disabled:cursor-not-allowed sm:text-[0.95rem] ${getOptionClassName(showCorrect, showIncorrectSelection)}`}
                                        >
                                            {showCorrect && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />}
                                            {showIncorrectSelection && <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />}
                                            <span>{option.text}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {hasAnswered && (
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
                                    <p className="text-sm font-semibold text-slate-600">
                                        That was <span className="text-blue-800">Kural {round.target.number}</span> · {round.target.chapter.names.en} ·{' '}
                                        {round.target.section.names.en}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={`/kural/${round.target.number}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                            Read in full
                                        </Link>
                                        <Link href={getKuralChatHref(round.target)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                            <Sparkles className="size-3.5" aria-hidden="true" />
                                            Explain with AI
                                        </Link>
                                        <button type="button" onClick={nextQuestion} className={buttonVariants({ variant: 'default', size: 'sm' })}>
                                            <RefreshCw className="size-3.5" aria-hidden="true" />
                                            Next question
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Prefer an open-ended quiz?{' '}
                    <Link href="/chat" className="font-semibold text-blue-700 underline underline-offset-4">
                        Ask Valluvar AI
                    </Link>{' '}
                    to run one turn by turn.
                </p>
            </div>
        </main>
    );
}
