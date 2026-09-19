'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronRight, Languages, RefreshCw, Sparkles, Trophy, XCircle } from 'lucide-react';
import type { Kural } from '@/app/domain/kurals-db';
import TamilKural from '@/components/tamil-kural';
import { buttonVariants } from '@/components/ui/button';
import { getKuralChatHref } from '@/lib/ai/kural-prompt';

const OPTIONS_PER_ROUND = 4;
const RECENT_HISTORY_LIMIT = 60;
const FETCH_TIMEOUT_MS = 8_000;
const QUIZ_MEANING_STORAGE_KEY = 'thirukkural-quiz-meaning';

const QUIZ_MEANING_OPTIONS = [
    { key: 'en_modern', label: 'Modern English', locale: 'en', description: 'Simple, everyday wording' },
    { key: 'en', label: 'English translation', locale: 'en', description: 'A more traditional translation' },
    { key: 'ta_mu_va', label: 'தமிழ் · மு.வா.', locale: 'ta', description: 'மு.வா. விளக்கம்' },
    { key: 'ta_salamon', label: 'தமிழ் · சாலமன்', locale: 'ta', description: 'சாலமன் பாப்பையா விளக்கம்' },
    { key: 'ta_kalaignar', label: 'தமிழ் · கலைஞர்', locale: 'ta', description: 'கலைஞர் விளக்கம்' },
] as const satisfies ReadonlyArray<{ key: keyof Kural['meaning']; label: string; locale: 'en' | 'ta'; description: string }>;

type QuizMeaningKey = (typeof QUIZ_MEANING_OPTIONS)[number]['key'];

const DEFAULT_MEANING_KEY: QuizMeaningKey = 'en_modern';

type QuizOption = {
    kuralNumber: number;
    text: string;
    locale: 'en' | 'ta';
};

type QuizRound = {
    target: Kural;
    options: QuizOption[];
    correctIndex: number;
    meaningKey: QuizMeaningKey;
};

function isQuizMeaningKey(value: string | null): value is QuizMeaningKey {
    return QUIZ_MEANING_OPTIONS.some((option) => option.key === value);
}

function getMeaningOption(meaningKey: QuizMeaningKey) {
    return QUIZ_MEANING_OPTIONS.find((option) => option.key === meaningKey) ?? QUIZ_MEANING_OPTIONS[0];
}

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

