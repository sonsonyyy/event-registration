import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { createClearFormErrorHandlers } from '@/lib/form-errors';
import {
    formTextareaClassName,
} from '@/lib/ui-styles';

type Section = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    district: {
        id: number;
        name: string;
    };
};

type DistrictOption = {
    id: number;
    name: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    section?: Section;
    districts: DistrictOption[];
    statusOptions: StatusOption[];
    minimalLayout?: boolean;
};

export default function SectionForm({
    section,
    districts,
    statusOptions,
    minimalLayout = false,
}: Props) {
    const isEditing = section !== undefined;
    const form = useForm({
        district_id: section?.district.id.toString() ?? '',
        name: section?.name ?? '',
        description: section?.description ?? '',
        status: section?.status ?? 'active',
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.submit(
            isEditing
                ? SectionController.update(section.id)
                : SectionController.store(),
            {
                preserveScroll: true,
            },
        );
    };

    const clearFormErrorHandlers = createClearFormErrorHandlers(form.clearErrors);

    const formContent = (
        <form className="space-y-6" onSubmit={submit} {...clearFormErrorHandlers}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                    <Label htmlFor="district_id">District</Label>
                    <FormSelect
                        id="district_id"
                        name="district_id"
                        value={form.data.district_id}
                        onValueChange={(value) =>
                            form.setData('district_id', value)
                        }
                        placeholder="Select a district"
                        emptyLabel="Select a district"
                        options={districts.map((district) => ({
                            value: district.id.toString(),
                            label: district.name,
                        }))}
                    />
                    <InputError message={form.errors.district_id} />
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

            <div className="grid gap-2">
                <Label htmlFor="name">Section name</Label>
                <Input
                    id="name"
                    name="name"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                    autoFocus
                    placeholder="Central Section"
                />
                <InputError message={form.errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                    id="description"
                    name="description"
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData(
                            'description',
                            event.target.value,
                        )
                    }
                    placeholder="Optional notes for the section record."
                    className={formTextareaClassName}
                />
                <InputError message={form.errors.description} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={SectionController.index()}>
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {isEditing ? 'Save changes' : 'Create section'}
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
                    {isEditing ? 'Edit section' : 'Section details'}
                </CardTitle>
                <CardDescription>
                    Assign each section to the correct district before pastors
                    are linked to it.
                </CardDescription>
            </CardHeader>
            <CardContent>{formContent}</CardContent>
        </Card>
    );
}
