import type { Kural } from '@/app/domain/kurals-db';
import { cn } from '@/lib/utils';

type TamilKuralProps = {
    lines: Kural['kural'];
    className?: string;
};

export default function TamilKural({ lines, className }: Readonly<TamilKuralProps>) {
    return (
        <div className={cn('overflow-x-auto overscroll-x-contain', className)} lang="ta">
            <div className="w-max min-w-full">
                <p className="whitespace-nowrap">{lines[0]}</p>
                <p className="whitespace-nowrap">{lines[1]}</p>
            </div>
        </div>
    );
}
