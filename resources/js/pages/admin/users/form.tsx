import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import SearchableFormSelect from '@/components/searchable-form-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { createClearFormErrorHandlers } from '@/lib/form-errors';
import { mutedNoticeClassName } from '@/lib/ui-styles';

type UserRecord = {
    id: number;
    name: string;
    email: string;
    role_id: number | null;
    district_id: number | null;
    department_id: number | null;
    section_id: number | null;
    pastor_id: number | null;
    position_title: string | null;
    status: string;
    scope_summary: string;
    email_verified_at: string | null;
};

type RoleOption = {
    id: number;
    name: string;
};

type DepartmentOption = {
    id: number;
    name: string;
    status: string;
};

type DistrictOption = {
    id: number;
    name: string;
    status: string;
};

type SectionOption = {
    id: number;
    name: string;
    district_id: number;
    district_name: string;
    status: string;
};

type PastorOption = {
    id: number;
    pastor_name: string;
    church_name: string;
    section_id: number;
    section_name: string;
    district_id: number;
    district_name: string;
    status: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    userRecord?: UserRecord;
    roles: RoleOption[];
    departments: DepartmentOption[];
    districts: DistrictOption[];
    sections: SectionOption[];
    pastors: PastorOption[];
    statusOptions: StatusOption[];
    minimalLayout?: boolean;
};

type UserFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role_id: string;
    district_id: string;
    department_id: string;
    section_id: string;
    pastor_id: string;
    position_title: string;
    status: string;
};

const roleDescriptions: Record<string, string> = {
    Admin: 'Administrative access. Department is optional and scope can remain general for now.',
    Manager: 'Section oversight account. Assign a section and optionally attach a department.',
    'Registration Staff':
        'Can encode onsite registrations. Scope is optional for this MVP.',
    'Online Registrant':
        'Must be assigned to one pastor or church account. Department stays optional.',
};

const formatSectionOptionLabel = (section: SectionOption): string =>
    `${section.name}${section.status === 'inactive' ? ' (Inactive)' : ''}`;

const formatPastorOptionLabel = (pastor: PastorOption): string =>
    `${pastor.section_name} · ${pastor.pastor_name}${pastor.status === 'inactive' ? ' (Inactive)' : ''}`;

