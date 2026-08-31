import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './assets/css/card-layout.css';
import React from 'react';
import AppMenu from "@/components/app-menu";

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
    title: 'Thirukkural API',
    description: 'Connecting ancient Tamil philosophy with today’s digital landscape.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ta">
        <head>
            <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96"/>
            <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
            <link rel="shortcut icon" href="/favicon.ico"/>
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
            <meta name="apple-mobile-web-app-title" content="Thirukkural"/>
            <link rel="manifest" href="/site.webmanifest"/>
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>

            <title>Thirukkural</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppMenu/>
        {children}
        </body>
        </html>
    );
}
