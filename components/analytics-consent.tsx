'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import GoogleAnalyticsScript from '@/components/google-analytics';
import { Button } from '@/components/ui/button';

const consentStorageKey = 'thirukkural.analytics-consent.v1';
const settingsEventName = 'thirukkural:open-analytics-settings';

type ConsentChoice = 'accepted' | 'rejected';

function setAnalyticsOptOut(measurementId: string, optedOut: boolean) {
    (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = optedOut;
}

function clearAnalyticsCookies() {
    document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0]?.trim();

        if (name === '_ga' || name?.startsWith('_ga_')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
    });
}

export default function AnalyticsConsent() {
    const pathname = usePathname();
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const [choice, setChoice] = useState<ConsentChoice | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (!measurementId) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            try {
                const savedChoice = window.localStorage.getItem(consentStorageKey);
                if (savedChoice === 'accepted' || savedChoice === 'rejected') {
                    setChoice(savedChoice);
                }
            } catch {
                // Keep analytics disabled when browser storage is unavailable.
            }
            setIsReady(true);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [measurementId]);

    useEffect(() => {
        const openSettings = () => setIsSettingsOpen(true);
        window.addEventListener(settingsEventName, openSettings);

        return () => window.removeEventListener(settingsEventName, openSettings);
    }, []);

    if (!measurementId || !isReady) {
        return null;
    }

    const saveChoice = (nextChoice: ConsentChoice) => {
        try {
            window.localStorage.setItem(consentStorageKey, nextChoice);
        } catch {
            // The current choice still applies for this page load.
        }
        setAnalyticsOptOut(measurementId, nextChoice === 'rejected');
        if (nextChoice === 'rejected') {
            clearAnalyticsCookies();
        }
        setChoice(nextChoice);
        setIsSettingsOpen(false);
    };

    const shouldShowBanner = choice === null || isSettingsOpen;
    if (!shouldShowBanner) {
        return <>{choice === 'accepted' && <GoogleAnalyticsScript />}</>;
    }

    const isChatRoute = pathname === '/chat';

    return (
        <>
            {choice === 'accepted' && <GoogleAnalyticsScript />}
            <section
                aria-labelledby="analytics-consent-title"
                aria-describedby="analytics-consent-description"
                className={`fixed inset-x-3 z-50 overflow-hidden rounded-2xl border border-blue-100 bg-white/95 text-slate-700 shadow-2xl shadow-blue-900/15 backdrop-blur sm:inset-x-6 lg:inset-x-8 ${
                    isChatRoute ? 'bottom-28 sm:bottom-24' : 'bottom-4'
                }`}
            >
                <div className="h-1 bg-linear-to-r from-blue-700 via-cyan-500 to-blue-200" />
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                    <div className="max-w-3xl">
                        <h2 id="analytics-consent-title" className="text-base font-bold tracking-tight text-blue-950 sm:text-lg">
                            Help us improve Thirukkural
                        </h2>
                        <p id="analytics-consent-description" className="mt-1.5 text-sm leading-6 text-slate-600">
                            We use optional Google Analytics to understand general website usage. It does not receive chat messages or Kural content.{' '}
                            <a href="/privacy" className="font-semibold text-blue-800 underline underline-offset-4 hover:text-blue-600">
                                Read the privacy notice
                            </a>
                            {'.'}
                        </p>
                    </div>
                    <div className="flex items-end shrink-0 flex-col-reverse gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:bg-transparent hover:text-slate-800"
                            onClick={() => saveChoice('rejected')}
                        >
                            Continue without analytics
                        </Button>
                        <Button
                            type="button"
                            className="min-h-11 w-full border-blue-700 bg-blue-700 px-5 text-white font-bold shadow-sm shadow-blue-900/20 hover:border-blue-800 hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
                            autoFocus
                            onClick={() => saveChoice('accepted')}
                        >
                            Accept analytics
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
