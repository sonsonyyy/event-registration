import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    children,
    title,
    description,
    singleCard = false,
    centerContent = false,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
    singleCard?: boolean;
    centerContent?: boolean;
}) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            singleCard={singleCard}
            centerContent={centerContent}
            {...props}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
