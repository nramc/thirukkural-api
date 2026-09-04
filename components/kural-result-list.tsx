import Link from 'next/link';
import type { Kural } from '@/app/domain/kurals-db';

type KuralResultListProps = {
    kurals: Kural[];
    total?: number;
    showPosition?: boolean;
};

export default function KuralResultList({ kurals, total = kurals.length, showPosition = false }: Readonly<KuralResultListProps>) {
    return (
        <div className="space-y-5">
            {kurals.map((kural, index) => (
                <Link
                    key={kural.number}
                    href={`/kural/${kural.number}`}
                    className="group relative block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                    <div
                        className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-blue-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Kural {kural.number}</p>
                        {showPosition && (
                            <span className="text-xs font-semibold text-slate-400">
                                {index + 1} of {total}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="border-l-4 border-blue-600 bg-linear-to-br from-blue-50 to-indigo-50 px-5 py-6 sm:px-7">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Tamil original · தமிழ்</p>
                            <blockquote className="mt-3 font-serif text-xl leading-10 text-blue-950 sm:text-2xl sm:leading-[2.7rem]" lang="ta">
                                <p>{kural.kural[0]}</p>
                                <p>{kural.kural[1]}</p>
                            </blockquote>
                        </div>
                        <div className="border-t border-slate-100 px-5 py-6 sm:px-7" lang="en">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Modern interpretation</p>
                            <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">{kural.meaning.en_modern}</p>
                        </div>
                    </div>
                    <p className="border-t border-slate-100 px-5 py-4 text-sm font-semibold text-blue-700 transition-colors group-hover:text-blue-950 sm:px-7">
                        Read Kural {kural.number} in full <span aria-hidden="true">→</span>
                    </p>
                </Link>
            ))}
        </div>
    );
}
