import AppLayout from '@/layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { BadgeCheck, CircleOff, Mail, Search, UserCog } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

type RoleOption = {
    value: string;
    label: string;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label?: string;
    is_active: boolean;
    created_at?: string;
};

type PaginatedUsers = {
    data: UserRow[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};

// Deduplicated older implementation above; keeping the one below.

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface UserListItem {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

interface UsersPageProps {
    users: {
        data: UserListItem[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        status?: string;
        role?: string;
    };
    roles: Array<{ value: string; label: string }>;
}

function AdminUsers({ users, filters, roles }: UsersPageProps) {
    const [searchValue, setSearchValue] = useState(filters.search ?? '');
    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        role: roles?.[0]?.value ?? 'user',
        is_active: true as boolean | undefined,
    });

    const [editing, setEditing] = useState<UserListItem | null>(null);
    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        role: roles?.[0]?.value ?? 'user',
        is_active: true as boolean | undefined,
    });

    useEffect(() => {
        setSearchValue(filters.search ?? '');
    }, [filters.search]);

    const updateFilters = (name: string, value: string) => {
        router.get(
            '/admin/users',
            {
                ...filters,
                [name]: value || undefined,
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            }
        );
    };

    const handleRoleChange = (userId: number, role: string) => {
        router.put(
            `/admin/users/${userId}`,
            { role },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const handleActivationChange = (userId: number, isActive: boolean) => {
        router.put(
            `/admin/users/${userId}`,
            { is_active: isActive },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const openEdit = (user: UserListItem) => {
        setEditing(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            is_active: user.is_active,
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.put(`/admin/users/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    return (
        <>
            <Head title="Manage Users" />
            <div className="space-y-6">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">User Directory</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Promote, deactivate, and oversee members across the platform.</p>
                    </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit User</h3>
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Close
                            </button>
                        </div>
                        <form onSubmit={submitEdit} className="px-6 py-4 grid gap-4">
                            <label className="text-sm">
                                <span className="block text-slate-600 dark:text-slate-300">Name</span>
                                <input
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                                {editForm.errors.name && <span className="text-xs text-rose-500">{editForm.errors.name}</span>}
                            </label>
                            <label className="text-sm">
                                <span className="block text-slate-600 dark:text-slate-300">Email</span>
                                <input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                                {editForm.errors.email && <span className="text-xs text-rose-500">{editForm.errors.email}</span>}
                            </label>
                            <label className="text-sm">
                                <span className="block text-slate-600 dark:text-slate-300">Password (leave blank to keep)</span>
                                <input
                                    type="password"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                                {editForm.errors.password && <span className="text-xs text-rose-500">{editForm.errors.password}</span>}
                            </label>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="text-sm">
                                    <span className="block text-slate-600 dark:text-slate-300">Role</span>
                                    <select
                                        value={editForm.data.role}
                                        onChange={(e) => editForm.setData('role', e.target.value)}
                                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        {roles.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm mt-6 md:mt-0 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={!!editForm.data.is_active}
                                        onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                    />
                                    <span className="text-slate-600 dark:text-slate-300">Active</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
                </header>

                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick Create User</h2>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            createForm.post('/admin/users', {
                                preserveScroll: true,
                                onSuccess: () => createForm.reset('name', 'email', 'password'),
                            });
                        }}
                        className="px-6 py-4 grid gap-4"
                    >
                        <label className="text-sm">
                            <span className="block text-slate-600 dark:text-slate-300">Name</span>
                            <input
                                required
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            {createForm.errors.name && <span className="text-xs text-rose-500">{createForm.errors.name}</span>}
                        </label>
                        <label className="text-sm">
                            <span className="block text-slate-600 dark:text-slate-300">Email</span>
                            <input
                                type="email"
                                required
                                value={createForm.data.email}
                                onChange={(e) => createForm.setData('email', e.target.value)}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            {createForm.errors.email && <span className="text-xs text-rose-500">{createForm.errors.email}</span>}
                        </label>
                        <label className="text-sm">
                            <span className="block text-slate-600 dark:text-slate-300">Password</span>
                            <input
                                type="password"
                                required
                                value={createForm.data.password}
                                onChange={(e) => createForm.setData('password', e.target.value)}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            {createForm.errors.password && <span className="text-xs text-rose-500">{createForm.errors.password}</span>}
                        </label>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="text-sm">
                                <span className="block text-slate-600 dark:text-slate-300">Role</span>
                                <select
                                    value={createForm.data.role}
                                    onChange={(e) => createForm.setData('role', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                >
                                    {roles.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sm mt-6 md:mt-0 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!createForm.data.is_active}
                                    onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                />
                                <span className="text-slate-600 dark:text-slate-300">Active</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => createForm.reset('name', 'email', 'password')}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                            >
                                Create User
                            </button>
                        </div>
                    </form>
                </section>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="grid gap-3 lg:grid-cols-4">
                            <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2">
                                <Search className="size-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchValue}
                                    placeholder="Search users..."
                                    className="flex-1 bg-transparent text-sm focus:outline-none"
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    onBlur={() => updateFilters('search', searchValue)}
                                />
                            </label>

                            <select
                                defaultValue={filters.status ?? ''}
                                onChange={(event) => updateFilters('status', event.target.value)}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                            >
                                <option value="">Status: All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <select
                                defaultValue={filters.role ?? ''}
                                onChange={(event) => updateFilters('role', event.target.value)}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                            >
                                <option value="">Role: All</option>
                                {roles.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => {
                                    setSearchValue('');
                                    router.get('/admin/users', {}, { preserveState: false, replace: true, preserveScroll: true });
                                }}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">User</th>
                                    <th className="px-6 py-3 font-semibold">Role</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                    <th className="px-6 py-3 font-semibold">Joined</th>
                                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                            No users match your filters.
                                        </td>
                                    </tr>
                                )}
                                {users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                                                    <Mail className="size-3" /> {user.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(event) => handleRoleChange(user.id, event.target.value)}
                                                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                                            >
                                                {roles.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    user.is_active
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                                }`}
                                            >
                                                {user.is_active ? (
                                                    <>
                                                        <BadgeCheck className="size-3" /> Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <CircleOff className="size-3" /> Inactive
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(user)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleActivationChange(user.id, !user.is_active)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <UserCog className="size-3" />
                                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Showing {users.data.length} {users.data.length === 1 ? 'user' : 'users'}
                        </div>
                        <div className="flex items-center gap-2">
                            {users.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    className={`px-3 py-1 rounded-md text-xs ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                            ? 'bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            : 'text-slate-400 cursor-not-allowed'
                                    }`}
                                    onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
}

export default Object.assign(AdminUsers, {
    layout: (page: ReactNode) => <AppLayout>{page}</AppLayout>,
});
