import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConfirmActionDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    confirmVariant?: 'default' | 'destructive';
    processing?: boolean;
    details?: ReactNode;
    icon?: ReactNode;
    onConfirm: () => void;
};

export default function ConfirmActionDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancel',
    confirmVariant = 'default',
    processing = false,
    details,
    icon,
    onConfirm,
}: ConfirmActionDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader className="gap-4">
                    <div
                        className={cn(
                            'flex size-12 items-center justify-center rounded-md border',
                            confirmVariant === 'destructive'
                                ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                                : 'border-[#184d47]/15 bg-[#184d47]/10 text-[#184d47] dark:border-[#184d47]/30 dark:bg-[#184d47]/20 dark:text-[#8ad1c6]',
                        )}
                    >
                        {icon ?? <CircleAlert className="size-5" />}
                    </div>
                    <div className="space-y-2">
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {description}
                        </AlertDialogDescription>
                    </div>
                </AlertDialogHeader>

                {details && (
                    <div className="rounded-md border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                        {details}
                    </div>
                )}

                <AlertDialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        variant={confirmVariant}
                        disabled={processing}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
