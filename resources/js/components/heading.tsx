import { cn } from '@/lib/utils';

export default function Heading({
    title,
    description,
    variant = 'default',
    className,
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
    className?: string;
}) {
    return (
        <header
            className={cn(
                variant === 'small' ? 'space-y-1' : 'mb-5 space-y-1',
                className,
            )}
        >
            <h2
                className={
                    variant === 'small'
                        ? 'text-[0.9375rem] font-semibold tracking-tight sm:text-base'
                        : 'text-lg font-semibold tracking-tight sm:text-xl'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="max-w-3xl text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                    {description}
                </p>
            )}
        </header>
    );
}
