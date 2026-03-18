export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    role_name?: string | null;
    status?: string;
    approval_status?: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    can: {
        manageEvents: boolean;
        manageMasterData: boolean;
        viewSystemAdminMenu: boolean;
        manageOnlineRegistrations: boolean;
        manageOnsiteRegistrations: boolean;
        viewReports: boolean;
        reviewOnlineRegistrations: boolean;
        manageUsers: boolean;
        reviewRegistrantAccounts: boolean;
    };
};

export type WorkflowNotification = {
    id: string;
    type: string;
    title: string;
    message: string;
    action_url: string;
    action_label: string;
    related_type: string | null;
    related_id: number | null;
    meta: Record<string, unknown>;
    read_at: string | null;
    created_at: string | null;
};

export type NotificationCenter = {
    unread_count: number;
    recent: WorkflowNotification[];
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
