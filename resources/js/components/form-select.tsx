import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    return (
        <Select
            name={name}
            value={value === '' && emptyLabel ? emptyOptionValue : value}
            onValueChange={(nextValue) =>
                onValueChange(
                    nextValue === emptyOptionValue ? '' : nextValue,
                )
            }
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
    );
}
