import { Head } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import UserForm from './form';

type RoleOption = {
    id: number;
    name: string;
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
    roles: RoleOption[];
    districts: DistrictOption[];
    sections: SectionOption[];
    pastors: PastorOption[];
    statusOptions: StatusOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Users',
        href: UserController.index(),
    },
    {
        title: 'Create user',
        href: UserController.create(),
    },
];

export default function CreateUser({
    roles,
    districts,
    sections,
    pastors,
    statusOptions,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Create user"
                    description="Create system accounts and assign the correct role and operational scope."
                />
                <UserForm
                    minimalLayout
                    roles={roles}
                    districts={districts}
                    sections={sections}
                    pastors={pastors}
                    statusOptions={statusOptions}
                />
            </div>
        </AppLayout>
    );
}
