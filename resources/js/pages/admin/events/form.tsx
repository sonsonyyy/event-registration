import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    formTextareaClassName,
    mutedNoticeClassName,
} from '@/lib/ui-styles';

type PersistedFeeCategory = {
    id?: number;
    category_name: string;
    amount: string;
    slot_limit: number | null;
    status: string;
    reserved_quantity: number;
    remaining_slots: number | null;
};

type FeeCategoryFormValue = {
    id?: number;
    category_name: string;
    amount: string;
    slot_limit: string;
    status: string;
    reserved_quantity: number;
    remaining_slots: number | null;
};

type EventRecord = {
    id: number;
    name: string;
    description: string | null;
    venue: string;
    date_from: string;
    date_to: string;
    registration_open_at: string;
    registration_close_at: string;
    status: string;
    total_capacity: number;
    reserved_quantity: number;
    remaining_slots: number;
    status_reason: string | null;
    accepting_registrations: boolean;
    fee_categories: PersistedFeeCategory[];
};

type SelectOption = {
    value: string;
    label: string;
};

type Props = {
    event?: EventRecord;
    statusOptions: SelectOption[];
    feeCategoryStatusOptions: SelectOption[];
};

type EventFormData = {
    name: string;
    description: string;
    venue: string;
    date_from: string;
    date_to: string;
    registration_open_at: string;
    registration_close_at: string;
    status: string;
    total_capacity: string;
    fee_categories: FeeCategoryFormValue[];
};

function emptyFeeCategory(): FeeCategoryFormValue {
    return {
        category_name: '',
        amount: '',
        slot_limit: '',
        status: 'active',
        reserved_quantity: 0,
        remaining_slots: null,
    };
}

