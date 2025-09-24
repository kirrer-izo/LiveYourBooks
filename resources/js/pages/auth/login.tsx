import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <>
            <Head title="Log in" />

            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                    <Head title="Log in" />
                    
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-indigo-700">Live Your Books</h1>
                        <p className="mt-2 text-gray-600">Sign in to your account</p>
                    </div>

                    <Form {...AuthenticatedSessionController.store.form()} resetOnSuccess={['password']} className="space-y-6">
                        {({ processing, errors }) => (
                            <>
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
                                        {errors.email && <InputError message={errors.email} className="mt-1" />}
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.password && <InputError message={errors.password} className="mt-1" />}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember"
                                            name="remember"
                                            type="checkbox"
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor="remember" className="block ml-2 text-sm text-gray-700">Remember me</label>
                                    </div>
                                    {canResetPassword && (
                                        <TextLink href={request()} className="text-sm" tabIndex={5}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                
                                <div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        Sign in
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>

                    <div className="text-center text-sm">
                        Don't have an account?{' '}
                        <TextLink href={register()} className="text-indigo-600 hover:text-indigo-500">
                            Sign up
                        </TextLink>
                    </div>

                    {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
                </div>
            </div>
        </>
    );
}