// Components
import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    return (

        <>
            <Head title="Forgot password" />

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

            <div className="space-y-6">
                <Form {...PasswordResetLinkController.store.form()}>
                    {({ processing, errors }) => (
                                        <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-indigo-700">Live Your Books</h1>
                            <p className="mt-2 text-gray-600">Reset your password</p>
                        </div>
                        <form className="mt-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                     <Button className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={processing} data-test="email-password-reset-link-button">
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Email password reset link
                                </Button>
                            </div>
                        </form>
                        <div className="flex justify-center text-sm text-indigo-600 hover:text-indigo-500">
                            <TextLink className='text-indigo-600 hover:text-indigo-500' href={login()}>Back To Sign in</TextLink>
                        </div>
                    </div>
                </div>
                            
                        )}
                </Form>


            </div>

                        </>
    );
}
