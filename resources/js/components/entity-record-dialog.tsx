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
                    'max-h-[90vh] overflow-hidden rounded-md border-slate-200 p-0 shadow-xl dark:border-slate-800',
                    maxWidthClassName,
                )}
            >
                <DialogHeader className="border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-6 py-6">
                    {badges && <div className="flex flex-wrap gap-2">{badges}</div>}

                    <div className={cn('space-y-6', badges && 'mt-5')}>
                        {sections.map((section, index) => (
                            <section
                                key={`${section.title ?? 'section'}-${index}`}
                                className={cn(
                                    'space-y-4',
                                    index > 0 &&
                                        'border-t border-slate-200/80 pt-6 dark:border-slate-800',
                                )}
                            >
                                {(section.title || section.description) && (
                                    <div className="space-y-1">
                                        {section.title && (
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                                {section.title}
                                            </div>
                                        )}
                                        {section.description && (
                                            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                {section.description}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {section.fields && section.fields.length > 0 && (
                                    <dl
                                        className={cn(
                                            'grid gap-4',
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
                                                    'space-y-1.5',
                                                    field.fullWidth &&
                                                        'md:col-span-2',
                                                    field.fullWidth &&
                                                        section.columns === 3 &&
                                                        'md:col-span-3',
                                                )}
                                            >
                                                <dt className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                                    {field.label}
                                                </dt>
                                                <dd
                                                    className={cn(
                                                        'text-sm leading-6 text-slate-900 dark:text-slate-100',
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

                {footer && (
                    <div className="border-t border-slate-200/80 px-6 py-4 dark:border-slate-800">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
