import { AlertCircle, CheckCircle2, InfoIcon, X } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { appToastDurationMs } from '@/lib/toast';
import { cn } from '@/lib/utils';

const defaultClassNames = {
    toast: 'group pointer-events-auto rounded-md border border-slate-200/90 bg-white/95 px-4 py-3 text-slate-950 shadow-xl shadow-slate-950/10 ring-1 ring-black/5 backdrop-blur transition-all duration-200',
    content: 'flex min-w-0 items-center gap-3',
    title: 'text-[13px] leading-5 font-normal tracking-normal text-slate-700',
    description: 'text-xs leading-5 text-slate-500',
    icon: 'shrink-0 self-center',
    closeButton: 'hidden',
    success: 'border-slate-200/90',
    error: 'border-slate-200/90',
    info: 'border-slate-200/90',
    warning: 'border-slate-200/90',
    loading: 'border-slate-200/90',
    default: 'border-slate-200/90',
} satisfies NonNullable<ToasterProps['toastOptions']>['classNames'];

export function Toaster({ className, toastOptions, ...props }: ToasterProps) {
    return (
        <Sonner
            closeButton={false}
            duration={appToastDurationMs}
            expand={false}
            icons={{
                success: (
                    <CheckCircle2 className="size-4 stroke-[1.85] text-emerald-600" />
                ),
                error: (
                    <AlertCircle className="size-4 stroke-[1.85] text-rose-600" />
                ),
                info: <InfoIcon className="size-4 stroke-[1.85] text-slate-500" />,
                warning: (
                    <AlertCircle className="size-4 stroke-[1.85] text-amber-600" />
                ),
                loading: <InfoIcon className="size-4 stroke-[1.85] text-slate-500" />,
                close: <X className="hidden" />,
            }}
            offset={16}
            position="bottom-right"
            theme="light"
            toastOptions={{
                ...toastOptions,
                closeButton: false,
                duration: appToastDurationMs,
                classNames: {
                    ...defaultClassNames,
                    ...toastOptions?.classNames,
                    toast: cn(
                        defaultClassNames.toast,
                        toastOptions?.classNames?.toast,
                    ),
                    content: cn(
                        defaultClassNames.content,
                        toastOptions?.classNames?.content,
                    ),
                    title: cn(
                        defaultClassNames.title,
                        toastOptions?.classNames?.title,
                    ),
                    description: cn(
                        defaultClassNames.description,
                        toastOptions?.classNames?.description,
                    ),
                    icon: cn(
                        defaultClassNames.icon,
                        toastOptions?.classNames?.icon,
                    ),
                    closeButton: cn(
                        defaultClassNames.closeButton,
                        toastOptions?.classNames?.closeButton,
                    ),
                },
            }}
            visibleToasts={6}
            className={cn('toaster group', className)}
            {...props}
        />
    );
}
