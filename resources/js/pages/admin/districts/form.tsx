import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
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

type District = {
    id: number;
    name: string;
    description: string | null;
    status: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    district?: District;
    statusOptions: StatusOption[];
    minimalLayout?: boolean;
};

export default function DistrictForm({
    district,
    statusOptions,
    minimalLayout = false,
}: Props) {
    const isEditing = district !== undefined;
    const form = useForm({
        name: district?.name ?? '',
        description: district?.description ?? '',
        status: district?.status ?? 'active',
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.submit(
            isEditing
                ? DistrictController.update(district.id)
                : DistrictController.store(),
            {
                preserveScroll: true,
            },
        );
    };

    const formContent = (
        <form className="space-y-6" onSubmit={submit}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid gap-2">
                    <Label htmlFor="name">District name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        autoFocus
                        placeholder="North District"
                    />
                    <InputError message={form.errors.name} />
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
                    placeholder="Optional district notes for the admin team."
                    className={formTextareaClassName}
                />
                <InputError message={form.errors.description} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={DistrictController.index()}>
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {isEditing ? 'Save changes' : 'Create district'}
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
                    {isEditing ? 'Edit district' : 'District details'}
                </CardTitle>
                <CardDescription>
                    Keep district records clean so sections and pastors can be
                    assigned correctly.
                </CardDescription>
            </CardHeader>
            <CardContent>{formContent}</CardContent>
        </Card>
    );
}