function buildRound(kurals: Kural[], meaningKey: QuizMeaningKey): QuizRound {
    const target = kurals[Math.floor(Math.random() * kurals.length)];
    const meaningOption = getMeaningOption(meaningKey);
    const options = shuffle(kurals.map((kural) => ({ kuralNumber: kural.number, text: kural.meaning[meaningKey], locale: meaningOption.locale })));
    const correctIndex = options.findIndex((option) => option.kuralNumber === target.number);

    return { target, options, correctIndex, meaningKey };
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

function getOptionClassName(showCorrect: boolean, showIncorrectSelection: boolean, hasAnswered: boolean): string {
    if (showCorrect) return 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-sm shadow-emerald-900/5 ring-2 ring-emerald-100';
    if (showIncorrectSelection) return 'border-rose-300 bg-rose-50 text-rose-950 shadow-sm shadow-rose-900/5 ring-2 ring-rose-100';
    if (hasAnswered) return 'border-slate-200 bg-slate-50 text-slate-500 opacity-70';
    return 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-md hover:shadow-blue-900/5 focus-visible:ring-4 focus-visible:ring-blue-100';
}

function getOptionBadge(showCorrect: boolean, showIncorrectSelection: boolean, index: number): ReactNode {
    if (showCorrect) return <CheckCircle2 className="size-4" aria-hidden="true" />;
    if (showIncorrectSelection) return <XCircle className="size-4" aria-hidden="true" />;
    return String.fromCodePoint(65 + index);
}

export default function KuralQuizPage() {
    const [round, setRound] = useState<QuizRound | null>(null);
    const [meaningKey, setMeaningKey] = useState<QuizMeaningKey>(DEFAULT_MEANING_KEY);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const recentNumbers = useRef<number[]>([]);
    const activeController = useRef<AbortController | null>(null);

    // Intentionally has no synchronous setState calls before its first await, so it is safe
    // to invoke directly from the mount effect below (all state updates happen inside the
    // promise's .then()/.catch()/.finally() callbacks, not in the effect's own call stack).
    const runRound = useCallback((signal: AbortSignal, selectedMeaningKey: QuizMeaningKey) => {
        const excludeNumbers = new Set(recentNumbers.current);
        void fetchDistinctRandomKurals(OPTIONS_PER_ROUND, excludeNumbers, signal)
            .then((kurals) => {
                if (signal.aborted) return;
                if (kurals.length < OPTIONS_PER_ROUND) {
                    throw new Error('Could not gather enough distinct Kurals for a round');
                }

                recentNumbers.current = [...recentNumbers.current, ...kurals.map((kural) => kural.number)].slice(-RECENT_HISTORY_LIMIT);
                setRound(buildRound(kurals, selectedMeaningKey));
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
        const preferenceTimeoutId = window.setTimeout(() => {
            try {
                const storedMeaningKey = window.localStorage.getItem(QUIZ_MEANING_STORAGE_KEY);
                if (isQuizMeaningKey(storedMeaningKey) && storedMeaningKey !== DEFAULT_MEANING_KEY) setMeaningKey(storedMeaningKey);
            } catch {
                // Private browsing and blocked storage should not prevent the quiz from loading.
            }
        }, 0);
        return () => window.clearTimeout(preferenceTimeoutId);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        activeController.current = controller;
        runRound(controller.signal, meaningKey);
        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [meaningKey, runRound]);

    const nextQuestion = () => {
        setIsLoading(true);
        setHasError(false);
        setSelectedIndex(null);

        activeController.current?.abort();
        const controller = new AbortController();
        window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        activeController.current = controller;
        runRound(controller.signal, meaningKey);
    };

    const selectMeaning = (nextMeaningKey: QuizMeaningKey) => {
        if (nextMeaningKey === meaningKey) return;

        setMeaningKey(nextMeaningKey);
        setIsLoading(true);
        setHasError(false);
        setSelectedIndex(null);
        activeController.current?.abort();
        try {
            window.localStorage.setItem(QUIZ_MEANING_STORAGE_KEY, nextMeaningKey);
        } catch {
            // The preference remains active for this session when storage is unavailable.
        }
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
    const questionNumber = answered + 1;
    const isCorrectAnswer = hasAnswered && selectedIndex === round?.correctIndex;
    const activeMeaningOption = getMeaningOption(meaningKey);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_36%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#eef2ff_100%)] px-4 py-6 text-slate-900 sm:px-8 sm:py-10 lg:px-10">
            <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-2xl shadow-blue-950/10 backdrop-blur-sm sm:rounded-5xl">
                <header className="relative overflow-hidden bg-linear-to-br from-blue-950 via-blue-900 to-indigo-950 px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-14">
                    <div className="absolute -right-20 -top-24 size-72 rounded-full bg-blue-400/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-32 left-1/3 size-64 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />
                    <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 text-blue-200">
                                <span className="flex size-11 items-center justify-center rounded-2xl border border-blue-300/30 bg-white/10">
                                    <Trophy className="size-5" aria-hidden="true" />
                                </span>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">A daily dose of wisdom</p>
                            </div>
                            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Kural Quiz</h1>
                            <p className="mt-3 max-w-xl text-base leading-7 text-blue-100/85 sm:text-lg">
                                Read. Reflect. Remember. Turn an ancient couplet into a lesson you can carry into today.
                            </p>
                        </div>
                        <div className="max-w-xs rounded-2xl border border-blue-300/20 bg-white/10 p-4 text-sm leading-6 text-blue-100/85 backdrop-blur-sm">
                            <p className="font-semibold text-white">Learn one Kural at a time.</p>
                            <p className="mt-1">Every answer reveals a little more of the wisdom behind the words.</p>
                        </div>
                    </div>
                </header>

                <div className="px-5 py-7 sm:px-10 sm:py-9 lg:px-14">
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        <ScoreBadge label="Score" value={`${score}/${answered}`} />
                        <ScoreBadge label="Streak" value={streak} />
                        <ScoreBadge label="Played" value={answered} />
                    </div>

                    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                                <Languages className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Meaning preference</p>
                                <p className="mt-0.5 text-xs text-slate-600">Choose how answer choices should be shown.</p>
                            </div>
                        </div>
                        <label className="relative sm:min-w-56">
                            <span className="sr-only">Choose answer meaning language</span>
                            <select
                                value={meaningKey}
                                onChange={(event) => {
                                    if (isQuizMeaningKey(event.target.value)) selectMeaning(event.target.value);
                                }}
                                disabled={isLoading}
                                className="w-full appearance-none rounded-xl border border-blue-200 bg-white py-2.5 pl-3 pr-10 text-sm font-semibold text-blue-950 shadow-sm outline-none transition focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-60"
                            >
                                {QUIZ_MEANING_OPTIONS.map((option) => (
                                    <option key={option.key} value={option.key}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronRight
                                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-blue-500"
                                aria-hidden="true"
                            />
                        </label>
                    </div>

                    <div className="mt-6 sm:mt-8">
                        {isLoading && <LoadingCard />}

                        {!isLoading && hasError && (
                            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm" role="alert">
                                <XCircle className="mx-auto size-7 text-rose-600" aria-hidden="true" />
                                <p className="text-sm text-rose-700">Could not load a question. Please try again.</p>
                                <button
                                    type="button"
                                    onClick={nextQuestion}
                                    className={buttonVariants({ variant: 'default', size: 'lg', className: 'mt-4 rounded-full' })}
                                >
                                    <RefreshCw className="size-4" aria-hidden="true" />
                                    Try again
                                </button>
                            </div>
                        )}

                        {!isLoading && !hasError && round && (
                            <section
                                className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5"
                                aria-labelledby="question-heading"
                            >
                                <div className="relative overflow-hidden border-l-4 border-blue-600 bg-linear-to-br from-blue-50 to-indigo-50 px-5 py-6 sm:px-8 sm:py-8">
                                    <div className="relative flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                                                <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-[10px]">
                                                    {questionNumber}
                                                </span>
                                                <span>Challenge {questionNumber}</span>
                                            </div>
                                            <h2 id="question-heading" className="mt-4 text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">
                                                Which idea lives in this couplet?
                                            </h2>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                Read the original slowly, then trust your first thoughtful answer.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                                            Tamil original · குறள்
                                        </span>
                                    </div>
                                    <blockquote className="relative mt-7 rounded-2xl border border-blue-100 bg-white/75 px-4 py-5 font-serif leading-10 text-blue-950 shadow-inner shadow-blue-100/40 sm:px-6 sm:py-6 sm:leading-[2.7rem]">
                                        <span className="absolute -top-4 left-4 font-serif text-5xl leading-none text-blue-200" aria-hidden="true">
                                            “
                                        </span>
                                        <TamilKural lines={round.target.kural} className="text-[clamp(1.25rem,4.5vw,1.75rem)]" />
                                    </blockquote>
                                </div>

                                <fieldset className="grid gap-3 px-5 py-6 sm:grid-cols-2 sm:px-8 sm:py-8">
                                    <legend className="sr-only">Choose the {activeMeaningOption.label} meaning that matches this couplet</legend>
                                    {round.options.map((option, index) => {
                                        const isCorrectOption = index === round.correctIndex;
                                        const isSelectedOption = index === selectedIndex;
                                        const showCorrect = hasAnswered && isCorrectOption;
                                        const showIncorrectSelection = hasAnswered && isSelectedOption && !isCorrectOption;
                                        let optionBadgeClassName = 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700';
                                        if (showCorrect) optionBadgeClassName = 'bg-emerald-200 text-emerald-800';
                                        else if (showIncorrectSelection) optionBadgeClassName = 'bg-rose-200 text-rose-800';

                                        return (
                                            <button
                                                key={option.kuralNumber}
                                                type="button"
                                                onClick={() => selectOption(index)}
                                                disabled={hasAnswered}
                                                aria-pressed={isSelectedOption}
                                                className={`group relative flex min-h-20 items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left text-sm leading-6 transition disabled:cursor-not-allowed sm:text-[0.95rem] ${getOptionClassName(showCorrect, showIncorrectSelection, hasAnswered)}`}
                                            >
                                                <span
                                                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${optionBadgeClassName}`}
                                                >
                                                    {getOptionBadge(showCorrect, showIncorrectSelection, index)}
                                                </span>
                                                <span className="pt-0.5" lang={option.locale}>
                                                    {option.text}
                                                </span>
                                                {!hasAnswered && (
                                                    <ChevronRight
                                                        className="mt-1 ml-auto size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </fieldset>

                                {hasAnswered && (
                                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-8 sm:py-6">
                                        <div
                                            role="status"
                                            aria-live="polite"
                                            className={`flex items-start gap-3 rounded-2xl border p-4 ${isCorrectAnswer ? 'border-emerald-200 bg-emerald-50/80' : 'border-blue-200 bg-blue-50/80'}`}
                                        >
                                            <span
                                                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrectAnswer ? 'bg-emerald-200 text-emerald-700' : 'bg-blue-200 text-blue-700'}`}
                                            >
                                                {isCorrectAnswer ? (
                                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                                ) : (
                                                    <Sparkles className="size-4" aria-hidden="true" />
                                                )}
                                            </span>
                                            <div className="text-sm leading-6">
                                                <p className={`font-bold ${isCorrectAnswer ? 'text-emerald-900' : 'text-blue-900'}`}>
                                                    {isCorrectAnswer ? 'Beautifully spotted.' : 'Keep exploring.'}
                                                </p>
                                                <p className="text-slate-600">
                                                    Best match · {activeMeaningOption.label}:{' '}
                                                    <span className="font-medium text-slate-800" lang={round.options[round.correctIndex].locale}>
                                                        {round.options[round.correctIndex].text}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm font-semibold text-slate-600">
                                                Kural <span className="text-blue-800">{round.target.number}</span> · {round.target.chapter.names.en} ·{' '}
                                                {round.target.section.names.en}
                                            </p>
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Link
                                                    href={`/kural/${round.target.number}`}
                                                    className={buttonVariants({
                                                        variant: 'outline',
                                                        size: 'sm',
                                                        className: 'rounded-full border-slate-200 bg-white hover:bg-slate-100',
                                                    })}
                                                >
                                                    Read in full
                                                </Link>
                                                <Link
                                                    href={getKuralChatHref(round.target)}
                                                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full hover:bg-slate-100', })}
                                                >
                                                    <Sparkles className="size-3.5" aria-hidden="true" />
                                                    Explain with AI
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={nextQuestion}
                                                    className={buttonVariants({
                                                        variant: 'default',
                                                        size: 'sm',
                                                        className: 'rounded-full bg-blue-900 text-white font-bold! shadow-md shadow-blue-900/15 hover:bg-blue-950',
                                                    })}
                                                >
                                                    <RefreshCw className="size-3.5" aria-hidden="true" />
                                                    Next question
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    <p className="mt-8 text-center text-sm leading-6 text-slate-500">
                        Want to go deeper?{' '}
                        <Link
                            href="/chat"
                            className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-900"
                        >
                            Ask Valluvar AI
                        </Link>{' '}
                        to explore a Kural one turn at a time.
                    </p>
                </div>
            </article>
        </main>
    );
}
