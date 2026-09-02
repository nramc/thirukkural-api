'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Kural } from '@/app/domain/kurals-db';
import { ArrowDown, ArrowRight, BookOpen, Crown } from 'lucide-react';

export default function Home() {
    const [kural, setKural] = useState<Kural | null>(null);
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

    const dailyKuralContent = () => {
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

        return (
            <div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                    <Link href={`/kural/${kural.number}`} className="hover:text-white">
                        குறள் · Couplet {kural.number}
                    </Link>
                    <span className="rounded-full bg-white/10 px-3 py-1 normal-case tracking-normal text-blue-100">{kural.chapter}</span>
                </div>
                <blockquote className="mt-7 border-l-2 border-amber-300 pl-5 font-serif text-xl font-medium leading-9 text-white sm:text-2xl sm:leading-10">
                    {kural.kural[0]}
                    <br />
                    {kural.kural[1]}
                </blockquote>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <p className="rounded-2xl bg-white/10 p-4 text-sm leading-6 text-blue-50">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-amber-200">தமிழ் விளக்கம்</span>
                        {kural.meaning['ta_mu_va']}
                    </p>
                    <p className="rounded-2xl bg-white/10 p-4 text-sm leading-6 text-blue-50">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-amber-200">English meaning</span>
                        {kural.meaning['en']}
                    </p>
                </div>
            </div>
        );
    };

    const scrollToSection = (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <main className="min-h-screen overflow-hidden bg-linear-to-br from-blue-50 via-white to-indigo-50 text-slate-900 selection:bg-amber-200">
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-40 -top-40 size-96 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 size-112 rounded-full bg-amber-200/30 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-8 lg:px-10">
                <section className="grid items-center gap-12 pb-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-20 lg:pt-20">
                    <div className="order-1 max-w-2xl lg:order-2">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm backdrop-blur">
                            <Crown className="size-3.5 text-amber-500" />
                            Ancient wisdom · modern access
                        </div>
                        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-blue-950 sm:text-6xl lg:text-7xl">
                            Timeless wisdom for <span className="text-blue-600">everyday life.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                            Made with love for Thirukkural and Tamil, this is a simple modern doorway to 1,330 couplets on virtue, purpose, and
                            compassion—without losing the wisdom that came before us.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => scrollToSection('todays-kural')}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                            >
                                Read today’s Kural
                                <ArrowDown className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection('about')}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white/70 px-5 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-white"
                            >
                                Our vision
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </div>

                    <div className="order-2 relative mx-auto w-full max-w-md lg:order-1 lg:max-w-lg">
                        <div className="absolute inset-8 rounded-full bg-blue-200/60 blur-3xl" aria-hidden="true" />
                        <div className="relative flex aspect-square items-center justify-center rounded-[2.5rem] border border-white/80 bg-white/55 p-8 shadow-2xl shadow-blue-900/10 backdrop-blur-sm sm:p-12">
                            <Image
                                src="/logo/thirukkural-logo-transparant.png"
                                alt="Thirukkural palm leaf and Tamil script"
                                width={1024}
                                height={1024}
                                priority
                                className="h-auto w-full drop-shadow-xl"
                            />
                            <div className="absolute -bottom-4 -left-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg shadow-amber-900/10 sm:-left-8">
                                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Our motto</p>
                                <p className="mt-1 text-sm font-medium text-amber-950">A small contribution to Tamil. A timeless gift to everyone.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="todays-kural"
                    className="order-1 scroll-mt-24 rounded-4xl border border-blue-200/80 bg-white/80 p-5 shadow-2xl shadow-blue-900/10 backdrop-blur sm:p-8 lg:p-12"
                >
                    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-14">
                        <div>
                            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                <BookOpen className="size-6" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">A thought to carry with you</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 sm:text-4xl">Today’s Kural</h2>
                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                Pause for a moment. Read slowly. Find one small way to bring this ancient insight into your day.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-linear-to-br from-blue-700 to-indigo-900 p-6 text-white shadow-xl shadow-blue-900/20 sm:p-9">
                            {dailyKuralContent()}
                        </div>
                    </div>
                </section>

                <section id="about" className="order-3 py-16 sm:py-20">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Our vision</p>
                        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-blue-950 sm:text-4xl">
                            Connecting Thirukkural’s timeless wisdom with modern life—for everyone, everywhere.
                        </h2>
                        <div className="mt-6 flex max-w-2xl items-start gap-3 text-sm leading-6 text-slate-600 sm:text-base">
                            <p>
                                To make the timeless wisdom of Thirukkural freely accessible to everyone through modern technology—helping people learn,
                                preserving Tamil culture, and inspiring generations to come.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
