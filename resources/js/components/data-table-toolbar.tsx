import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type DataTableToolbarProps = {
    searchValue: string;
    onSearchValueChange: (value: string) => void;
    onSubmit: () => void;
    placeholder: string;
    action?: ReactNode;
};

export default function DataTableToolbar({
    searchValue,
    onSearchValueChange,
    onSubmit,
    placeholder,
    action,
}: DataTableToolbarProps) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
            className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
        >
            <div className="relative flex-1 max-w-3xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="directory-search"
                    aria-label={placeholder}
                    value={searchValue}
                    onChange={(event) => onSearchValueChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-11 rounded-xl bg-background pl-11 shadow-xs"
                />
            </div>

            {action && (
                <div className="flex shrink-0 justify-end">
                    {action}
                </div>
            )}
        </form>
    );
}
