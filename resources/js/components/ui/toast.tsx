import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const toastVariants = cva(
    'pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-md border border-slate-200/90 bg-white/95 px-4 py-3 text-slate-950 shadow-xl shadow-slate-950/10 ring-1 ring-black/5 backdrop-blur transition-all duration-200 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-50',
    {
        variants: {
            variant: {
                success: '',
                error: '',
                info: '',
            },
        },
        defaultVariants: {
            variant: 'info',
        },
    },
);

function ToastViewport({
    className,
    ...props
}: ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3',
                className,
            )}
            {...props}
        />
    );
}

function Toast({
    className,
    variant,
    ...props
}: ComponentProps<'div'> & VariantProps<typeof toastVariants>) {
    return (
        <div
            className={cn(toastVariants({ variant }), className)}
            {...props}
        />
    );
}

function ToastTitle({
    className,
    ...props
}: ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'text-[13px] leading-5 font-normal tracking-normal text-slate-700 dark:text-slate-200',
                className,
            )}
            {...props}
        />
    );
}

function ToastDescription({
    className,
    ...props
}: ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'text-xs leading-5 text-slate-500 dark:text-slate-400',
                className,
            )}
            {...props}
        />
    );
}

export {
    Toast,
    ToastDescription,
    ToastTitle,
    ToastViewport,
};