export default function UserForm({
    userRecord,
    roles,
    departments,
    districts,
    sections,
    pastors,
    statusOptions,
    minimalLayout = false,
}: Props) {
    const isEditing = userRecord !== undefined;
    const form = useForm<UserFormData>({
        name: userRecord?.name ?? '',
        email: userRecord?.email ?? '',
        password: '',
        password_confirmation: '',
        role_id: userRecord?.role_id?.toString() ?? roles[0]?.id.toString() ?? '',
        district_id: userRecord?.district_id?.toString() ?? '',
        department_id: userRecord?.department_id?.toString() ?? '',
        section_id: userRecord?.section_id?.toString() ?? '',
        pastor_id: userRecord?.pastor_id?.toString() ?? '',
        position_title: userRecord?.position_title ?? '',
        status: userRecord?.status ?? 'active',
    });

    const selectedRole =
        roles.find((role) => role.id.toString() === form.data.role_id) ?? null;
    const filteredSections = form.data.district_id
        ? sections.filter(
              (section) =>
                  section.district_id.toString() === form.data.district_id,
          )
        : sections;
    const filteredPastors = form.data.section_id
        ? pastors.filter(
              (pastor) =>
                  pastor.section_id.toString() === form.data.section_id,
          )
        : pastors;
    const selectedDistrict =
        districts.find(
            (district) => district.id.toString() === form.data.district_id,
        ) ?? null;
    const selectedDepartment =
        departments.find(
            (department) =>
                department.id.toString() === form.data.department_id,
        ) ?? null;
    const selectedSection =
        sections.find(
            (section) => section.id.toString() === form.data.section_id,
        ) ?? null;
    const selectedPastor =
        pastors.find(
            (pastor) => pastor.id.toString() === form.data.pastor_id,
        ) ?? null;

    const changeRole = (value: string): void => {
        const roleName = roles.find((role) => role.id.toString() === value)?.name;

        form.setData((currentData) => ({
            ...currentData,
            role_id: value,
            pastor_id: roleName === 'Manager' ? '' : currentData.pastor_id,
        }));
    };

    const changeDistrict = (value: string): void => {
        const nextSection = sections.find(
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
        const section = sections.find(
            (option) => option.id.toString() === value,
        );
        const nextPastor = pastors.find(
            (pastor) =>
                pastor.id.toString() === form.data.pastor_id &&
                pastor.section_id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id: section?.district_id.toString() ?? currentData.district_id,
            section_id: value,
            pastor_id: nextPastor?.id.toString() ?? '',
        }));
    };

    const changePastor = (value: string): void => {
        const pastor = pastors.find(
            (option) => option.id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id: pastor?.district_id.toString() ?? currentData.district_id,
            section_id: pastor?.section_id.toString() ?? currentData.section_id,
            pastor_id: value,
        }));
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.submit(
            isEditing
                ? UserController.update(userRecord.id)
                : UserController.store(),
            {
                preserveScroll: true,
            },
        );
    };

    const clearFormErrorHandlers = createClearFormErrorHandlers(form.clearErrors);

    const formContent = (
        <form
            className="space-y-6"
            onSubmit={submit}
            {...clearFormErrorHandlers}
        >
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        autoFocus
                        placeholder="Pastor Jane Doe"
                    />
                    <InputError message={form.errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.data.email}
                        onChange={(event) =>
                            form.setData('email', event.target.value)
                        }
                        placeholder="user@example.com"
                    />
                    <InputError message={form.errors.email} />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                    <Label htmlFor="role_id">Role</Label>
                    <FormSelect
                        id="role_id"
                        name="role_id"
                        value={form.data.role_id}
                        onValueChange={changeRole}
                        placeholder="Select a role"
                        emptyLabel="Select a role"
                        options={roles.map((role) => ({
                            value: role.id.toString(),
                            label: role.name,
                        }))}
                    />
                    <InputError message={form.errors.role_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <FormSelect
                        id="status"
                        name="status"
                        value={form.data.status}
                        onValueChange={(value) => form.setData('status', value)}
                        placeholder="Select status"
                        options={statusOptions.map((statusOption) => ({
                            value: statusOption.value,
                            label: statusOption.label,
                        }))}
                    />
                    <InputError message={form.errors.status} />
                </div>
            </div>

            {selectedRole && (
                <div className={mutedNoticeClassName}>
                    {roleDescriptions[selectedRole.name] ??
                        'Assign the scope that matches this role.'}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
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
                        emptyLabel="General / no department"
                        options={departments.map((department) => ({
                            value: department.id.toString(),
                            label: `${department.name}${department.status === 'inactive' ? ' (Inactive)' : ''}`,
                        }))}
                    />
                    <InputError message={form.errors.department_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="position_title">Position or title</Label>
                    <Input
                        id="position_title"
                        name="position_title"
                        value={form.data.position_title}
                        onChange={(event) =>
                            form.setData('position_title', event.target.value)
                        }
                        placeholder="President, Secretary, Director"
                    />
                    <InputError message={form.errors.position_title} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="password">
                        {isEditing ? 'New password' : 'Password'}
                    </Label>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={form.data.password}
                        onChange={(event) =>
                            form.setData('password', event.target.value)
                        }
                        placeholder={
                            isEditing
                                ? 'Leave blank to keep the current password'
                                : 'Temporary password'
                        }
                    />
                    <InputError message={form.errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">
                        Confirm password
                    </Label>
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        value={form.data.password_confirmation}
                        onChange={(event) =>
                            form.setData(
                                'password_confirmation',
                                event.target.value,
                            )
                        }
                        placeholder="Confirm password"
                    />
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor="district_id">Assigned district</Label>
                    <FormSelect
                        id="district_id"
                        name="district_id"
                        value={form.data.district_id}
                        onValueChange={changeDistrict}
                        placeholder="Select a district"
                        emptyLabel="No district scope"
                        options={districts.map((district) => ({
                            value: district.id.toString(),
                            label: `${district.name}${district.status === 'inactive' ? ' (Inactive)' : ''}`,
                        }))}
                    />
                    <InputError message={form.errors.district_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="section_id">Assigned section</Label>
                    <FormSelect
                        id="section_id"
                        name="section_id"
                        value={form.data.section_id}
                        onValueChange={changeSection}
                        placeholder="Select a section"
                        emptyLabel="No section scope"
                        options={filteredSections.map((section) => ({
                            value: section.id.toString(),
                            label: formatSectionOptionLabel(section),
                        }))}
                    />
                    <InputError message={form.errors.section_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="pastor_id">Assigned pastor</Label>
                    <SearchableFormSelect
                        id="pastor_id"
                        name="pastor_id"
                        value={form.data.pastor_id}
                        onValueChange={changePastor}
                        placeholder="Select a pastor"
                        emptyLabel="No pastor scope"
                        options={filteredPastors.map((pastor) => ({
                            value: pastor.id.toString(),
                            label: formatPastorOptionLabel(pastor),
                            keywords: [
                                pastor.pastor_name,
                                pastor.church_name,
                                pastor.section_name,
                                pastor.district_name,
                            ],
                        }))}
                        searchPlaceholder="Search pastor, church, or section"
                        emptySearchMessage="No pastors match your search."
                    />
                    <InputError message={form.errors.pastor_id} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-md border border-sidebar-border/70 p-4">
                    <div className="text-sm text-muted-foreground">
                        Current department
                    </div>
                    <div className="mt-2 font-medium">
                        {selectedDepartment?.name ?? 'General / no department'}
                    </div>
                </div>

                <div className="rounded-md border border-sidebar-border/70 p-4">
                    <div className="text-sm text-muted-foreground">
                        Current district
                    </div>
                    <div className="mt-2 font-medium">
                        {selectedDistrict?.name ?? 'No district assigned'}
                    </div>
                </div>

                <div className="rounded-md border border-sidebar-border/70 p-4">
                    <div className="text-sm text-muted-foreground">
                        Current section
                    </div>
                    <div className="mt-2 font-medium">
                        {selectedSection
                            ? `${selectedSection.name} · ${selectedSection.district_name}`
                            : 'No section assigned'}
                    </div>
                </div>

                <div className="rounded-md border border-sidebar-border/70 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-sm text-muted-foreground">
                            Current pastor
                        </div>
                        {isEditing && userRecord?.email_verified_at && (
                            <Badge variant="outline">Verified</Badge>
                        )}
                    </div>
                    <div className="mt-2 font-medium">
                        {selectedPastor
                            ? `${selectedPastor.church_name} · ${selectedPastor.pastor_name}`
                            : 'No pastor assigned'}
                    </div>
                </div>

                <div className="rounded-md border border-sidebar-border/70 p-4">
                    <div className="text-sm text-muted-foreground">
                        Position title
                    </div>
                    <div className="mt-2 font-medium">
                        {form.data.position_title.trim() !== ''
                            ? form.data.position_title
                            : 'No title assigned'}
                    </div>
                </div>
            </div>

            {isEditing && userRecord && (
                <div className={mutedNoticeClassName}>
                    Current saved scope: {userRecord.scope_summary}
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={UserController.index()}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {isEditing ? 'Save changes' : 'Create user'}
                </Button>
            </div>
        </form>
    );

    if (minimalLayout) {
        return formContent;
    }

    return (
        <Card className="border-sidebar-border/70">
            <CardHeader>
                <CardTitle>{isEditing ? 'Edit user' : 'User details'}</CardTitle>
                <CardDescription>
                    Assign the correct role, status, department, and hierarchy scope
                    for this account.
                </CardDescription>
            </CardHeader>
            <CardContent>{formContent}</CardContent>
        </Card>
    );
}
