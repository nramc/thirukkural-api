import Image from 'next/image';
import Link from 'next/link';

const externalLinkProps = {
    target: '_blank',
    rel: 'noreferrer',
} as const;

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className="border-t border-blue-100 bg-white/80 px-4 py-10 text-slate-600 backdrop-blur sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-sm">
                    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Thirukkural API home">
                        <span
                            className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-blue-50 ring-1 ring-blue-100 transition-transform duration-200 group-hover:scale-105">
                            <Image src="/favicon-96x96.png" alt="" width={40} height={40}
                                   className="size-9 object-contain"/>
                        </span>
                        <span>
                            <span
                                className="block text-sm font-bold tracking-tight text-blue-800">Thirukkural API</span>
                            <span
                                className="block text-xs font-medium text-slate-500">Ancient wisdom. Modern access.</span>
                        </span>
                    </Link>
                </div>

                <nav aria-label="Footer navigation"
                     className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium">
                    <a href="https://www.linkedin.com/in/ramachandran-nellaiyappan/" {...externalLinkProps}
                       className="transition-colors hover:text-blue-800 hover:font-bold">
                        LinkedIn
                    </a>
                    <a href="https://myprofile.codewithram.dev/" {...externalLinkProps}
                       className="transition-colors hover:text-blue-800 hover:font-bold">
                        Contact
                    </a>
                    <a
                        href="https://github.com/nramc/thirukkural-api/blob/main/LICENSE"
                        {...externalLinkProps}
                        className="transition-colors hover:text-blue-800 hover:font-bold"
                    >
                        MIT License
                    </a>
                </nav>
            </div>

            <div
                className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-2 border-t border-blue-100 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-center">
                <a href={'https://myprofile.codewithram.dev/'} {...externalLinkProps}
                   className="transition-colors hover:text-blue-800 hover:font-bold">© {currentYear} Ramachandran Nellaiyappan</a>
            </div>
        </footer>
    );
}
