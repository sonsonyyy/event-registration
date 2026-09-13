import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    subtitle = null,
}: {
    user: User;
    showEmail?: boolean;
    subtitle?: string | null;
}) {
    const getInitials = useInitials();
    const secondaryText = subtitle ?? (showEmail ? user.email : null);

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-[#184d47] font-semibold text-white dark:bg-emerald-500/20 dark:text-emerald-100">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {secondaryText && (
                    <span className="truncate text-xs text-muted-foreground">
                        {secondaryText}
                    </span>
                )}
            </div>
        </>
    );
}
