'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import AppMenu from '@/components/app-menu';
import Footer from '@/components/footer';
import AnalyticsConsent from '@/components/analytics-consent';
import PrivacySettingsButton from '@/components/privacy-settings-button';

export default function SiteChrome({ children }: Readonly<{ children: ReactNode }>) {
    const pathname = usePathname();
    const isChatRoute = pathname === '/chat';

    return (
        <>
            <AppMenu />
            {children}
            {!isChatRoute && <Footer />}
            {isChatRoute && (
                <div className="fixed bottom-20 right-3 z-20 rounded-lg border border-blue-100 bg-white/90 px-2.5 py-1.5 text-xs text-slate-600 shadow-sm backdrop-blur sm:right-6">
                    <PrivacySettingsButton />
                </div>
            )}
            <AnalyticsConsent />
        </>
    );
}
