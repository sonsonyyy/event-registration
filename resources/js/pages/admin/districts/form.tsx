import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

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
};

const textareaClassName =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

export default function DistrictForm({ district, statusOptions }: Props) {
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
            <CardContent>
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
                            <select
                                id="status"
                                name="status"
                                value={form.data.status}
                                onChange={(event) =>
                                    form.setData('status', event.target.value)
                                }
                                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            >
                                {statusOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
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
                            className={textareaClassName}
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
            </CardContent>
        </Card>
    );
}
