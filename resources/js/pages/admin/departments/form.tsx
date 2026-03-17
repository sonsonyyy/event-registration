import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { createClearFormErrorHandlers } from '@/lib/form-errors';
import { formTextareaClassName } from '@/lib/ui-styles';

type Department = {
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
    department?: Department;
    statusOptions: StatusOption[];
    minimalLayout?: boolean;
};

export default function DepartmentForm({
    department,
    statusOptions,
    minimalLayout = false,
}: Props) {
    const isEditing = department !== undefined;
    const form = useForm({
        name: department?.name ?? '',
        description: department?.description ?? '',
        status: department?.status ?? 'active',
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.submit(
            isEditing
                ? DepartmentController.update(department.id)
                : DepartmentController.store(),
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
                    <Label htmlFor="name">Department name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        autoFocus
                        placeholder="Youth Ministries"
                    />
                    <InputError message={form.errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <FormSelect
                        id="status"
                        name="status"
                        value={form.data.status}
                        onValueChange={(value) => form.setData('status', value)}
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
                    onChange={(event) => form.setData('description', event.target.value)}
                    placeholder="Optional notes about the department coverage, officers, or event ownership."
                    className={formTextareaClassName}
                />
                <InputError message={form.errors.description} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={DepartmentController.index()}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {isEditing ? 'Save changes' : 'Create department'}
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
                    {isEditing ? 'Edit department' : 'Department details'}
                </CardTitle>
                <CardDescription>
                    Keep department records consistent before assigning them to users and events.
                </CardDescription>
            </CardHeader>
            <CardContent>{formContent}</CardContent>
        </Card>
    );
}
