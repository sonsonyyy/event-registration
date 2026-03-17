import { Form, Head, usePage } from '@inertiajs/react';
import { InfoIcon } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formControlClassName } from '@/lib/ui-styles';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';

const registrantAccessSubmittedStatus = 'registrant-access-submitted';

export default function Login() {
    const { status } = usePage().props as { status?: string | null };

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your assigned credentials to access the registration workspace."
        >
            <Head title="Log in">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=manrope:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {status === registrantAccessSubmittedStatus && (
                                <Alert className="border-sky-200 bg-sky-50/80 text-sky-950 [&>svg]:text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-50 dark:[&>svg]:text-sky-300">
                                    <InfoIcon />
                                    <AlertTitle>
                                        Request submitted
                                    </AlertTitle>
                                    <AlertDescription className="text-sky-800 dark:text-sky-100">
                                        <p>
                                            You can sign in now,
                                            but online registration stays locked until your church account is approved.
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className={formControlClassName}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className={formControlClassName}
                                />
                                <InputError message={errors.password} />
                            </div>
                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={3}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
