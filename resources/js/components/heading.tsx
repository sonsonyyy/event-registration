import { cn } from '@/lib/utils';

type HeadingProps = {
    title: string;
    description?: string;
    variant: 'small';
    className?: string;
};

export default function Heading({
    title,
    description,
    className,
}: HeadingProps) {
    return (
        <header className={cn('space-y-1', className)}>
            <h2 className="text-[0.9375rem] font-semibold tracking-tight sm:text-base">
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
