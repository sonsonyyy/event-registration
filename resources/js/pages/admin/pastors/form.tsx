import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    formTextareaClassName,
} from '@/lib/ui-styles';

type Pastor = {
    id: number;
    pastor_name: string;
    church_name: string;
    contact_number: string | null;
    email: string | null;
    address: string | null;
    status: string;
    section: {
        id: number;
        name: string;
        district_name: string;
    };
};

type SectionOption = {
    id: number;
    name: string;
    district_name: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    pastor?: Pastor;
    sections: SectionOption[];
    statusOptions: StatusOption[];
    minimalLayout?: boolean;
};

export default function PastorForm({
    pastor,
    sections,
    statusOptions,
    minimalLayout = false,
}: Props) {
    const isEditing = pastor !== undefined;
    const form = useForm({
        section_id: pastor?.section.id.toString() ?? '',
        pastor_name: pastor?.pastor_name ?? '',
        church_name: pastor?.church_name ?? '',
        contact_number: pastor?.contact_number ?? '',
        email: pastor?.email ?? '',
        address: pastor?.address ?? '',
        status: pastor?.status ?? 'active',
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.submit(
            isEditing
                ? PastorController.update(pastor.id)
                : PastorController.store(),
            {
                preserveScroll: true,
            },
        );
    };

    const formContent = (
        <form className="space-y-6" onSubmit={submit}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                    <Label htmlFor="section_id">Section</Label>
                    <FormSelect
                        id="section_id"
                        name="section_id"
                        value={form.data.section_id}
                        onValueChange={(value) =>
                            form.setData('section_id', value)
                        }
                        placeholder="Select a section"
                        emptyLabel="Select a section"
                        options={sections.map((section) => ({
                            value: section.id.toString(),
                            label: `${section.name} · ${section.district_name}`,
                        }))}
                    />
                    <InputError message={form.errors.section_id} />
                </div>

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
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="pastor_name">Pastor name</Label>
                    <Input
                        id="pastor_name"
                        name="pastor_name"
                        value={form.data.pastor_name}
                        onChange={(event) =>
                            form.setData(
                                'pastor_name',
                                event.target.value,
                            )
                        }
                        autoFocus
                        placeholder="Pastor Jane Doe"
                    />
                    <InputError message={form.errors.pastor_name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="church_name">Church name</Label>
                    <Input
                        id="church_name"
                        name="church_name"
                        value={form.data.church_name}
                        onChange={(event) =>
                            form.setData(
                                'church_name',
                                event.target.value,
                            )
                        }
                        placeholder="Grace Community Church"
                    />
                    <InputError message={form.errors.church_name} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="contact_number">
                        Contact number (optional)
                    </Label>
                    <Input
                        id="contact_number"
                        name="contact_number"
                        value={form.data.contact_number}
                        onChange={(event) =>
                            form.setData(
                                'contact_number',
                                event.target.value,
                            )
                        }
                        placeholder="Optional church contact number"
                    />
                    <InputError message={form.errors.contact_number} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.data.email}
                        onChange={(event) =>
                            form.setData('email', event.target.value)
                        }
                        placeholder="church@example.com"
                    />
                    <InputError message={form.errors.email} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <textarea
                    id="address"
                    name="address"
                    value={form.data.address}
                    onChange={(event) =>
                        form.setData('address', event.target.value)
                    }
                    placeholder="Optional church address."
                    className={formTextareaClassName}
                />
                <InputError message={form.errors.address} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={PastorController.index()}>
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {isEditing
                        ? 'Save changes'
                        : 'Create pastor record'}
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
                <CardTitle>
                    {isEditing ? 'Edit pastor record' : 'Pastor record details'}
                </CardTitle>
                <CardDescription>
                    Each pastor record represents the local church account owner
                    used for registration.
                </CardDescription>
            </CardHeader>
            <CardContent>{formContent}</CardContent>
        </Card>
    );
}
