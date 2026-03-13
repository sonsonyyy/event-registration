import Heading from '@/components/heading';

export default function DeleteUser() {
    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Delete account"
                description="Account deletion is restricted to administrators."
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Disabled</p>
                    <p className="text-sm">
                        Account deletion is only allowed from the future admin
                        user management page. Contact an administrator if this
                        account should be removed.
                    </p>
                </div>
            </div>
        </div>
    );
}
