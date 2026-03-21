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
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="space-y-2 sm:space-y-3">
                            <div
                                className={`text-[11px] font-semibold tracking-[0.2em] uppercase sm:text-xs sm:tracking-[0.22em] ${reviewWorkspaceStyles.summaryEyebrow}`}
                            >
                                {item.title}
                            </div>
                            <div
                                className={`text-2xl font-semibold tracking-[-0.04em] sm:text-3xl ${reviewWorkspaceStyles.summaryValue}`}
                            >
                                {item.value}
                            </div>
                            <div
                                className={`text-[13px] sm:text-sm ${reviewWorkspaceStyles.summarySubtitle}`}
                            >
                                {item.subtitle}
                            </div>
                        </div>

                        <div
                            className={cn(
                                item.iconPresentation === 'plain'
                                    ? 'flex size-9 items-center justify-center sm:size-11'
                                    : reviewWorkspaceStyles.summaryIconWrapper,
                                item.iconWrapperClassName,
                            )}
                        >
                            <item.icon
                                className={cn('size-4.5 sm:size-5', item.iconClassName)}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
