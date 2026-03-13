import { Link, useForm } from '@inertiajs/react';
import { Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type FeeCategoryOption = {
    id: number;
    category_name: string;
    amount: string;
    slot_limit: number | null;
    remaining_slots: number | null;
};

type EventOption = {
    id: number;
    name: string;
    venue: string;
    date_from: string;
    date_to: string;
    registration_close_at: string;
    remaining_slots: number;
    fee_categories: FeeCategoryOption[];
};

type PastorOption = {
    id: number;
    pastor_name: string;
    church_name: string;
    section_name: string;
    district_name: string;
};

type SelectOption = {
    value: string;
    label: string;
};

type LineItemFormValue = {
    fee_category_id: string;
    quantity: string;
};

type OnsiteRegistrationFormData = {
    event_id: string;
    pastor_id: string;
    payment_status: string;
    payment_reference: string;
    remarks: string;
    line_items: LineItemFormValue[];
};

type Props = {
    events: EventOption[];
    pastors: PastorOption[];
    paymentStatusOptions: SelectOption[];
};

const textareaClassName =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

const formatCurrency = (value: number | string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(typeof value === 'string' ? Number.parseFloat(value || '0') : value);

const formatDate = (value: string): string =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

function emptyLineItem(): LineItemFormValue {
    return {
        fee_category_id: '',
        quantity: '',
    };
}

export default function OnsiteRegistrationForm({
    events,
    pastors,
    paymentStatusOptions,
}: Props) {
    const [pastorSearch, setPastorSearch] = useState('');
    const form = useForm<OnsiteRegistrationFormData>({
        event_id: events[0]?.id.toString() ?? '',
        pastor_id: '',
        payment_status:
            paymentStatusOptions.find((option) => option.value === 'unpaid')
                ?.value ??
            paymentStatusOptions[0]?.value ??
            '',
        payment_reference: '',
        remarks: '',
        line_items: [emptyLineItem()],
    });
    const selectedEvent =
        events.find((event) => event.id.toString() === form.data.event_id) ??
        null;
    const selectedPastor =
        pastors.find((pastor) => pastor.id.toString() === form.data.pastor_id) ??
        null;
    const availableFeeCategories = selectedEvent?.fee_categories ?? [];
    const filteredPastors = pastors.filter((pastor) => {
        const haystack = [
            pastor.church_name,
            pastor.pastor_name,
            pastor.section_name,
            pastor.district_name,
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(pastorSearch.toLowerCase());
    });
    const pastorOptions =
        selectedPastor &&
        ! filteredPastors.some((pastor) => pastor.id === selectedPastor.id)
            ? [selectedPastor, ...filteredPastors]
            : filteredPastors;

    let totalQuantity = 0;
    let totalAmount = 0;

    form.data.line_items.forEach((lineItem) => {
        const quantity = Number.parseInt(lineItem.quantity || '0', 10);

        if (Number.isNaN(quantity) || quantity <= 0) {
            return;
        }

        totalQuantity += quantity;

        const feeCategory = availableFeeCategories.find(
            (category) =>
                category.id.toString() === lineItem.fee_category_id,
        );

        if (feeCategory) {
            totalAmount += quantity * Number.parseFloat(feeCategory.amount);
        }
    });

    const setEvent = (eventId: string): void => {
        form.setData((currentData) => ({
            ...currentData,
            event_id: eventId,
            line_items: [emptyLineItem()],
        }));
    };

    const updateLineItem = (
        index: number,
        field: keyof LineItemFormValue,
        value: string,
    ): void => {
        form.setData(
            'line_items',
            form.data.line_items.map((lineItem, lineItemIndex) =>
                lineItemIndex === index
                    ? {
                          ...lineItem,
                          [field]: value,
                      }
                    : lineItem,
            ),
        );
    };

    const addLineItem = (): void => {
        form.setData('line_items', [...form.data.line_items, emptyLineItem()]);
    };

    const removeLineItem = (index: number): void => {
        form.setData(
            'line_items',
            form.data.line_items.filter(
                (_, lineItemIndex) => lineItemIndex !== index,
            ),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.submit(OnsiteRegistrationController.store(), {
            preserveScroll: true,
        });
    };

    return (
        <form className="space-y-8" onSubmit={submit}>
            <div className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="grid gap-2">
                            <Label htmlFor="event_id">Event</Label>
                            <select
                                id="event_id"
                                name="event_id"
                                value={form.data.event_id}
                                onChange={(event) =>
                                    setEvent(event.target.value)
                                }
                                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                disabled={events.length === 0}
                            >
                                <option value="">Select an event</option>
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>
                                        {event.name} · {event.remaining_slots}{' '}
                                        slots left
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.event_id} />
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-4 text-sm">
                            <div className="font-medium">Event availability</div>
                            {selectedEvent ? (
                                <div className="mt-3 space-y-2 text-muted-foreground">
                                    <div>{selectedEvent.venue}</div>
                                    <div>
                                        {selectedEvent.remaining_slots} slots
                                        remaining
                                    </div>
                                    <div>
                                        Registration closes{' '}
                                        {formatDate(
                                            selectedEvent.registration_close_at,
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 text-muted-foreground">
                                    Choose an event to see remaining capacity.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="pastor_search">Pastor or church</Label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="pastor_search"
                                value={pastorSearch}
                                onChange={(event) =>
                                    setPastorSearch(event.target.value)
                                }
                                placeholder="Search by church, pastor, section, or district"
                                className="pl-9"
                            />
                        </div>
                        <select
                            id="pastor_id"
                            name="pastor_id"
                            value={form.data.pastor_id}
                            onChange={(event) =>
                                form.setData('pastor_id', event.target.value)
                            }
                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            disabled={pastors.length === 0}
                        >
                            <option value="">Select a pastor or church</option>
                            {pastorOptions.map((pastor) => (
                                <option key={pastor.id} value={pastor.id}>
                                    {pastor.church_name} · {pastor.pastor_name} ·{' '}
                                    {pastor.section_name}
                                </option>
                            ))}
                        </select>
                        {pastorSearch !== '' && pastorOptions.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No pastors or churches matched your search.
                            </p>
                        )}
                        <InputError message={form.errors.pastor_id} />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="payment_status">Payment status</Label>
                            <select
                                id="payment_status"
                                name="payment_status"
                                value={form.data.payment_status}
                                onChange={(event) =>
                                    form.setData(
                                        'payment_status',
                                        event.target.value,
                                    )
                                }
                                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            >
                                {paymentStatusOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.payment_status} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="payment_reference">
                                Official receipt / reference
                            </Label>
                            <Input
                                id="payment_reference"
                                name="payment_reference"
                                value={form.data.payment_reference}
                                onChange={(event) =>
                                    form.setData(
                                        'payment_reference',
                                        event.target.value,
                                    )
                                }
                                placeholder="OR-2026-00123"
                            />
                            <InputError message={form.errors.payment_reference} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <textarea
                            id="remarks"
                            name="remarks"
                            value={form.data.remarks}
                            onChange={(event) =>
                                form.setData('remarks', event.target.value)
                            }
                            placeholder="Optional notes for this transaction."
                            className={textareaClassName}
                        />
                        <InputError message={form.errors.remarks} />
                    </div>
            </div>

            <section className="space-y-4 border-t border-sidebar-border/70 pt-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold tracking-tight">
                            Line items
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Add one or more fee categories with their
                            corresponding quantities.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={addLineItem}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add item
                    </Button>
                </div>

                {form.data.line_items.map((lineItem, index) => {
                        const selectedFeeCategory =
                            availableFeeCategories.find(
                                (feeCategory) =>
                                    feeCategory.id.toString() ===
                                    lineItem.fee_category_id,
                            ) ?? null;

                        return (
                            <div
                                key={index}
                                className="rounded-xl border border-sidebar-border/70 bg-background p-4"
                            >
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_auto]">
                                    <div className="grid gap-2">
                                        <Label htmlFor={`fee_category_${index}`}>
                                            Fee category
                                        </Label>
                                        <select
                                            id={`fee_category_${index}`}
                                            name={`line_items.${index}.fee_category_id`}
                                            value={lineItem.fee_category_id}
                                            onChange={(event) =>
                                                updateLineItem(
                                                    index,
                                                    'fee_category_id',
                                                    event.target.value,
                                                )
                                            }
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                            disabled={selectedEvent === null}
                                        >
                                            <option value="">
                                                {selectedEvent
                                                    ? 'Select a fee category'
                                                    : 'Select an event first'}
                                            </option>
                                            {availableFeeCategories.map(
                                                (feeCategory) => (
                                                    <option
                                                        key={feeCategory.id}
                                                        value={feeCategory.id}
                                                    >
                                                        {feeCategory.category_name}{' '}
                                                        ·{' '}
                                                        {formatCurrency(
                                                            feeCategory.amount,
                                                        )}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <InputError
                                            message={
                                                form.errors[
                                                    `line_items.${index}.fee_category_id`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor={`quantity_${index}`}>
                                            Quantity
                                        </Label>
                                        <Input
                                            id={`quantity_${index}`}
                                            name={`line_items.${index}.quantity`}
                                            type="number"
                                            min="1"
                                            value={lineItem.quantity}
                                            onChange={(event) =>
                                                updateLineItem(
                                                    index,
                                                    'quantity',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="0"
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `line_items.${index}.quantity`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => removeLineItem(index)}
                                            disabled={
                                                form.data.line_items.length === 1
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>

                                {selectedFeeCategory && (
                                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                        <Badge variant="default">
                                            {formatCurrency(
                                                selectedFeeCategory.amount,
                                            )}{' '}
                                            each
                                        </Badge>
                                        <Badge
                                            variant={
                                                selectedFeeCategory.remaining_slots ===
                                                null
                                                    ? 'default'
                                                    : selectedFeeCategory.remaining_slots >
                                                          0
                                                      ? 'secondary'
                                                      : 'destructive'
                                            }
                                        >
                                            {selectedFeeCategory.remaining_slots ===
                                            null
                                                ? 'No category slot limit'
                                                : `${selectedFeeCategory.remaining_slots} category slots left`}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <InputError message={form.errors.line_items} />
            </section>

            <section className="space-y-4 border-t border-sidebar-border/70 pt-8">
                <div className="space-y-1">
                    <h3 className="text-base font-semibold tracking-tight">
                        Transaction summary
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        One receipt can cover multiple fee-category quantities in
                        the same onsite transaction.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                        <div className="text-sm text-muted-foreground">
                            Selected church
                        </div>
                        <div className="mt-2 font-medium">
                            {selectedPastor?.church_name ?? 'No church selected'}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {selectedPastor
                                ? `${selectedPastor.pastor_name} · ${selectedPastor.section_name}`
                                : 'Choose a pastor or church to continue.'}
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                        <div className="text-sm text-muted-foreground">
                            Total quantity
                        </div>
                        <div className="mt-2 text-2xl font-semibold">
                            {totalQuantity}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            Across {form.data.line_items.length} fee-category
                            item
                            {form.data.line_items.length === 1 ? '' : 's'}
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                        <div className="text-sm text-muted-foreground">
                            Estimated total
                        </div>
                        <div className="mt-2 text-2xl font-semibold">
                            {formatCurrency(totalAmount)}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            Computed from the selected fee category rates.
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={OnsiteRegistrationController.index()}>
                        Cancel
                    </Link>
                </Button>
                <Button
                    type="submit"
                    disabled={
                        form.processing || events.length === 0 || pastors.length === 0
                    }
                >
                    {form.processing && <Spinner />}
                    Save onsite registration
                </Button>
            </div>
        </form>
    );
}
