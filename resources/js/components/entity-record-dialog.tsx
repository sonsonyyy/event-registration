import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type EntityField = {
    label: string;
    value: ReactNode;
    fullWidth?: boolean;
    breakWords?: boolean;
};

type EntitySection = {
    title?: string;
    description?: string;
    fields?: EntityField[];
    content?: ReactNode;
    columns?: 1 | 2 | 3;
};

type EntityRecordDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    badges?: ReactNode;
    sections: EntitySection[];
    footer?: ReactNode;
    maxWidthClassName?: string;
};

export default function EntityRecordDialog({
    open,
    onOpenChange,
    title,
    description,
    badges,
    sections,
    footer,
    maxWidthClassName = 'sm:max-w-3xl',
}: EntityRecordDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    '!flex max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] !flex-col gap-0 overflow-hidden rounded-md border border-[#d6e2de] border-t-4 border-t-[#184d47] p-0 shadow-2xl shadow-[#184d47]/12 sm:max-h-[min(92vh,52rem)] sm:w-full dark:border-slate-800 dark:border-t-emerald-500',
                    maxWidthClassName,
                )}
            >
                <DialogHeader className="shrink-0 gap-1.5 border-b border-[#dce4e1] bg-[linear-gradient(145deg,_rgba(247,250,249,0.98),_rgba(255,255,255,0.96))] px-4 py-4 text-left backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-6 sm:py-5 dark:border-slate-800 dark:bg-slate-950/95">
                    <DialogTitle className="pr-12 text-lg font-semibold tracking-[-0.02em] text-slate-950 sm:text-xl dark:text-slate-50">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="max-w-3xl pr-12 text-[13px] leading-6 text-slate-500 sm:text-sm dark:text-slate-400">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="px-4 py-4 sm:px-6 sm:py-6">
                        {badges && (
                            <div className="flex flex-wrap gap-2 rounded-md border border-[#dce4e1] bg-[linear-gradient(145deg,_rgba(24,77,71,0.08),_rgba(255,255,255,0.98))] p-3 dark:border-slate-800 dark:bg-slate-950/80">
                                {badges}
                            </div>
                        )}

                        <div className={cn('space-y-5 sm:space-y-7', badges && 'pt-4 sm:pt-5')}>
                            {sections.map((section, index) => (
                                <section
                                    key={`${section.title ?? 'section'}-${index}`}
                                    className={cn(
                                        'space-y-3 sm:space-y-4',
                                        index > 0 &&
                                            'border-t border-slate-200/80 pt-5 sm:pt-7 dark:border-slate-800',
                                    )}
                                >
                                    {(section.title || section.description) && (
                                        <div className="space-y-1.5">
                                            {section.title && (
                                                <div className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase sm:text-[11px] dark:text-slate-400">
                                                    {section.title}
                                                </div>
                                            )}
                                            {section.description && (
                                                <p className="text-[13px] leading-6 text-slate-500 sm:text-sm dark:text-slate-400">
                                                    {section.description}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {section.fields && section.fields.length > 0 && (
                                        <dl
                                            className={cn(
                                                'grid gap-x-4 gap-y-3 sm:gap-x-8 sm:gap-y-4',
                                                section.columns === 1 &&
                                                    'grid-cols-1',
                                                section.columns === 3 &&
                                                    'grid-cols-1 md:grid-cols-3',
                                                (section.columns === undefined ||
                                                    section.columns === 2) &&
                                                    'grid-cols-1 md:grid-cols-2',
                                            )}
                                        >
                                            {section.fields.map((field) => (
                                                <div
                                                    key={field.label}
                                                    className={cn(
                                                        'space-y-2 rounded-md border border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(24,77,71,0.06),_rgba(255,255,255,0.98))] px-3 py-3 shadow-sm shadow-[#184d47]/6 sm:px-4 dark:border-slate-800 dark:bg-[linear-gradient(145deg,_rgba(16,24,20,0.98),_rgba(19,38,34,0.94))]',
                                                        field.fullWidth &&
                                                            'md:col-span-2',
                                                        field.fullWidth &&
                                                            section.columns ===
                                                                3 &&
                                                            'md:col-span-3',
                                                    )}
                                                >
                                                    <dt className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase sm:text-[11px] dark:text-slate-400">
                                                        {field.label}
                                                    </dt>
                                                    <dd
                                                        className={cn(
                                                            'text-[13px] leading-6 text-slate-900 sm:text-sm dark:text-slate-100',
                                                            field.breakWords &&
                                                                'break-words',
                                                        )}
                                                    >
                                                        {field.value}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    )}

                                    {section.content}
                                </section>
                            ))}
                        </div>
                    </div>
                </div>

                {footer && (
                    <div className="shrink-0 border-t border-[#dce4e1] bg-[linear-gradient(145deg,_rgba(247,250,249,0.98),_rgba(255,255,255,0.96))] px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-950/95">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
