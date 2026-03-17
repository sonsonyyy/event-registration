import { Check, ChevronDown, Search } from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formControlClassName } from '@/lib/ui-styles';

const emptyOptionValue = '__empty__';

export type SearchableFormSelectOption = {
    value: string;
    label: string;
    keywords?: string[];
    disabled?: boolean;
};

type SearchableFormSelectProps = {
    id?: string;
    name?: string;
    value: string;
    onValueChange: (value: string) => void;
    options: SearchableFormSelectOption[];
    placeholder: string;
    emptyLabel?: string;
    disabled?: boolean;
    triggerClassName?: string;
    panelClassName?: string;
    optionClassName?: string;
    searchPlaceholder?: string;
    emptySearchMessage?: string;
};

export default function SearchableFormSelect({
    id,
    name,
    value,
    onValueChange,
    options,
    placeholder,
    emptyLabel,
    disabled = false,
    triggerClassName,
    panelClassName,
    optionClassName,
    searchPlaceholder = 'Search options',
    emptySearchMessage = 'No matching options found.',
}: SearchableFormSelectProps) {
    const hiddenInputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const fieldErrorKey = name ?? id;
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const normalizedSearch = search.trim().toLowerCase();
    const selectedOption = options.find((option) => option.value === value) ?? null;

    const resolvedOptions = useMemo(() => {
        const searchableOptions = emptyLabel
            ? [
                  {
                      value: emptyOptionValue,
                      label: emptyLabel,
                  },
                  ...options,
              ]
            : options;

        if (normalizedSearch === '') {
            return searchableOptions;
        }

        return searchableOptions.filter((option) => {
            const haystacks = [
                option.label,
                ...(option.keywords ?? []),
            ].map((item) => item.toLowerCase());

            return haystacks.some((item) => item.includes(normalizedSearch));
        });
    }, [emptyLabel, normalizedSearch, options]);

    useEffect(() => {
        if (! isOpen) {
            setSearch('');

            return;
        }

        searchInputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        if (! isOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent): void => {
            if (! wrapperRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
        };
    }, [isOpen]);

    const dispatchHiddenInputEvents = (nextValue: string): void => {
        if (! hiddenInputRef.current) {
            return;
        }

        hiddenInputRef.current.value = nextValue;
        hiddenInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        hiddenInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const handleValueChange = (nextValue: string): void => {
        const resolvedValue = nextValue === emptyOptionValue ? '' : nextValue;

        onValueChange(resolvedValue);
        dispatchHiddenInputEvents(resolvedValue);
        setIsOpen(false);
    };

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(true);
        }

        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            {fieldErrorKey && (
                <input
                    ref={hiddenInputRef}
                    type="hidden"
                    name={name}
                    value={value}
                    data-error-field={fieldErrorKey}
                    readOnly
                />
            )}

            <button
                type="button"
                id={id}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={() => setIsOpen((current) => ! current)}
                onKeyDown={handleTriggerKeyDown}
                className={cn(
                    formControlClassName,
                    'relative flex w-full items-center justify-between bg-background text-left font-normal',
                    value === '' ? 'text-muted-foreground' : 'text-foreground',
                    triggerClassName,
                )}
            >
                <span className="block truncate pr-8">
                    {selectedOption?.label ?? placeholder}
                </span>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            </button>

            {isOpen && (
                <div
                    className={cn(
                        'absolute z-50 mt-2 w-full rounded-md border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950',
                        panelClassName,
                    )}
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            data-error-field={fieldErrorKey}
                            placeholder={searchPlaceholder}
                            className="h-10 rounded-md border-slate-200 bg-white pl-10 text-sm shadow-none dark:border-slate-800 dark:bg-slate-950"
                        />
                    </div>

                    <div className="mt-2 max-h-64 overflow-y-auto">
                        {resolvedOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                {emptySearchMessage}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {resolvedOptions.map((option) => {
                                    const isSelected = option.value === value
                                        || (option.value === emptyOptionValue && value === '');

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            disabled={option.disabled}
                                            onClick={() => handleValueChange(option.value)}
                                            className={cn(
                                                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 dark:hover:bg-slate-800',
                                                optionClassName,
                                            )}
                                        >
                                            <span className="truncate pr-3">
                                                {option.label}
                                            </span>
                                            <Check
                                                className={cn(
                                                    'size-4 shrink-0 text-[#184d47]',
                                                    isSelected ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
