'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import AppMenu from '@/components/app-menu';
import Footer from '@/components/footer';

export default function SiteChrome({ children }: Readonly<{ children: ReactNode }>) {
    const pathname = usePathname();
    const isChatRoute = pathname === '/chat';

    return (
        <>
            <AppMenu />
            {children}
            {!isChatRoute && <Footer />}
        </>
    );
}
