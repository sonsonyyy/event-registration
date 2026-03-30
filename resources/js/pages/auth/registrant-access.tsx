import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import RegistrantAccessController from '@/actions/App/Http/Controllers/RegistrantAccessController';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import SearchableFormSelect from '@/components/searchable-form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { createClearFormErrorHandlers } from '@/lib/form-errors';
import {
    formControlClassName,
    warningNoticeClassName,
} from '@/lib/ui-styles';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';

type SectionOption = {
    id: number;
    name: string;
    description: string | null;
    district_id: number; // will be hidden in the UI but included here for ease of access when building the options
    district_name: string | null; // will be hidden in the UI but included here for ease of access when building the options
};

type PastorOption = {
    id: number;
    pastor_name: string;
    church_name: string;
    section_id: number;
    section_name: string | null;
    district_id: number;
    district_name: string | null;
};

type Props = {
    sections: SectionOption[];
    pastors: PastorOption[];
};

type RegistrantAccessFormData = {
    name: string;
    email: string;
    section_id: string;
    pastor_id: string;
    password: string;
    password_confirmation: string;
};

export default function RegistrantAccess({
    sections,
    pastors,
}: Props) {
    const form = useForm<RegistrantAccessFormData>({
        name: '',
        email: '',
        section_id: '',
        pastor_id: '',
        password: '',
        password_confirmation: '',
    });

    const filteredPastors = form.data.section_id
        ? pastors.filter(
              (pastor) =>
                  pastor.section_id.toString() === form.data.section_id,
          )
        : pastors;
    const selectedPastor =
        pastors.find((pastor) => pastor.id.toString() === form.data.pastor_id) ??
        null;

    const changeSection = (value: string): void => {
        const matchingPastor = pastors.find(
            (pastor) =>
                pastor.id.toString() === form.data.pastor_id &&
                pastor.section_id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            section_id: value,
            pastor_id: matchingPastor?.id.toString() ?? '',
        }));
    };

    const changePastor = (value: string): void => {
        const pastor = pastors.find((option) => option.id.toString() === value);

        form.setData((currentData) => ({
            ...currentData,
            section_id: pastor?.section_id.toString() ?? currentData.section_id,
            pastor_id: value,
        }));
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.submit(RegistrantAccessController.store(), {
            preserveScroll: true,
        });
    };

    const clearFormErrorHandlers = createClearFormErrorHandlers(form.clearErrors);

    return (
        <AuthLayout
            title="Request a registrant account"
            description="Church representatives can request online registration access here. Each church may have up to two registrant accounts, and approval is still required before registration tools are unlocked."
            singleCard
        >
            <Head title="Request Registrant Access">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=manrope:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <form
                className="space-y-6"
                onSubmit={submit}
                {...clearFormErrorHandlers}
            >
                <div className="space-y-6">
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
                            placeholder="Firstname Lastname"
                            className={formControlClassName}
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
                            placeholder="representative@example.com"
                            className={formControlClassName}
                        />
                        <InputError message={form.errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="section_id">Section</Label>
                        <FormSelect
                            id="section_id"
                            name="section_id"
                            value={form.data.section_id}
                            onValueChange={changeSection}
                            placeholder="Select section"
                            emptyLabel="Select section"
                            options={sections.map((section) => ({
                                value: section.id.toString(),
                                label: section.description
                                    ? `${section.name} (${section.description ?? 'No description'})`
                                    : section.name,
                            }))}
                        />
                        <InputError message={form.errors.section_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="pastor_id">Pastor</Label>
                        <SearchableFormSelect
                            id="pastor_id"
                            name="pastor_id"
                            value={form.data.pastor_id}
                            onValueChange={changePastor}
                            placeholder="Select pastor"
                            options={filteredPastors.map((pastor) => ({
                                value: pastor.id.toString(),
                                label: pastor.pastor_name,
                                keywords: [
                                    pastor.pastor_name,
                                    pastor.church_name,
                                    pastor.section_name ?? '',
                                    pastor.district_name ?? '',
                                ],
                            }))}
                            disabled={filteredPastors.length === 0}
                            searchPlaceholder="Search pastor or church"
                            emptySearchMessage="No pastors match your search."
                        />
                        <InputError message={form.errors.pastor_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="church_name">Church</Label>
                        <Input
                            id="church_name"
                            value={selectedPastor?.church_name ?? ''}
                            readOnly
                            placeholder="Select a pastor to load the church"
                            className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Desired password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                            placeholder="Password"
                            className={formControlClassName}
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
                            className={formControlClassName}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600">
                        Already have an approved account?{' '}
                        <Link
                            href={login()}
                            className="font-semibold text-[#184d47] hover:text-[#143f3a]"
                        >
                            Log in here
                        </Link>
                    </p>
                    <Button
                        type="submit"
                        className="px-6"
                        disabled={form.processing || pastors.length === 0}
                    >
                        {form.processing && <Spinner />}
                        Submit account request
                    </Button>
                </div>

                {pastors.length === 0 && (
                    <div className={warningNoticeClassName}>
                        No church accounts are currently available for additional self-service signup. Contact your administrator if your church still needs registrant access.
                    </div>
                )}
            </form>
        </AuthLayout>
    );
}
