import { Link, useForm, usePage } from '@inertiajs/react';
import { Building2, Plus, ReceiptText, Trash2, UsersRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect } from 'react';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import SearchableFormSelect from '@/components/searchable-form-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formatSystemDateOnly, formatSystemDateTime } from '@/lib/date-time';
import { createClearFormErrorHandlers } from '@/lib/form-errors';
import { formControlClassName, formTextareaClassName } from '@/lib/ui-styles';
import type { Auth } from '@/types/auth';

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
    section_id: number;
    section_name: string;
    district_id: number;
    district_name: string;
};

type LineItemFormValue = {
    fee_category_id: string;
    quantity: string;
};

type OnsiteRegistrationFormData = {
    event_id: string;
    district_id: string;
    section_id: string;
    pastor_id: string;
    payment_reference: string;
    remarks: string;
    line_items: LineItemFormValue[];
};

type Props = {
    events: EventOption[];
    pastors: PastorOption[];
    registration?: {
        id: number;
        event_id: string;
        pastor_id: string;
        payment_reference: string | null;
        registration_status: string;
        remarks: string | null;
        submitted_at: string | null;
        line_items: LineItemFormValue[];
    };
};

const textareaClassName = formTextareaClassName;
const detailCardClassName =
    'rounded-md border border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(247,250,249,0.98),_rgba(255,255,255,1))] px-5 py-5 shadow-sm shadow-[#184d47]/8';
const summaryCardClassName =
    'rounded-md border px-5 py-5 shadow-sm transition-colors';
const quantityInputClassName = formControlClassName;

const normalizeQuantityValue = (value: string): string =>
    value.replace(/\D+/g, '');

