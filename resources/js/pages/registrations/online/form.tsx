import { Link, useForm } from '@inertiajs/react';
import {
    Building2,
    Paperclip,
    Plus,
    ReceiptText,
    Trash2,
    Upload,
    UsersRound,
} from 'lucide-react';
import { type FormEvent, useRef } from 'react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import AssignedChurchCard from '@/components/assigned-church-card';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    formatSystemDateOnly,
    formatSystemDateTime,
} from '@/lib/date-time';
import {
    formTextareaClassName,
    formControlClassName,
    mutedNoticeClassName,
    warningNoticeClassName,
} from '@/lib/ui-styles';

type FeeCategoryOption = {
    id: number;
    category_name: string;
    amount: string;
    slot_limit: number | null;
    remaining_slots: number | null;
    status: string;
};

type EventOption = {
    id: number;
    name: string;
    venue: string;
    description: string;
    date_from: string;
    date_to: string;
    registration_close_at: string;
    remaining_slots: number;
    fee_categories: FeeCategoryOption[];
};

type AssignedPastor = {
    id: number;
    pastor_name: string;
    church_name: string;
    section_name: string;
    district_name: string;
    status: string;
} | null;

type LineItemFormValue = {
    fee_category_id: string;
    quantity: string;
};

type ReviewRecord = {
    id: number;
    decision: string;
    reason: string | null;
    notes: string | null;
    decided_at: string | null;
    reviewer: {
        id: number;
        name: string;
    } | null;
};

type EditableRegistration = {
    id: number;
    event_id: string;
    payment_reference: string | null;
    registration_status: string;
    remarks: string | null;
    submitted_at: string | null;
    receipt: {
        original_name: string | null;
        uploaded_at: string | null;
    };
    latest_review: ReviewRecord | null;
    review_history: ReviewRecord[];
    line_items: LineItemFormValue[];
};

type OnlineRegistrationFormData = {
    event_id: string;
    payment_reference: string;
    receipt: File | null;
    remarks: string;
    line_items: LineItemFormValue[];
};

type Props = {
    assignedPastor: AssignedPastor;
    events: EventOption[];
    registration?: EditableRegistration;
};

const textareaClassName = formTextareaClassName;
const summaryCardClassName =
    'rounded-md border px-5 py-5 shadow-sm transition-colors';
const quantityInputClassName = formControlClassName;

const normalizeQuantityValue = (value: string): string =>
    value.replace(/\D+/g, '');

