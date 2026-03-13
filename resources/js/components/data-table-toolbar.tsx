import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type DataTableToolbarProps = {
    searchValue: string;
    onSearchValueChange: (value: string) => void;
    onSubmit: () => void;
    perPage: number;
    perPageOptions: number[];
    onPerPageChange: (value: number) => void;
    placeholder: string;
    resultLabel: string;
};

export default function DataTableToolbar({
    searchValue,
    onSearchValueChange,
    onSubmit,
    perPage,
    perPageOptions,
    onPerPageChange,
    placeholder,
    resultLabel,
}: DataTableToolbarProps) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
            className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
        >
            <div className="flex-1">
                <Input
                    id="directory-search"
                    aria-label={placeholder}
                    value={searchValue}
                    onChange={(event) => onSearchValueChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-11 max-w-2xl rounded-xl bg-background shadow-xs"
                />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="text-sm text-muted-foreground">
                    {resultLabel}
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-sidebar-border/70 bg-background px-3 py-2 shadow-xs">
                    <Label
                        htmlFor="directory-per-page"
                        className="text-sm text-muted-foreground"
                    >
                        Rows
                    </Label>
                    <Select
                        value={String(perPage)}
                        onValueChange={(value) =>
                            onPerPageChange(Number(value))
                        }
                    >
                        <SelectTrigger
                            id="directory-per-page"
                            aria-label="Rows per page"
                            className="h-8 min-w-24 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        >
                            <SelectValue placeholder="Rows per page" />
                        </SelectTrigger>
                        <SelectContent>
                            {perPageOptions.map((option) => (
                                <SelectItem
                                    key={option}
                                    value={String(option)}
                                >
                                    {option} rows
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </form>
    );
}
