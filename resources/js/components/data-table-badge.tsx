import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DataTableBadgeTone =
    | 'slate'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'blue'
    | 'violet';

const dataTableBadgeToneClasses: Record<DataTableBadgeTone, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
    emerald:
        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300',
    blue: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-500/10 dark:text-blue-300',
    violet:
        'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-500/10 dark:text-violet-300',
};

type DataTableBadgeProps = {
    tone: DataTableBadgeTone;
    children: ReactNode;
    className?: string;
    capitalize?: boolean;
};

export function DataTableBadge({
    tone,
    children,
    className,
    capitalize = true,
}: DataTableBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'w-fit rounded-md px-2.5 py-1',
                capitalize && 'capitalize',
                dataTableBadgeToneClasses[tone],
                className,
            )}
        >
            {children}
        </Badge>
    );
}

export function resolveDataTableTone(
    value: string | null | undefined,
    toneMap: Partial<Record<string, DataTableBadgeTone>>,
    fallback: DataTableBadgeTone = 'slate',
): DataTableBadgeTone {
    if (!value) {
        return fallback;
    }

    return toneMap[value] ?? fallback;
}