const formatCurrency = (value: number | string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(typeof value === 'string' ? Number.parseFloat(value || '0') : value);

const formatDate = (value: string): string => formatSystemDateTime(value);

const formatEventDate = (value: string): string => formatSystemDateOnly(value);

function emptyLineItem(): LineItemFormValue {
    return {
        fee_category_id: '',
        quantity: '',
    };
}

export default function OnlineRegistrationForm({
    assignedPastor,
    events,
    registration,
}: Props) {
    const receiptInputRef = useRef<HTMLInputElement | null>(null);
    const isEditing = registration !== undefined;
    const form = useForm<OnlineRegistrationFormData>({
        event_id: registration?.event_id ?? events[0]?.id.toString() ?? '',
        payment_reference: registration?.payment_reference ?? '',
        receipt: null,
        remarks: registration?.remarks ?? '',
        line_items: registration?.line_items.length
            ? registration.line_items
            : [emptyLineItem()],
    });
    const selectedEvent =
        events.find((event) => event.id.toString() === form.data.event_id) ??
        null;
    const availableFeeCategories = selectedEvent?.fee_categories ?? [];

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

        form.submit(
            isEditing
                ? OnlineRegistrationController.update(registration.id)
                : OnlineRegistrationController.store(),
            {
            forceFormData: true,
            preserveScroll: true,
            },
        );
    };

    return (
        <form className="space-y-8" onSubmit={submit}>
            <div className="space-y-6">
                <div className="grid gap-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
                        <div className="flex h-full flex-col gap-6">
                            <AssignedChurchCard assignedPastor={assignedPastor} />

                            {isEditing && registration?.latest_review && (
                                <div
                                    className={
                                        registration.registration_status ===
                                        'needs correction'
                                            ? warningNoticeClassName
                                            : mutedNoticeClassName
                                    }
                                >
                                    <div className="text-xs font-semibold tracking-[0.18em] uppercase">
                                        Latest review
                                    </div>
                                    <div className="mt-2 text-sm font-medium">
                                        {registration.latest_review.reviewer?.name ??
                                            'Reviewer'}{' '}
                                        marked this registration as{' '}
                                        {registration.latest_review.decision}.
                                    </div>
                                    {registration.latest_review.reason && (
                                        <div className="mt-2 text-sm leading-6">
                                            {registration.latest_review.reason}
                                        </div>
                                    )}
                                    {registration.latest_review.notes && (
                                        <div className="mt-2 text-sm leading-6 opacity-90">
                                            Reviewer notes:{' '}
                                            {registration.latest_review.notes}
                                        </div>
                                    )}
                                    {registration.latest_review.decided_at && (
                                        <div className="mt-2 text-xs uppercase tracking-[0.16em] opacity-75">
                                            {formatDate(
                                                registration.latest_review.decided_at,
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="event_id">Event</Label>
                                <FormSelect
                                    id="event_id"
                                    name="event_id"
                                    value={form.data.event_id}
                                    onValueChange={(value) =>
                                        form.setData((currentData) => ({
                                            ...currentData,
                                            event_id: value,
                                            line_items: [emptyLineItem()],
                                        }))
                                    }
                                    placeholder="Select an event"
                                    emptyLabel="Select an event"
                                    options={events.map((event) => ({
                                        value: event.id.toString(),
                                        label: event.name,
                                    }))}
                                    disabled={events.length === 0}
                                />
                                <InputError message={form.errors.event_id} />
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-md border border-[#184d47]/20 bg-[#184d47] px-5 py-5 text-white shadow-sm shadow-[#184d47]/20">
                            <div className="flex h-full flex-col justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
                                        Event availability
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {selectedEvent?.name ?? 'Choose an event'}
                                    </div>
                                </div>

                                {selectedEvent ? (
                                    <div className="space-y-4 border-t border-white/10 pt-4 text-sm">
                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Venue
                                            </div>
                                            <div className="font-semibold text-white">
                                                {selectedEvent.venue}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Event dates
                                            </div>
                                            <div className="font-semibold text-white">
                                                {formatEventDate(selectedEvent.date_from)} to{' '}
                                                {formatEventDate(selectedEvent.date_to)}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Remaining slots
                                            </div>
                                            <div className="font-semibold text-white">
                                                {selectedEvent.remaining_slots} slots available
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Registration closes
                                            </div>
                                            <div className="font-semibold text-white">
                                                {formatDate(selectedEvent.registration_close_at)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-t border-white/10 pt-4 text-sm text-white/75">
                                        Choose an event from the dropdown to review its venue, schedule, and available slots before adding your registration items.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                        <div className="grid gap-2">
                            <Label htmlFor="payment_reference">
                                Receipt / reference number
                            </Label>
                            <Input
                                id="payment_reference"
                                name="payment_reference"
                                required
                                value={form.data.payment_reference}
                                onChange={(event) =>
                                    form.setData(
                                        'payment_reference',
                                        event.target.value,
                                    )
                                }
                                placeholder="Enter the OR, deposit slip, or transfer reference"
                                className={formControlClassName}
                            />
                            <InputError message={form.errors.payment_reference} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="receipt">Proof of payment</Label>
                            <input
                                id="receipt"
                                ref={receiptInputRef}
                                name="receipt"
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(event) =>
                                    form.setData(
                                        'receipt',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className="sr-only"
                            />
                            <div className="flex h-11 items-center gap-3 rounded-md border border-input bg-background px-3 shadow-xs">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 shrink-0 rounded-md px-3"
                                    onClick={() =>
                                        receiptInputRef.current?.click()
                                    }
                                >
                                    <Upload className="size-4" />
                                    Upload proof
                                </Button>

                                <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                                    <Paperclip className="size-4 text-muted-foreground" />
                                    <span
                                        className={`truncate ${
                                            form.data.receipt
                                                ? 'font-medium text-foreground'
                                                : registration?.receipt
                                                        .original_name
                                                  ? 'font-medium text-foreground'
                                                  : 'text-muted-foreground'
                                        }`}
                                    >
                                        {form.data.receipt?.name ??
                                            registration?.receipt.original_name ??
                                            'JPG, PNG, or PDF'}
                                    </span>
                                </div>
                            </div>
                            {isEditing && registration?.receipt.uploaded_at && ! form.data.receipt && (
                                <div className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                    Current proof uploaded {formatDate(registration.receipt.uploaded_at)}
                                </div>
                            )}
                            <InputError message={form.errors.receipt} />
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
                            placeholder="Optional notes for your registration."
                            className={textareaClassName}
                        />
                        <InputError message={form.errors.remarks} />
                    </div>
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
                        className="rounded-md"
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
                            className="rounded-md border border-sidebar-border/70 bg-background p-4"
                        >
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_auto]">
                                <div className="grid gap-2">
                                    <Label htmlFor={`fee_category_${index}`}>
                                        Fee category
                                    </Label>
                                    <FormSelect
                                        id={`fee_category_${index}`}
                                        name={`line_items.${index}.fee_category_id`}
                                        value={lineItem.fee_category_id}
                                        onValueChange={(value) =>
                                            updateLineItem(
                                                index,
                                                'fee_category_id',
                                                value,
                                            )
                                        }
                                        placeholder={
                                            selectedEvent
                                                ? 'Select a fee category'
                                                : 'Select an event first'
                                        }
                                        emptyLabel={
                                            selectedEvent
                                                ? 'Select a fee category'
                                                : 'Select an event first'
                                        }
                                            options={availableFeeCategories.map(
                                                (feeCategory) => ({
                                                    value: feeCategory.id.toString(),
                                                    label: `${feeCategory.category_name}${feeCategory.status !== 'active' ? ' (Inactive)' : ''} · ${formatCurrency(feeCategory.amount)}`,
                                                }),
                                            )}
                                        disabled={selectedEvent === null}
                                    />
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
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={lineItem.quantity}
                                            onChange={(event) =>
                                                updateLineItem(
                                                    index,
                                                    'quantity',
                                                    normalizeQuantityValue(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            placeholder="0"
                                            className={quantityInputClassName}
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
                        Registration summary
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Your submission will be marked pending verification once
                        the receipt is uploaded successfully.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className={`${summaryCardClassName} border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(24,77,71,0.10),_rgba(255,255,255,0.98))] shadow-[#184d47]/8`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-slate-600">
                                Church account
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#184d47] text-white shadow-sm shadow-[#184d47]/15">
                                <Building2 className="size-[18px]" />
                            </div>
                        </div>
                        <div className="mt-5 text-lg font-semibold text-slate-900">
                            {assignedPastor?.church_name ?? 'No church assigned'}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                            {assignedPastor
                                ? `${assignedPastor.pastor_name} · ${assignedPastor.section_name}`
                                : 'Contact the admin to complete your account setup.'}
                        </div>
                    </div>

                    <div className={`${summaryCardClassName} border-[#dfe4e8] bg-[linear-gradient(145deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))] shadow-slate-200/70`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-slate-600">
                                Total quantity
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-300/70">
                                <UsersRound className="size-[18px]" />
                            </div>
                        </div>
                        <div className="mt-5 text-3xl font-semibold text-slate-900">
                            {totalQuantity}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                            Across {form.data.line_items.length} fee-category
                            item
                            {form.data.line_items.length === 1 ? '' : 's'}
                        </div>
                    </div>

                    <div className={`${summaryCardClassName} border-[#184d47]/20 bg-[#184d47] text-white shadow-[#184d47]/20`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-white/75">
                                Estimated total
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-white/14 text-white ring-1 ring-white/15">
                                <ReceiptText className="size-[18px]" />
                            </div>
                        </div>
                        <div className="mt-5 text-3xl font-semibold">
                            {formatCurrency(totalAmount)}
                        </div>
                        <div className="mt-2 text-sm text-white/75">
                            Computed from the selected fee category rates.
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={OnlineRegistrationController.index()}>
                        Cancel
                    </Link>
                </Button>
                <Button
                    type="submit"
                    disabled={
                        form.processing ||
                        events.length === 0 ||
                        assignedPastor === null
                    }
                >
                    {form.processing && <Spinner />}
                    {isEditing &&
                    registration?.registration_status === 'needs correction'
                        ? 'Resubmit online registration'
                        : isEditing
                          ? 'Save online registration'
                          : 'Submit online registration'}
                </Button>
            </div>
        </form>
    );
}