export default function EventForm({
    event,
    statusOptions,
    feeCategoryStatusOptions,
}: Props) {
    const isEditing = event !== undefined;
    const form = useForm<EventFormData>({
        name: event?.name ?? '',
        description: event?.description ?? '',
        venue: event?.venue ?? '',
        date_from: event?.date_from ?? '',
        date_to: event?.date_to ?? '',
        registration_open_at: event?.registration_open_at ?? '',
        registration_close_at: event?.registration_close_at ?? '',
        status: event?.status ?? 'draft',
        total_capacity: event ? event.total_capacity.toString() : '',
        fee_categories:
            event?.fee_categories.map((feeCategory) => ({
                ...feeCategory,
                slot_limit: feeCategory.slot_limit?.toString() ?? '',
            })) ?? [emptyFeeCategory()],
    });
    const reservedQuantity = event?.reserved_quantity ?? 0;
    const totalCapacity = Number.parseInt(form.data.total_capacity || '0', 10);
    const remainingSlots = Math.max(totalCapacity - reservedQuantity, 0);

    const updateFeeCategory = (
        index: number,
        field: 'category_name' | 'amount' | 'slot_limit' | 'status',
        value: string,
    ): void => {
        form.setData(
            'fee_categories',
            form.data.fee_categories.map((feeCategory, feeCategoryIndex) =>
                feeCategoryIndex === index
                    ? {
                          ...feeCategory,
                          [field]: value,
                      }
                    : feeCategory,
            ),
        );
    };

    const addFeeCategory = (): void => {
        form.setData('fee_categories', [
            ...form.data.fee_categories,
            emptyFeeCategory(),
        ]);
    };

    const removeFeeCategory = (index: number): void => {
        form.setData(
            'fee_categories',
            form.data.fee_categories.filter(
                (_, feeCategoryIndex) => feeCategoryIndex !== index,
            ),
        );
    };

    const submit = (submissionEvent: FormEvent<HTMLFormElement>): void => {
        submissionEvent.preventDefault();

        form.submit(
            isEditing
                ? EventController.update(event.id)
                : EventController.store(),
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <form className="space-y-8" onSubmit={submit}>
            <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Event name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={form.data.name}
                            onChange={(inputEvent) =>
                                form.setData('name', inputEvent.target.value)
                            }
                            autoFocus
                            placeholder="District Youth Camp"
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="venue">Venue</Label>
                        <Input
                            id="venue"
                            name="venue"
                            value={form.data.venue}
                            onChange={(inputEvent) =>
                                form.setData('venue', inputEvent.target.value)
                            }
                            placeholder="Main Convention Hall"
                        />
                        <InputError message={form.errors.venue} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        name="description"
                        value={form.data.description}
                        onChange={(inputEvent) =>
                            form.setData(
                                'description',
                                inputEvent.target.value,
                            )
                        }
                        placeholder="Describe the event purpose, audience, and important logistics."
                        className={formTextareaClassName}
                    />
                    <InputError message={form.errors.description} />
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date_from">Event start</Label>
                        <Input
                            id="date_from"
                            name="date_from"
                            type="date"
                            value={form.data.date_from}
                            onChange={(inputEvent) =>
                                form.setData(
                                    'date_from',
                                    inputEvent.target.value,
                                )
                            }
                        />
                        <InputError message={form.errors.date_from} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="date_to">Event end</Label>
                        <Input
                            id="date_to"
                            name="date_to"
                            type="date"
                            value={form.data.date_to}
                            onChange={(inputEvent) =>
                                form.setData(
                                    'date_to',
                                    inputEvent.target.value,
                                )
                            }
                        />
                        <InputError message={form.errors.date_to} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="registration_open_at">
                            Registration opens
                        </Label>
                        <Input
                            id="registration_open_at"
                            name="registration_open_at"
                            type="datetime-local"
                            value={form.data.registration_open_at}
                            onChange={(inputEvent) =>
                                form.setData(
                                    'registration_open_at',
                                    inputEvent.target.value,
                                )
                            }
                        />
                        <InputError
                            message={form.errors.registration_open_at}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="registration_close_at">
                            Registration closes
                        </Label>
                        <Input
                            id="registration_close_at"
                            name="registration_close_at"
                            type="datetime-local"
                            value={form.data.registration_close_at}
                            onChange={(inputEvent) =>
                                form.setData(
                                    'registration_close_at',
                                    inputEvent.target.value,
                                )
                            }
                        />
                        <InputError
                            message={form.errors.registration_close_at}
                        />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <FormSelect
                            id="status"
                            name="status"
                            value={form.data.status}
                            onValueChange={(value) =>
                                form.setData('status', value)
                            }
                            placeholder="Select status"
                            options={statusOptions.map((option) => ({
                                value: option.value,
                                label: option.label,
                            }))}
                        />
                        <InputError message={form.errors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="total_capacity">Total capacity</Label>
                        <Input
                            id="total_capacity"
                            name="total_capacity"
                            type="number"
                            min="1"
                            value={form.data.total_capacity}
                            onChange={(inputEvent) =>
                                form.setData(
                                    'total_capacity',
                                    inputEvent.target.value,
                                )
                            }
                            placeholder="500"
                        />
                        <InputError message={form.errors.total_capacity} />
                    </div>

                    <div className={`${mutedNoticeClassName} grid gap-3`}>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default">
                                Reserved {reservedQuantity}
                            </Badge>
                            <Badge
                                variant={
                                    remainingSlots > 0
                                        ? 'secondary'
                                        : 'destructive'
                                }
                            >
                                Remaining {remainingSlots}
                            </Badge>
                            {event && (
                                <Badge
                                    variant={
                                        event.accepting_registrations
                                            ? 'secondary'
                                            : 'destructive'
                                    }
                                    className="capitalize"
                                >
                                    {event.status}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Remaining slots are computed from all submitted,
                            pending, verified, and completed registrations.
                        </p>
                        {event?.status_reason && (
                            <p className="text-sm text-muted-foreground">
                                {event.status_reason}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <section className="space-y-4 border-t border-sidebar-border/70 pt-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold tracking-tight">
                            Fee categories
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Set the fee lines that can be used during onsite and
                            online registration.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-md"
                        onClick={addFeeCategory}
                    >
                        Add fee category
                    </Button>
                </div>

                {form.errors.fee_categories && (
                    <InputError message={form.errors.fee_categories} />
                )}

                {form.data.fee_categories.map((feeCategory, index) => {
                        const categoryRemainingSlots =
                            feeCategory.slot_limit === ''
                                ? null
                                : Math.max(
                                      Number.parseInt(
                                          feeCategory.slot_limit,
                                          10,
                                      ) - feeCategory.reserved_quantity,
                                      0,
                                  );
                        const canRemove =
                            feeCategory.reserved_quantity === 0 &&
                            form.data.fee_categories.length > 1;

                        return (
                            <div
                                key={`${feeCategory.id ?? 'new'}-${index}`}
                                className="rounded-md border border-sidebar-border/70 bg-background p-4"
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium">
                                            Fee category {index + 1}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Optional slot limits let you reserve
                                            part of the event capacity for a
                                            specific fee type.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="default">
                                            Reserved {feeCategory.reserved_quantity}
                                        </Badge>
                                        {categoryRemainingSlots !== null && (
                                            <Badge
                                                variant={
                                                    categoryRemainingSlots > 0
                                                        ? 'secondary'
                                                        : 'destructive'
                                                }
                                            >
                                                Remaining {categoryRemainingSlots}
                                            </Badge>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={!canRemove}
                                            onClick={() =>
                                                removeFeeCategory(index)
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                                    {feeCategory.id !== undefined && (
                                        <input
                                            type="hidden"
                                            value={feeCategory.id}
                                            name={`fee_categories.${index}.id`}
                                        />
                                    )}

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`fee_categories.${index}.category_name`}
                                        >
                                            Category name
                                        </Label>
                                        <Input
                                            id={`fee_categories.${index}.category_name`}
                                            value={feeCategory.category_name}
                                            onChange={(inputEvent) =>
                                                updateFeeCategory(
                                                    index,
                                                    'category_name',
                                                    inputEvent.target.value,
                                                )
                                            }
                                            placeholder="Regular (Online)"
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `fee_categories.${index}.category_name`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`fee_categories.${index}.amount`}
                                        >
                                            Amount
                                        </Label>
                                        <Input
                                            id={`fee_categories.${index}.amount`}
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={feeCategory.amount}
                                            onChange={(inputEvent) =>
                                                updateFeeCategory(
                                                    index,
                                                    'amount',
                                                    inputEvent.target.value,
                                                )
                                            }
                                            placeholder="500.00"
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `fee_categories.${index}.amount`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`fee_categories.${index}.slot_limit`}
                                        >
                                            Slot limit
                                        </Label>
                                        <Input
                                            id={`fee_categories.${index}.slot_limit`}
                                            type="number"
                                            min={feeCategory.reserved_quantity || 1}
                                            value={feeCategory.slot_limit}
                                            onChange={(inputEvent) =>
                                                updateFeeCategory(
                                                    index,
                                                    'slot_limit',
                                                    inputEvent.target.value,
                                                )
                                            }
                                            placeholder="Optional"
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `fee_categories.${index}.slot_limit`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`fee_categories.${index}.status`}
                                        >
                                            Status
                                        </Label>
                                        <FormSelect
                                            id={`fee_categories.${index}.status`}
                                            name={`fee_categories.${index}.status`}
                                            value={feeCategory.status}
                                            onValueChange={(value) =>
                                                updateFeeCategory(
                                                    index,
                                                    'status',
                                                    value,
                                                )
                                            }
                                            placeholder="Select status"
                                            options={feeCategoryStatusOptions.map(
                                                (option) => ({
                                                    value: option.value,
                                                    label: option.label,
                                                }),
                                            )}
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `fee_categories.${index}.status`
                                                ]
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                })}
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={EventController.index()}>
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {isEditing ? 'Save changes' : 'Create event'}
                </Button>
            </div>
        </form>
    );
}
