import React, { useState, useEffect } from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

const Index = ({ user: initialUser }) => {
    const [editMode, setEditMode] = useState(false);
    const [passwordEditMode, setPasswordEditMode] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const { data: profileData, setData: setProfileData, post: updateProfile, processing: profileProcessing, errors: profileErrors } = useForm({
        name: initialUser?.name || '',
        email: initialUser?.email || '',
        avatar: initialUser?.avatar || '',
    });

    const { data: passwordData, setData: setPasswordData, post: updatePassword, processing: passwordProcessing, errors: passwordErrors, reset: resetPassword } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (initialUser) {
            setProfileData({
                name: initialUser.name || '',
                email: initialUser.email || '',
                avatar: initialUser.avatar || '',
            });
        }
    }, [initialUser]);

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        updateProfile('/profile', {
            preserveScroll: true,
            onSuccess: () => {
                setSuccess('Profile updated successfully!');
                setEditMode(false);
                setTimeout(() => setSuccess(null), 3000);
            },
            onError: (errors) => {
                setError('Failed to update profile. Please check the errors.');
            },
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        updatePassword('/profile/password', {
            preserveScroll: true,
            onSuccess: () => {
                setSuccess('Password updated successfully!');
                setPasswordEditMode(false);
                resetPassword();
                setTimeout(() => setSuccess(null), 3000);
            },
            onError: (errors) => {
                setError('Failed to update password. Please check the errors.');
            },
        });
    };
    const user = initialUser || {};

    return (
        <AppLayout>
            <Head title="Profile - Live Your Books" />
            
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Manage your account information and credentials
                        </p>
                    </div>
                    <Link href="/settings/notifications">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Notification Settings
                        </Button>
                    </Link>
                </div>

                {success && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Information Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your name, email, and avatar</CardDescription>
                                </div>
                                {!editMode && (
                                    <Button
                                        onClick={() => setEditMode(true)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {editMode ? (
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="flex flex-col items-center space-y-4">
                                        {profileData.avatar ? (
                                            <img 
                                                src={profileData.avatar} 
                                                alt="Profile" 
                                                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-semibold text-gray-500 dark:text-gray-400">
                                                {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div className="w-full">
                                            <Label htmlFor="avatar">Avatar URL</Label>
                                            <Input
                                                id="avatar"
                                                type="text"
                                                value={profileData.avatar}
                                                onChange={(e) => setProfileData('avatar', e.target.value)}
                                                placeholder="https://example.com/avatar.jpg"
                                            />
                                            {profileErrors.avatar && (
                                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{profileErrors.avatar}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData('name', e.target.value)}
                                            required
                                        />
                                        {profileErrors.name && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{profileErrors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData('email', e.target.value)}
                                            required
                                        />
                                        {profileErrors.email && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{profileErrors.email}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setEditMode(false);
                                                setProfileData({
                                                    name: user.name || '',
                                                    email: user.email || '',
                                                    avatar: user.avatar || '',
                                                });
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={profileProcessing}
                                        >
                                            {profileProcessing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center">
                                        {user.avatar ? (
                                            <img 
                                                src={user.avatar} 
                                                alt="Profile" 
                                                className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-gray-200 dark:border-gray-700"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-semibold text-gray-500 dark:text-gray-400 mb-4">
                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <h3 className="text-xl font-semibold">{user.name}</h3>
                                        <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                                        {user.email_verified_at ? (
                                            <span className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Verified</span>
                                        ) : (
                                            <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Unverified</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Password Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Password</CardTitle>
                                    <CardDescription>Update your account password</CardDescription>
                                </div>
                                {!passwordEditMode && (
                                    <Button
                                        onClick={() => setPasswordEditMode(true)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Change
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {passwordEditMode ? (
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="current_password">Current Password</Label>
                                        <Input
                                            id="current_password"
                                            type="password"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData('current_password', e.target.value)}
                                            required
                                        />
                                        {passwordErrors.current_password && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{passwordErrors.current_password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={passwordData.password}
                                            onChange={(e) => setPasswordData('password', e.target.value)}
                                            required
                                        />
                                        {passwordErrors.password && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{passwordErrors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={passwordData.password_confirmation}
                                            onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                            required
                                        />
                                        {passwordErrors.password_confirmation && (
                                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{passwordErrors.password_confirmation}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setPasswordEditMode(false);
                                                resetPassword();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={passwordProcessing}
                                        >
                                            {passwordProcessing ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Your password is encrypted and secure. Click "Change" to update it.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Account Stats */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Account Statistics</CardTitle>
                        <CardDescription>Your activity overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{user.streak || 0}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{user.books_uploaded || 0}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Books Uploaded</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user.habits_completed || 0}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Habits Completed</div>
                            </div>
                        </div>
                        {user.created_at && (
                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                                Member since: {user.created_at}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

export default Index;