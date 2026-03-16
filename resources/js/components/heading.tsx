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
                variant === 'small' ? 'space-y-1' : 'mb-6 space-y-1',
                className,
            )}
        >
            <h2
                className={
                    variant === 'small'
                        ? 'text-lg font-semibold tracking-tight'
                        : 'text-2xl font-semibold tracking-tight'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}
