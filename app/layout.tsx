import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './assets/css/card-layout.css';
import React from 'react';
import AppMenu from '@/components/app-menu';

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kural.codewithram.dev'),
    title: {
        default: 'Thirukkural | Free Tamil Wisdom for Everyone',
        template: '%s | Thirukkural',
    },
    description: 'Explore 1,330 Thirukkural couplets and meanings freely. Made with love for Tamil, connecting ancient wisdom with today’s digital life.',
    keywords: ['Thirukkural', 'Tamil wisdom', 'Tamil literature', 'Valluvar', 'Tamil couplets', 'Thirukkural API'],
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Thirukkural | Free Tamil Wisdom for Everyone',
        description: 'Explore 1,330 Thirukkural couplets and meanings freely. Made with love for Tamil, connecting ancient wisdom with today’s digital life.',
        url: '/',
        siteName: 'Thirukkural',
        type: 'website',
        locale: 'en_US',
        images: [
            {
                url: '/images/thirukkural-api-banner.png',
                width: 1920,
                height: 1080,
                alt: 'Thirukkural API — ancient Tamil wisdom for today',
            },
        ],
    },
    robots: {
        index: true,
        follow: true,
    },
    manifest: '/site.webmanifest',
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
            { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
            { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
        ],
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ta">
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <AppMenu />
                {children}
            </body>
        </html>
    );
}