const formatCurrency = (value: number | string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(
        typeof value === 'string' ? Number.parseFloat(value || '0') : value,
    );

const formatDate = (value: string): string => formatSystemDateTime(value);

const formatEventDate = (value: string): string => formatSystemDateOnly(value);

function emptyLineItem(): LineItemFormValue {
    return {
        fee_category_id: '',
        quantity: '',
    };
}

export default function OnsiteRegistrationForm({
    events,
    pastors,
    registration,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isEditing = registration !== undefined;
    const initialPastor = registration
        ? (pastors.find(
              (pastor) => pastor.id.toString() === registration.pastor_id,
          ) ?? null)
        : null;
    const form = useForm<OnsiteRegistrationFormData>({
        event_id: registration?.event_id ?? events[0]?.id.toString() ?? '',
        district_id: initialPastor?.district_id.toString() ?? '',
        section_id: initialPastor?.section_id.toString() ?? '',
        pastor_id: registration?.pastor_id ?? '',
        payment_reference: registration?.payment_reference ?? '',
        remarks: registration?.remarks ?? '',
        line_items: registration?.line_items.length
            ? registration.line_items
            : [emptyLineItem()],
    });
    const selectedEvent =
        events.find((event) => event.id.toString() === form.data.event_id) ??
        null;
    const selectedPastor =
        pastors.find(
            (pastor) => pastor.id.toString() === form.data.pastor_id,
        ) ?? null;
    const isSuperAdminViewer = auth.can.viewSystemAdminMenu;
    const availableFeeCategories = selectedEvent?.fee_categories ?? [];
    const districtOptions = Array.from(
        new Map(
            pastors.map((pastor) => [
                pastor.district_id,
                {
                    id: pastor.district_id,
                    name: pastor.district_name,
                },
            ]),
        ).values(),
    ).sort((left, right) => left.name.localeCompare(right.name));
    const sectionOptions = Array.from(
        new Map(
            pastors.map((pastor) => [
                pastor.section_id,
                {
                    id: pastor.section_id,
                    name: pastor.section_name,
                    district_id: pastor.district_id,
                    district_name: pastor.district_name,
                },
            ]),
        ).values(),
    ).sort((left, right) => left.name.localeCompare(right.name));
    const filteredSections = form.data.district_id
        ? sectionOptions.filter(
              (section) =>
                  section.district_id.toString() === form.data.district_id,
          )
        : sectionOptions;
    const filteredPastors = form.data.section_id
        ? pastors.filter(
              (pastor) => pastor.section_id.toString() === form.data.section_id,
          )
        : form.data.district_id
          ? pastors.filter(
                (pastor) =>
                    pastor.district_id.toString() === form.data.district_id,
            )
          : pastors;

    useEffect(() => {
        if (districtOptions.length !== 1 || form.data.district_id !== '') {
            return;
        }

        form.setData('district_id', districtOptions[0].id.toString());
    }, [districtOptions, form]);

    useEffect(() => {
        if (filteredSections.length !== 1) {
            return;
        }

        const nextSectionId = filteredSections[0].id.toString();

        if (form.data.section_id === nextSectionId) {
            return;
        }

        form.setData((currentData) => ({
            ...currentData,
            district_id: filteredSections[0].district_id.toString(),
            section_id: nextSectionId,
            pastor_id: '',
        }));
    }, [filteredSections, form, form.data.section_id]);

    let totalQuantity = 0;
    let totalAmount = 0;

    form.data.line_items.forEach((lineItem) => {
        const quantity = Number.parseInt(lineItem.quantity || '0', 10);

        if (Number.isNaN(quantity) || quantity <= 0) {
            return;
        }

        totalQuantity += quantity;

        const feeCategory = availableFeeCategories.find(
            (category) => category.id.toString() === lineItem.fee_category_id,
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

    const changeDistrict = (value: string): void => {
        const nextSection = sectionOptions.find(
            (section) =>
                section.id.toString() === form.data.section_id &&
                section.district_id.toString() === value,
        );
        const nextPastor = pastors.find(
            (pastor) =>
                pastor.id.toString() === form.data.pastor_id &&
                pastor.district_id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id: value,
            section_id: nextSection?.id.toString() ?? '',
            pastor_id: nextPastor?.id.toString() ?? '',
        }));
    };

    const changeSection = (value: string): void => {
        const section = filteredSections.find(
            (option) => option.id.toString() === value,
        );
        const nextPastor = pastors.find(
            (pastor) =>
                pastor.id.toString() === form.data.pastor_id &&
                pastor.section_id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id:
                section?.district_id.toString() ?? currentData.district_id,
            section_id: value,
            pastor_id: nextPastor?.id.toString() ?? '',
        }));
    };

    const changePastor = (value: string): void => {
        const pastor = pastors.find((option) => option.id.toString() === value);

        form.setData((currentData) => ({
            ...currentData,
            district_id:
                pastor?.district_id.toString() ?? currentData.district_id,
            section_id: pastor?.section_id.toString() ?? currentData.section_id,
            pastor_id: value,
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

        form.submit(
            isEditing
                ? OnsiteRegistrationController.update(registration.id)
                : OnsiteRegistrationController.store(),
            {
                preserveScroll: true,
            },
        );
    };

    const clearFormErrorHandlers = createClearFormErrorHandlers(
        form.clearErrors,
    );

    return (
        <form
            className="space-y-8"
            onSubmit={submit}
            {...clearFormErrorHandlers}
        >
            <div className="space-y-6">
                <div className="grid gap-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
                        <div
                            className={`${detailCardClassName} flex h-full flex-col`}
                        >
                            <div className="space-y-1.5">
                                <div className="text-xs font-semibold tracking-[0.18em] text-[#184d47]/70 uppercase">
                                    Transaction details
                                </div>
                                <div className="text-lg font-semibold text-slate-900">
                                    Onsite registration details
                                </div>
                                <p className="text-sm leading-6 text-slate-600">
                                    Select the event and church covered by this
                                    onsite transaction, then record the official
                                    receipt or cash reference required for later
                                    confirmation.
                                </p>
                            </div>

                            <div className="mt-6 grid flex-1 gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="event_id">Event</Label>
                                    <FormSelect
                                        id="event_id"
                                        name="event_id"
                                        value={form.data.event_id}
                                        onValueChange={setEvent}
                                        placeholder="Select an event"
                                        emptyLabel="Select an event"
                                        options={events.map((event) => ({
                                            value: event.id.toString(),
                                            label: event.name,
                                        }))}
                                        disabled={events.length === 0}
                                    />
                                    <InputError
                                        message={form.errors.event_id}
                                    />
                                </div>

                                <div className="grid gap-5 xl:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="district_id">
                                            District
                                        </Label>
                                        <FormSelect
                                            id="district_id"
                                            name="district_id"
                                            value={form.data.district_id}
                                            onValueChange={changeDistrict}
                                            placeholder="Select a district"
                                            emptyLabel="Select a district"
                                            disabled={
                                                districtOptions.length === 0 ||
                                                (!isSuperAdminViewer &&
                                                    districtOptions.length ===
                                                        1)
                                            }
                                            options={districtOptions.map(
                                                (district) => ({
                                                    value: district.id.toString(),
                                                    label: district.name,
                                                }),
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="section_id">
                                            Section
                                        </Label>
                                        <FormSelect
                                            id="section_id"
                                            name="section_id"
                                            value={form.data.section_id}
                                            onValueChange={changeSection}
                                            placeholder="Select a section"
                                            emptyLabel="Select a section"
                                            disabled={
                                                filteredSections.length === 0 ||
                                                (!isSuperAdminViewer &&
                                                    filteredSections.length ===
                                                        1)
                                            }
                                            options={filteredSections.map(
                                                (section) => ({
                                                    value: section.id.toString(),
                                                    label: `${section.name} · ${section.district_name}`,
                                                }),
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="pastor_id">
                                            Pastor or church
                                        </Label>
                                        <SearchableFormSelect
                                            id="pastor_id"
                                            name="pastor_id"
                                            value={form.data.pastor_id}
                                            onValueChange={changePastor}
                                            placeholder="Select a pastor or church"
                                            options={filteredPastors.map(
                                                (pastor) => ({
                                                    value: pastor.id.toString(),
                                                    label: `${pastor.church_name} · ${pastor.pastor_name}`,
                                                    keywords: [
                                                        pastor.church_name,
                                                        pastor.pastor_name,
                                                        pastor.section_name,
                                                        pastor.district_name,
                                                    ],
                                                }),
                                            )}
                                            disabled={pastors.length === 0}
                                            searchPlaceholder="Search pastor, church, or section"
                                            emptySearchMessage="No pastors match your search."
                                        />
                                        <InputError
                                            message={form.errors.pastor_id}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="payment_reference">
                                            Official receipt / reference
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
                                            placeholder="OR-2026-00123"
                                            className={formControlClassName}
                                        />
                                        <InputError
                                            message={
                                                form.errors.payment_reference
                                            }
                                        />
                                    </div>

                                    <div className="rounded-md border border-[#d6e2de] bg-white/88 px-4 py-4 shadow-sm shadow-[#184d47]/6">
                                        <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                            Payment handling
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-900">
                                            Onsite transactions are recorded as
                                            paid.
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Keep the receipt or manual reference
                                            here so managers can reconcile the
                                            transaction faster.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <textarea
                                        id="remarks"
                                        name="remarks"
                                        value={form.data.remarks}
                                        onChange={(event) =>
                                            form.setData(
                                                'remarks',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Optional notes for this transaction."
                                        className={textareaClassName}
                                    />
                                    <InputError message={form.errors.remarks} />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-md border border-[#184d47]/20 bg-[#184d47] px-5 py-5 text-white shadow-sm shadow-[#184d47]/20">
                            <div className="flex h-full flex-col justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
                                        Event availability
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {selectedEvent?.name ??
                                            'Choose an event'}
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
                                                {formatEventDate(
                                                    selectedEvent.date_from,
                                                )}{' '}
                                                to{' '}
                                                {formatEventDate(
                                                    selectedEvent.date_to,
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Remaining slots
                                            </div>
                                            <div className="font-semibold text-white">
                                                {selectedEvent.remaining_slots}{' '}
                                                slots available
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Registration closes
                                            </div>
                                            <div className="font-semibold text-white">
                                                {formatDate(
                                                    selectedEvent.registration_close_at,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-t border-white/10 pt-4 text-sm text-white/75">
                                        Choose an event from the dropdown to
                                        review its venue, schedule, and
                                        available slots before adding your
                                        registration items.
                                    </div>
                                )}
                            </div>
                        </div>
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
                            className="rounded-md border border-[#d9e1de] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(247,250,249,0.98))] p-5 shadow-sm shadow-[#184d47]/6"
                        >
                            <div className="mb-4 flex flex-col gap-3 border-b border-[#e5ece8] pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                        Line item{' '}
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Choose one fee category and the quantity
                                        to add to this transaction.
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 rounded-md border-dashed"
                                    onClick={() => removeLineItem(index)}
                                    disabled={form.data.line_items.length === 1}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                </Button>
                            </div>

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

                                <div className="hidden lg:block" />
                            </div>

                            {selectedFeeCategory && (
                                <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    <Badge
                                        variant="outline"
                                        className="rounded-md border-slate-200 bg-white px-3 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        {formatCurrency(
                                            selectedFeeCategory.amount,
                                        )}{' '}
                                        each
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-md px-3 py-1 ${
                                            selectedFeeCategory.remaining_slots ===
                                            null
                                                ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                                                : selectedFeeCategory.remaining_slots >
                                                    0
                                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300'
                                        }`}
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
                        One receipt can cover multiple fee-category quantities
                        in the same onsite transaction.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div
                        className={`${summaryCardClassName} border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(24,77,71,0.10),_rgba(255,255,255,0.98))] shadow-[#184d47]/8`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-slate-600">
                                Selected church
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#184d47] text-white shadow-sm shadow-[#184d47]/15">
                                <Building2 className="size-[18px]" />
                            </div>
                        </div>
                        <div className="mt-5 text-lg font-semibold text-slate-900">
                            {selectedPastor?.church_name ??
                                'No church selected'}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                            {selectedPastor
                                ? `${selectedPastor.pastor_name} · ${selectedPastor.section_name}`
                                : 'Choose a pastor or church to continue.'}
                        </div>
                    </div>

                    <div
                        className={`${summaryCardClassName} border-[#dfe4e8] bg-[linear-gradient(145deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))] shadow-slate-200/70`}
                    >
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

                    <div
                        className={`${summaryCardClassName} border-[#184d47]/20 bg-[#184d47] text-white shadow-[#184d47]/20`}
                    >
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
                    <Link href={OnsiteRegistrationController.index()}>
                        Cancel
                    </Link>
                </Button>
                <Button
                    type="submit"
                    disabled={
                        form.processing ||
                        events.length === 0 ||
                        pastors.length === 0
                    }
                >
                    {form.processing && <Spinner />}
                    {isEditing
                        ? 'Save onsite registration'
                        : 'Save onsite registration'}
                </Button>
            </div>
        </form>
    );
}
