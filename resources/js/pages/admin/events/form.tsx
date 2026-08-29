import { Link, useForm, usePage } from '@inertiajs/react';
import { Plus, QrCode, Trash2, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect } from 'react';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { createClearFormErrorHandlers } from '@/lib/form-errors';
import { formTextareaClassName, mutedNoticeClassName } from '@/lib/ui-styles';
import type { Auth } from '@/types/auth';

type PersistedFeeCategory = {
    id?: number;
    category_name: string;
    amount: string;
    slot_limit: number | null;
    status: string;
    reserved_quantity: number;
    remaining_slots: number | null;
};

type PersistedBankAccount = {
    id?: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    qr_code_url: string | null;
    qr_code_original_name: string | null;
    status: string;
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

type BankAccountFormValue = {
    id?: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    qr_code: File | null;
    qr_code_url: string | null;
    qr_code_original_name: string | null;
    remove_qr_code: boolean;
    status: string;
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
    scope_type: string;
    district_id: number | null;
    section_id: number | null;
    department_id: number | null;
    total_capacity: number;
    reserved_quantity: number;
    remaining_slots: number;
    status_reason: string | null;
    accepting_registrations: boolean;
    fee_categories: PersistedFeeCategory[];
    bank_accounts: PersistedBankAccount[];
};

type SelectOption = {
    value: string;
    label: string;
};

type SectionOption = {
    id: number;
    name: string;
    district_id: number;
    district_name: string;
    status: string;
};

type DistrictOption = {
    id: number;
    name: string;
    status: string;
};

type DepartmentOption = {
    id: number;
    name: string;
    status: string;
};

type Props = {
    event?: EventRecord;
    statusOptions: SelectOption[];
    scopeTypeOptions: SelectOption[];
    districts: DistrictOption[];
    sections: SectionOption[];
    departments: DepartmentOption[];
    formDefaults?: {
        scope_type: string;
        district_id: number | null;
        section_id: number | null;
        department_id: number | null;
    };
    feeCategoryStatusOptions: SelectOption[];
    bankAccountStatusOptions: SelectOption[];
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
    scope_type: string;
    district_id: string;
    section_id: string;
    department_id: string;
    total_capacity: string;
    bank_accounts: BankAccountFormValue[];
    fee_categories: FeeCategoryFormValue[];
};

function emptyBankAccount(): BankAccountFormValue {
    return {
        bank_name: '',
        account_name: '',
        account_number: '',
        qr_code: null,
        qr_code_url: null,
        qr_code_original_name: null,
        remove_qr_code: false,
        status: 'active',
    };
}

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
    scopeTypeOptions,
    districts,
    sections,
    departments,
    formDefaults,
    feeCategoryStatusOptions,
    bankAccountStatusOptions,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
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
        scope_type:
            event?.scope_type ??
            formDefaults?.scope_type ??
            scopeTypeOptions[0]?.value ??
            'district',
        district_id:
            event?.district_id?.toString() ??
            formDefaults?.district_id?.toString() ??
            districts[0]?.id?.toString() ??
            '',
        section_id:
            event?.section_id?.toString() ??
            formDefaults?.section_id?.toString() ??
            '',
        department_id:
            event?.department_id?.toString() ??
            formDefaults?.department_id?.toString() ??
            (departments.length === 1 ? departments[0].id.toString() : ''),
        total_capacity: event ? event.total_capacity.toString() : '',
        bank_accounts:
            event?.bank_accounts.map((bankAccount) => ({
                ...bankAccount,
                qr_code: null,
                remove_qr_code: false,
            })) ?? [],
        fee_categories: event?.fee_categories.map((feeCategory) => ({
            ...feeCategory,
            slot_limit: feeCategory.slot_limit?.toString() ?? '',
        })) ?? [emptyFeeCategory()],
    });

    const reservedQuantity = event?.reserved_quantity ?? 0;
    const totalCapacity = Number.parseInt(form.data.total_capacity || '0', 10);
    const remainingSlots = Math.max(totalCapacity - reservedQuantity, 0);
    const isSuperAdminViewer = auth.can.viewSystemAdminMenu;
    const filteredSections = form.data.district_id
        ? sections.filter(
              (section) =>
                  section.district_id.toString() === form.data.district_id,
          )
        : sections;
    const selectedDistrict =
        districts.find(
            (district) => district.id.toString() === form.data.district_id,
        ) ?? null;
    const selectedSection =
        sections.find(
            (section) => section.id.toString() === form.data.section_id,
        ) ?? null;
    const selectedDepartment =
        departments.find(
            (department) =>
                department.id.toString() === form.data.department_id,
        ) ?? null;
    const canAddBankAccount = form.data.bank_accounts.length < 3;
    const scopeSummary =
        form.data.scope_type === 'section'
            ? `${selectedSection ? `${selectedSection.name} · ${selectedSection.district_name}` : 'Choose a section'} · ${selectedDepartment?.name ?? 'No department'}`
            : `${selectedDistrict?.name ?? 'Choose a district'} · District-wide · ${selectedDepartment?.name ?? 'No department'}`;

    useEffect(() => {
        if (districts.length !== 1 || form.data.district_id !== '') {
            return;
        }

        form.setData('district_id', districts[0].id.toString());
    }, [districts, form]);

    useEffect(() => {
        if (
            form.data.scope_type !== 'section' ||
            filteredSections.length !== 1
        ) {
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
        }));
    }, [filteredSections, form, form.data.scope_type, form.data.section_id]);

    const changeScopeType = (value: string): void => {
        form.setData((currentData) => ({
            ...currentData,
            scope_type: value,
            section_id: value === 'section' ? currentData.section_id : '',
        }));
    };

    const changeDistrict = (value: string): void => {
        const nextSection = sections.find(
            (section) =>
                section.id.toString() === form.data.section_id &&
                section.district_id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id: value,
            section_id:
                currentData.scope_type === 'section'
                    ? (nextSection?.id.toString() ?? '')
                    : '',
        }));
    };

    const changeSection = (value: string): void => {
        const section = filteredSections.find(
            (option) => option.id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id:
                section?.district_id.toString() ?? currentData.district_id,
            section_id: value,
        }));
    };

    const updateBankAccount = (
        index: number,
        field: 'bank_name' | 'account_name' | 'account_number' | 'status',
        value: string,
    ): void => {
        form.setData(
            'bank_accounts',
            form.data.bank_accounts.map((bankAccount, bankAccountIndex) =>
                bankAccountIndex === index
                    ? {
                          ...bankAccount,
                          [field]: value,
                      }
                    : bankAccount,
            ),
        );
    };

    const updateBankAccountQrCode = (
        index: number,
        file: File | null,
    ): void => {
        form.setData(
            'bank_accounts',
            form.data.bank_accounts.map((bankAccount, bankAccountIndex) =>
                bankAccountIndex === index
                    ? {
                          ...bankAccount,
                          qr_code: file,
                          remove_qr_code: file
                              ? false
                              : bankAccount.remove_qr_code,
                      }
                    : bankAccount,
            ),
        );
    };

    const clearBankAccountQrCode = (index: number): void => {
        form.setData(
            'bank_accounts',
            form.data.bank_accounts.map((bankAccount, bankAccountIndex) =>
                bankAccountIndex === index
                    ? {
                          ...bankAccount,
                          qr_code: null,
                          qr_code_url: null,
                          qr_code_original_name: null,
                          remove_qr_code: true,
                      }
                    : bankAccount,
            ),
        );
    };

    const addBankAccount = (): void => {
        if (!canAddBankAccount) {
            return;
        }

        form.setData('bank_accounts', [
            ...form.data.bank_accounts,
            emptyBankAccount(),
        ]);
    };

    const removeBankAccount = (index: number): void => {
        form.setData(
            'bank_accounts',
            form.data.bank_accounts.filter(
                (_, bankAccountIndex) => bankAccountIndex !== index,
            ),
        );
    };

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
                forceFormData: true,
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
                            placeholder="District Leadership Summit"
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
                            form.setData('description', inputEvent.target.value)
                        }
                        placeholder="Describe the event purpose, audience, and important logistics."
                        className={formTextareaClassName}
                    />
                    <InputError message={form.errors.description} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="grid gap-2">
                        <Label htmlFor="scope_type">Scope</Label>
                        <FormSelect
                            id="scope_type"
                            name="scope_type"
                            value={form.data.scope_type}
                            onValueChange={changeScopeType}
                            placeholder="Select scope"
                            disabled={
                                !isSuperAdminViewer &&
                                scopeTypeOptions.length === 1
                            }
                            options={scopeTypeOptions.map((option) => ({
                                value: option.value,
                                label: option.label,
                            }))}
                        />
                        <InputError message={form.errors.scope_type} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="district_id">Owning district</Label>
                        <FormSelect
                            id="district_id"
                            name="district_id"
                            value={form.data.district_id}
                            onValueChange={changeDistrict}
                            placeholder="Select a district"
                            disabled={
                                form.data.scope_type === 'section' ||
                                (!isSuperAdminViewer &&
                                    districts.length === 1) ||
                                districts.length === 0
                            }
                            options={districts.map((district) => ({
                                value: district.id.toString(),
                                label: `${district.name}${district.status === 'inactive' ? ' (Inactive)' : ''}`,
                            }))}
                        />
                        <InputError message={form.errors.district_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="section_id">Owning section</Label>
                        <FormSelect
                            id="section_id"
                            name="section_id"
                            value={form.data.section_id}
                            onValueChange={changeSection}
                            placeholder="Select a section"
                            emptyLabel="No section scope"
                            disabled={
                                form.data.scope_type !== 'section' ||
                                filteredSections.length === 0 ||
                                (!isSuperAdminViewer &&
                                    filteredSections.length === 1)
                            }
                            options={filteredSections.map((section) => ({
                                value: section.id.toString(),
                                label: `${section.name} · ${section.district_name}${section.status === 'inactive' ? ' (Inactive)' : ''}`,
                            }))}
                        />
                        <InputError message={form.errors.section_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="department_id">Department</Label>
                        <FormSelect
                            id="department_id"
                            name="department_id"
                            value={form.data.department_id}
                            onValueChange={(value) =>
                                form.setData('department_id', value)
                            }
                            placeholder="Select a department"
                            emptyLabel="No department"
                            disabled={
                                (!isSuperAdminViewer &&
                                    departments.length <= 1) ||
                                departments.length === 0
                            }
                            options={departments.map((department) => ({
                                value: department.id.toString(),
                                label: `${department.name}${department.status === 'inactive' ? ' (Inactive)' : ''}`,
                            }))}
                        />
                        <InputError message={form.errors.department_id} />
                    </div>
                </div>

                <div className={mutedNoticeClassName}>
                    This event is currently configured as{' '}
                    <strong>{scopeSummary}</strong>.
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
                                form.setData('date_to', inputEvent.target.value)
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
                            Payment bank accounts
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Add up to 3 active transfer destinations for online
                            registrants.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-md"
                        onClick={addBankAccount}
                        disabled={!canAddBankAccount}
                    >
                        <Plus className="size-4" />
                        Add bank account
                    </Button>
                </div>

                {form.errors.bank_accounts && (
                    <InputError message={form.errors.bank_accounts} />
                )}

                {form.data.bank_accounts.length === 0 ? (
                    <div className={mutedNoticeClassName}>
                        No bank accounts attached yet. Registrants can still
                        upload proof of payment without selecting a transfer
                        destination.
                    </div>
                ) : (
                    form.data.bank_accounts.map((bankAccount, index) => (
                        <div
                            key={`${bankAccount.id ?? 'new'}-${index}`}
                            className="rounded-md border border-sidebar-border/70 bg-background p-4"
                        >
                            {bankAccount.id !== undefined && (
                                <input
                                    type="hidden"
                                    value={bankAccount.id}
                                    name={`bank_accounts.${index}.id`}
                                />
                            )}

                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-medium">
                                        Bank account {index + 1}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        These details are shown to online
                                        registrants before they upload payment
                                        proof.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBankAccount(index)}
                                >
                                    <Trash2 className="size-4" />
                                    Remove
                                </Button>
                            </div>

                            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`bank_accounts.${index}.bank_name`}
                                        >
                                            Bank name
                                        </Label>
                                        <Input
                                            id={`bank_accounts.${index}.bank_name`}
                                            value={bankAccount.bank_name}
                                            onChange={(inputEvent) =>
                                                updateBankAccount(
                                                    index,
                                                    'bank_name',
                                                    inputEvent.target.value,
                                                )
                                            }
                                            placeholder="Bank or wallet name"
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `bank_accounts.${index}.bank_name`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`bank_accounts.${index}.account_name`}
                                        >
                                            Account name
                                        </Label>
                                        <Input
                                            id={`bank_accounts.${index}.account_name`}
                                            value={bankAccount.account_name}
                                            onChange={(inputEvent) =>
                                                updateBankAccount(
                                                    index,
                                                    'account_name',
                                                    inputEvent.target.value,
                                                )
                                            }
                                            placeholder="Account holder"
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `bank_accounts.${index}.account_name`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`bank_accounts.${index}.account_number`}
                                        >
                                            Account number
                                        </Label>
                                        <Input
                                            id={`bank_accounts.${index}.account_number`}
                                            value={bankAccount.account_number}
                                            onChange={(inputEvent) =>
                                                updateBankAccount(
                                                    index,
                                                    'account_number',
                                                    inputEvent.target.value,
                                                )
                                            }
                                            placeholder="Account or mobile number"
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `bank_accounts.${index}.account_number`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={`bank_accounts.${index}.status`}
                                        >
                                            Status
                                        </Label>
                                        <FormSelect
                                            id={`bank_accounts.${index}.status`}
                                            name={`bank_accounts.${index}.status`}
                                            value={bankAccount.status}
                                            onValueChange={(value) =>
                                                updateBankAccount(
                                                    index,
                                                    'status',
                                                    value,
                                                )
                                            }
                                            placeholder="Select status"
                                            options={bankAccountStatusOptions.map(
                                                (option) => ({
                                                    value: option.value,
                                                    label: option.label,
                                                }),
                                            )}
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `bank_accounts.${index}.status`
                                                ]
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <Label
                                        htmlFor={`bank_accounts.${index}.qr_code`}
                                    >
                                        QR code image
                                    </Label>
                                    <Input
                                        id={`bank_accounts.${index}.qr_code`}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                        onChange={(inputEvent) =>
                                            updateBankAccountQrCode(
                                                index,
                                                inputEvent.target.files?.[0] ??
                                                    null,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            form.errors[
                                                `bank_accounts.${index}.qr_code`
                                            ]
                                        }
                                    />

                                    {bankAccount.qr_code_url ? (
                                        <div className="overflow-hidden rounded-md border border-sidebar-border/70 bg-white p-3">
                                            <img
                                                src={bankAccount.qr_code_url}
                                                alt={`${bankAccount.bank_name || 'Bank'} QR code`}
                                                className="mx-auto aspect-square max-h-40 object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex aspect-square max-h-40 items-center justify-center rounded-md border border-dashed border-sidebar-border/80 bg-muted/30 text-muted-foreground">
                                            <QrCode className="size-9" />
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <Upload className="size-3.5" />
                                        <span>
                                            {bankAccount.qr_code?.name ??
                                                bankAccount.qr_code_original_name ??
                                                'Optional JPG, PNG, or WebP'}
                                        </span>
                                        {(bankAccount.qr_code ||
                                            bankAccount.qr_code_url) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 rounded-md px-2 text-xs"
                                                onClick={() =>
                                                    clearBankAccountQrCode(
                                                        index,
                                                    )
                                                }
                                            >
                                                Clear QR
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>

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
                                  Number.parseInt(feeCategory.slot_limit, 10) -
                                      feeCategory.reserved_quantity,
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
                                        onClick={() => removeFeeCategory(index)}
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
                    <Link href={EventController.index()}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {isEditing ? 'Save changes' : 'Create event'}
                </Button>
            </div>
        </form>
    );
}
