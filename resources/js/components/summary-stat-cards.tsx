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
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                            <div
                                className={`text-xs font-semibold tracking-[0.22em] uppercase ${reviewWorkspaceStyles.summaryEyebrow}`}
                            >
                                {item.title}
                            </div>
                            <div
                                className={`text-3xl font-semibold tracking-[-0.04em] ${reviewWorkspaceStyles.summaryValue}`}
                            >
                                {item.value}
                            </div>
                            <div
                                className={`text-sm ${reviewWorkspaceStyles.summarySubtitle}`}
                            >
                                {item.subtitle}
                            </div>
                        </div>

                        <div
                            className={cn(
                                item.iconPresentation === 'plain'
                                    ? 'flex size-11 items-center justify-center'
                                    : reviewWorkspaceStyles.summaryIconWrapper,
                                item.iconWrapperClassName,
                            )}
                        >
                            <item.icon
                                className={cn('size-5', item.iconClassName)}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
