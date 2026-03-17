import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

const emptyOptionValue = '__empty__';

export type FormSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type FormSelectProps = {
    id?: string;
    name?: string;
    value: string;
    onValueChange: (value: string) => void;
    options: FormSelectOption[];
    placeholder: string;
    emptyLabel?: string;
    disabled?: boolean;
    triggerClassName?: string;
    contentClassName?: string;
    itemClassName?: string;
};

export default function FormSelect({
    id,
    name,
    value,
    onValueChange,
    options,
    placeholder,
    emptyLabel,
    disabled = false,
    triggerClassName,
    contentClassName,
    itemClassName,
}: FormSelectProps) {
    const hiddenInputRef = useRef<HTMLInputElement>(null);
    const fieldErrorKey = name ?? id;

    const handleValueChange = (nextValue: string): void => {
        const resolvedValue =
            nextValue === emptyOptionValue ? '' : nextValue;

        onValueChange(resolvedValue);

        if (hiddenInputRef.current) {
            hiddenInputRef.current.value = resolvedValue;
            hiddenInputRef.current.dispatchEvent(
                new Event('input', { bubbles: true }),
            );
            hiddenInputRef.current.dispatchEvent(
                new Event('change', { bubbles: true }),
            );
        }
    };

    return (
        <>
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

            <Select
                name={name}
                value={value === '' && emptyLabel ? emptyOptionValue : value}
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <SelectTrigger
                    id={id}
                    className={cn('w-full bg-background text-left', triggerClassName)}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className={contentClassName}>
                    {emptyLabel && (
                        <SelectItem
                            value={emptyOptionValue}
                            className={itemClassName}
                        >
                            {emptyLabel}
                        </SelectItem>
                    )}
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className={itemClassName}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
}
