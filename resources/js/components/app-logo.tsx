import { usePage } from '@inertiajs/react';

export default function AppLogo({
    showNameOnMobile = false,
}: {
    showNameOnMobile?: boolean;
}) {
    const { name } = usePage().props;
    const displayClassName = showNameOnMobile ? 'grid' : 'grid sm:grid';

    return (
        <div className={`flex-1 text-left text-sm ${displayClassName}`}>
            <span className="mb-0.5 truncate leading-tight font-semibold">
                {name}
            </span>
        </div>
    );
}
