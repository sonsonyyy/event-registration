import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/types';

type DataTablePaginationProps = {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    rowsPerPage?: number;
    rowOptions?: number[];
    onRowsPerPageChange?: (value: number) => void;
    className?: string;
    topRowClassName?: string;
    rowsTriggerClassName?: string;
    summaryClassName?: string;
    navigationWrapperClassName?: string;
    previousButtonClassName?: string;
    nextButtonClassName?: string;
    activePageButtonClassName?: string;
    inactivePageButtonClassName?: string;
    ellipsisClassName?: string;
};

export default function DataTablePagination({
    meta,
    onPageChange,
    rowsPerPage,
    rowOptions,
    onRowsPerPageChange,
    className,
    topRowClassName,
    rowsTriggerClassName,
    summaryClassName,
    navigationWrapperClassName,
    previousButtonClassName,
    nextButtonClassName,
    activePageButtonClassName,
    inactivePageButtonClassName,
    ellipsisClassName,
}: DataTablePaginationProps) {
    const pages = buildPageWindow(meta.current_page, meta.last_page);
    const summary = buildSummary(meta);

    return (
        <div
            className={cn(
                'flex flex-col gap-4 border-t border-sidebar-border/70 pt-4',
                className,
            )}
        >
            <div
                className={cn(
                    'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                    topRowClassName,
                )}
            >
                {rowsPerPage !== undefined &&
                    rowOptions !== undefined &&
                    onRowsPerPageChange !== undefined && (
                        <Select
                            value={String(rowsPerPage)}
                            onValueChange={(value) =>
                                onRowsPerPageChange(Number(value))
                            }
                        >
                            <SelectTrigger
                                id="directory-per-page"
                                aria-label="Rows per page"
                                size="sm"
                                className={cn(
                                    'h-11 w-[7.25rem] shrink-0 rounded-md bg-background',
                                    rowsTriggerClassName,
                                )}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                                {rowOptions.map((option) => (
                                    <SelectItem
                                        key={option}
                                        value={String(option)}
                                    >
                                        {option} rows
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                <p
                    className={cn(
                        'text-sm text-muted-foreground sm:text-right',
                        summaryClassName,
                    )}
                >
                    {summary}
                </p>
            </div>

            {meta.last_page > 1 && (
                <div
                    className={cn(
                        'flex justify-end overflow-x-auto pb-1',
                        navigationWrapperClassName,
                    )}
                >
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn('rounded-md', previousButtonClassName)}
                            onClick={() =>
                                onPageChange(meta.current_page - 1)
                            }
                            disabled={meta.current_page <= 1}
                        >
                            <ChevronLeft className="size-4" />
                            Previous
                        </Button>

                        {pages.map((page, index) =>
                            page === 'ellipsis' ? (
                                <Button
                                    key={`ellipsis-${index}`}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={cn('rounded-md', ellipsisClassName)}
                                    disabled
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            ) : (
                                <Button
                                    key={page}
                                    type="button"
                                    variant={
                                        page === meta.current_page
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    className={cn(
                                        'min-w-9 rounded-md',
                                        page === meta.current_page
                                            ? activePageButtonClassName
                                            : inactivePageButtonClassName,
                                    )}
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </Button>
                            ),
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn('rounded-md', nextButtonClassName)}
                            onClick={() =>
                                onPageChange(meta.current_page + 1)
                            }
                            disabled={meta.current_page >= meta.last_page}
                        >
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function buildSummary(meta: PaginationMeta): string {
    if (meta.total === 0 || meta.from === null || meta.to === null) {
        return 'No records to display.';
    }

    return `Showing ${meta.from}-${meta.to} of ${meta.total} records`;
}

function buildPageWindow(
    currentPage: number,
    lastPage: number,
): Array<number | 'ellipsis'> {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const visiblePages = new Set([
        1,
        lastPage,
        currentPage - 1,
        currentPage,
        currentPage + 1,
    ]);

    if (currentPage <= 3) {
        visiblePages.add(2);
        visiblePages.add(3);
        visiblePages.add(4);
    }

    if (currentPage >= lastPage - 2) {
        visiblePages.add(lastPage - 1);
        visiblePages.add(lastPage - 2);
        visiblePages.add(lastPage - 3);
    }

    const pages = Array.from(visiblePages)
        .filter((page) => page >= 1 && page <= lastPage)
        .sort((left, right) => left - right);

    return pages.reduce<Array<number | 'ellipsis'>>((carry, page) => {
        const previousPage = carry.at(-1);

        if (typeof previousPage === 'number' && page - previousPage > 1) {
            carry.push('ellipsis');
        }

        carry.push(page);

        return carry;
    }, []);
}
