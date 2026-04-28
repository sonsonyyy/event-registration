import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
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
                'flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between',
                className,
            )}
        >
            <div
                className={cn(
                    'relative max-w-3xl min-w-0 flex-1',
                    searchWrapperClassName,
                )}
            >
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="directory-search"
                    aria-label={placeholder}
                    value={searchValue}
                    onChange={(event) =>
                        onSearchValueChange(event.target.value)
                    }
                    placeholder={placeholder}
                    className={cn('pl-10 sm:pl-11', inputClassName)}
                />
            </div>

            {action && (
                <div
                    className={cn(
                        'flex w-full shrink-0 justify-end xl:w-auto [&>*]:w-full sm:[&>*]:w-auto',
                        actionClassName,
                    )}
                >
                    {action}
                </div>
            )}
        </form>
    );
}
