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
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    can: {
        manageEvents: boolean;
        manageMasterData: boolean;
        manageOnsiteRegistrations: boolean;
    };
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
