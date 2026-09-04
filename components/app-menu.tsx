'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, CircleUserRound, Code2, GitFork, HomeIcon, type LucideIcon, Menu, Search, Sparkles, X } from 'lucide-react';

type NavigationItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    external?: boolean;
};

const navigationItems: NavigationItem[] = [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Browse', href: '/browse', icon: Search },
    { label: 'Chapters', href: '/chapters/1', icon: BookOpen },
    { label: 'Doc', href: '/openapi/swagger-ui.html#Kural', icon: Code2, external: true },
    { label: 'GitHub', href: 'https://github.com/nramc/thirukkural-api', icon: GitFork, external: true },
    { label: 'Contact', href: 'https://myprofile.codewithram.dev/', icon: CircleUserRound, external: true },
];

const externalLinkProps = {
    target: '_blank',
    rel: 'noreferrer',
} as const;

export default function AppMenu() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const closeMenu = () => setIsMenuOpen(false);
    const isActive = (href: string, external?: boolean) => !external && (href === '/' ? pathname === '/' : pathname.startsWith(href));

    return (
        <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-blue-100/80 bg-white/90 px-4 py-3 shadow-lg shadow-blue-950/5 backdrop-blur-xl sm:px-6">
                <Link href="/" onClick={closeMenu} className="group flex shrink-0 items-center gap-3" aria-label="Thirukkural API home">
                    <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-blue-50 ring-1 ring-blue-100 transition-transform duration-200 group-hover:scale-105 sm:size-11">
                        <Image
                            src="/favicon-96x96.png"
                            alt="Thirukkural API Logo"
                            width={44}
                            height={44}
                            className="size-9 object-contain sm:size-10"
                            priority
                        />
                    </span>
                    <span className="sm:block">
                        <span className="block text-base font-bold tracking-tight text-blue-800">Thirukkural API</span>
                        <span className="block text-xs font-medium text-slate-500">Ancient wisdom. Modern access.</span>
                    </span>
                </Link>

                <nav
                    id="mobile-navigation"
                    className={`absolute inset-x-4 top-[calc(100%+0.5rem)] flex-col gap-1 rounded-2xl border border-blue-100 bg-white p-2 shadow-xl shadow-blue-950/10 ${
                        isMenuOpen ? 'flex' : 'hidden'
                    } lg:static lg:flex lg:flex-row lg:items-center lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
                    aria-label="Primary navigation"
                >
                    {navigationItems.map(({ label, href, icon: Icon, external }) => {
                        const active = isActive(href, external);

                        return (
                            <Link
                                key={label}
                                href={href}
                                {...(external ? externalLinkProps : {})}
                                onClick={closeMenu}
                                aria-current={active ? 'page' : undefined}
                                className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 lg:inline-flex lg:gap-2 lg:rounded-lg lg:px-3.5 lg:py-2.5 lg:text-[15px] ${
                                    active
                                        ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100'
                                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800 lg:text-slate-600'
                                }`}
                            >
                                <Icon
                                    className={`size-4 transition-colors ${active ? 'text-blue-800' : 'text-blue-700 group-hover:text-blue-800 lg:text-slate-400'}`}
                                    aria-hidden="true"
                                />
                                {label}
                            </Link>
                        );
                    })}
                    <Link
                        href="/chat"
                        onClick={closeMenu}
                        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3.5 text-base font-semibold text-white! transition-colors hover:bg-blue-900 lg:hidden"
                    >
                        <Sparkles className="size-4" aria-hidden="true" />
                        Ask Valluvar AI
                    </Link>
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href="/browse"
                        onClick={closeMenu}
                        className="flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                        aria-label="Search Kurals"
                        title="Search Kurals"
                    >
                        <Search className="size-5" aria-hidden="true" />
                    </Link>
                    <Link
                        href="/chat"
                        className="hidden items-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-[15px] font-semibold text-white! shadow-md shadow-blue-800/20 transition-all hover:-translate-y-0.5 hover:bg-blue-900 hover:shadow-lg hover:shadow-blue-800/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:inline-flex"
                    >
                        <Sparkles className="size-4" aria-hidden="true" />
                        Ask Valluvar AI
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen((open) => !open)}
                        className="flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 lg:hidden"
                        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-navigation"
                    >
                        {isMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
                    </button>
                </div>
            </div>
        </header>
    );
}
