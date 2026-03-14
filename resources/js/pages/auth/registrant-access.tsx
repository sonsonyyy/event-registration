import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import RegistrantAccessController from '@/actions/App/Http/Controllers/RegistrantAccessController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';

type DistrictOption = {
    id: number;
    name: string;
};

type SectionOption = {
    id: number;
    name: string;
    district_id: number;
    district_name: string | null;
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
    districts: DistrictOption[];
    sections: SectionOption[];
    pastors: PastorOption[];
};

type RegistrantAccessFormData = {
    name: string;
    email: string;
    district_id: string;
    section_id: string;
    pastor_id: string;
    password: string;
    password_confirmation: string;
};

export default function RegistrantAccess({
    districts,
    sections,
    pastors,
}: Props) {
    const form = useForm<RegistrantAccessFormData>({
        name: '',
        email: '',
        district_id: '',
        section_id: '',
        pastor_id: '',
        password: '',
        password_confirmation: '',
    });

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
    const selectedPastor =
        pastors.find((pastor) => pastor.id.toString() === form.data.pastor_id) ??
        null;

    const changeDistrict = (value: string): void => {
        const matchingSection = sections.find(
            (section) =>
                section.id.toString() === form.data.section_id &&
                section.district_id.toString() === value,
        );
        const matchingPastor = pastors.find(
            (pastor) =>
                pastor.id.toString() === form.data.pastor_id &&
                pastor.district_id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id: value,
            section_id: matchingSection?.id.toString() ?? '',
            pastor_id: matchingPastor?.id.toString() ?? '',
        }));
    };

    const changeSection = (value: string): void => {
        const section = sections.find(
            (option) => option.id.toString() === value,
        );
        const matchingPastor = pastors.find(
            (pastor) =>
                pastor.id.toString() === form.data.pastor_id &&
                pastor.section_id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id: section?.district_id.toString() ?? currentData.district_id,
            section_id: value,
            pastor_id: matchingPastor?.id.toString() ?? '',
        }));
    };

    const changePastor = (value: string): void => {
        const pastor = pastors.find((option) => option.id.toString() === value);

        form.setData((currentData) => ({
            ...currentData,
            district_id: pastor?.district_id.toString() ?? currentData.district_id,
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

    return (
        <AuthLayout
            title="Request a registrant account"
            description="Church representatives can request their own online registration access here. Approval is still required before online registration is unlocked."
        >
            <Head title="Request Registrant Access">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=manrope:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <form className="space-y-6" onSubmit={submit}>
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
                            className="h-11 rounded-xl"
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
                            className="h-11 rounded-xl"
                        />
                        <InputError message={form.errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="district_id">District</Label>
                        <select
                            id="district_id"
                            name="district_id"
                            value={form.data.district_id}
                            onChange={(event) =>
                                changeDistrict(event.target.value)
                            }
                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 rounded-xl border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                        >
                            <option value="">Select district</option>
                            {districts.map((district) => (
                                <option key={district.id} value={district.id}>
                                    {district.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.district_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="section_id">Section</Label>
                        <select
                            id="section_id"
                            name="section_id"
                            value={form.data.section_id}
                            onChange={(event) =>
                                changeSection(event.target.value)
                            }
                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 rounded-xl border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                        >
                            <option value="">Select section</option>
                            {filteredSections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.section_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="pastor_id">Pastor</Label>
                        <select
                            id="pastor_id"
                            name="pastor_id"
                            value={form.data.pastor_id}
                            onChange={(event) =>
                                changePastor(event.target.value)
                            }
                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-11 rounded-xl border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                        >
                            <option value="">Select pastor</option>
                            {filteredPastors.map((pastor) => (
                                <option key={pastor.id} value={pastor.id}>
                                    {pastor.pastor_name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.pastor_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="church_name">Church</Label>
                        <Input
                            id="church_name"
                            value={selectedPastor?.church_name ?? ''}
                            readOnly
                            placeholder="Select a pastor to load the church"
                            className="h-11 rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
                            className="h-11 rounded-xl"
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
                            className="h-11 rounded-xl"
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
                        className="h-11 rounded-xl bg-[#184d47] px-6 text-white hover:bg-[#143f3a]"
                        disabled={form.processing || pastors.length === 0}
                    >
                        {form.processing && <Spinner />}
                        Submit account request
                    </Button>
                </div>

                {pastors.length === 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                        No church accounts are currently available for self-service signup. Contact the district admin if your church still needs a registrant account.
                    </div>
                )}
            </form>
        </AuthLayout>
    );
}
