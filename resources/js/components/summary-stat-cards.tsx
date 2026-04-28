import type { LucideIcon } from 'lucide-react';
import { reviewWorkspaceStyles } from '@/components/data-table-presets';
import { cn } from '@/lib/utils';

type SummaryStatCard = {
    title: string;
    value: number;
    subtitle: string;
    icon: LucideIcon;
    cardClassName: string;
    iconWrapperClassName?: string;
    iconClassName?: string;
    iconPresentation?: 'plain' | 'surface';
};

type Props = {
    items: ReadonlyArray<SummaryStatCard>;
    gridClassName: string;
};

export default function SummaryStatCards({ items, gridClassName }: Props) {
    return (
        <div className={gridClassName}>
            {items.map((item) => (
                <div
                    key={item.title}
                    className={`${reviewWorkspaceStyles.summaryCard} ${item.cardClassName}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 sm:space-y-2">
                            <div
                                className={`text-[10px] font-semibold tracking-[0.18em] uppercase sm:text-[11px] sm:tracking-[0.2em] ${reviewWorkspaceStyles.summaryEyebrow}`}
                            >
                                {item.title}
                            </div>
                            <div
                                className={`text-xl font-semibold tracking-[-0.04em] sm:text-2xl ${reviewWorkspaceStyles.summaryValue}`}
                            >
                                {item.value}
                            </div>
                            <div
                                className={`text-[12px] sm:text-[13px] ${reviewWorkspaceStyles.summarySubtitle}`}
                            >
                                {item.subtitle}
                            </div>
                        </div>

                        <div
                            className={cn(
                                item.iconPresentation === 'plain'
                                    ? 'flex size-8 items-center justify-center sm:size-9'
                                    : reviewWorkspaceStyles.summaryIconWrapper,
                                item.iconWrapperClassName,
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'size-4 sm:size-4.5',
                                    item.iconClassName,
                                )}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
