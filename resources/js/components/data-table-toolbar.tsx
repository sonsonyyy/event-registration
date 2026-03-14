import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DataTableToolbarProps = {
    searchValue: string;
    onSearchValueChange: (value: string) => void;
    onSubmit: () => void;
    placeholder: string;
    action?: ReactNode;
    className?: string;
    searchWrapperClassName?: string;
    inputClassName?: string;
    actionClassName?: string;
};

export default function DataTableToolbar({
    searchValue,
    onSearchValueChange,
    onSubmit,
    placeholder,
    action,
    className,
    searchWrapperClassName,
    inputClassName,
    actionClassName,
}: DataTableToolbarProps) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
            className={cn(
                'flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between',
                className,
            )}
        >
            <div
                className={cn(
                    'relative flex-1 max-w-3xl',
                    searchWrapperClassName,
                )}
            >
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="directory-search"
                    aria-label={placeholder}
                    value={searchValue}
                    onChange={(event) => onSearchValueChange(event.target.value)}
                    placeholder={placeholder}
                    className={cn(
                        'h-11 rounded-xl bg-background pl-11 shadow-xs',
                        inputClassName,
                    )}
                />
            </div>

            {action && (
                <div
                    className={cn(
                        'flex shrink-0 justify-end',
                        actionClassName,
                    )}
                >
                    {action}
                </div>
            )}
        </form>
    );
}
