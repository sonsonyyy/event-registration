import { Head } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import UserForm from './form';

type UserRecord = {
    id: number;
    name: string;
    email: string;
    role_id: number | null;
    district_id: number | null;
    section_id: number | null;
    pastor_id: number | null;
    status: string;
    scope_summary: string;
    email_verified_at: string | null;
};

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
    userRecord: UserRecord;
    roles: RoleOption[];
    districts: DistrictOption[];
    sections: SectionOption[];
    pastors: PastorOption[];
    statusOptions: StatusOption[];
};

export default function EditUser({
    userRecord,
    roles,
    districts,
    sections,
    pastors,
    statusOptions,
}: Props) {
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
            title: userRecord.name,
            href: UserController.edit(userRecord.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${userRecord.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title={`Edit ${userRecord.name}`}
                    description="Update role assignments, status, and scope without exposing self-service account changes."
                />
                <UserForm
                    userRecord={userRecord}
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
