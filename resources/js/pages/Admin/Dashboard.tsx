import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Activity, BookOpen, CircleCheck, ShieldCheck, Users } from 'lucide-react';
import { type ReactNode } from 'react';

// deduped imports and removed duplicate component above

interface DashboardProps {
    stats: {
        users: {
            total: number;
            active: number;
            inactive: number;
            admins: number;
        };
        content: {
            books: number;
            catalog_entries: number;
        };
    };
    recentUsers: Array<{
        id: number;
        name: string;
        email: string;
        role: string;
        is_active: boolean;
        created_at: string;
    }>;
}

export default function AdminDashboard({ stats, recentUsers }: DashboardProps) {
    return (
        <>
            <Head title="Admin Overview" />
            <div className="space-y-8">
                <section>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Platform Health</h1>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard icon={<Users className="size-5" />} label="Total Users" value={stats.users.total} />
                        <StatCard icon={<CircleCheck className="size-5 text-emerald-500" />} label="Active Users" value={stats.users.active} />
                        <StatCard icon={<ShieldCheck className="size-5 text-blue-500" />} label="Admins" value={stats.users.admins} />
                        <StatCard icon={<Activity className="size-5 text-amber-500" />} label="Inactive Users" value={stats.users.inactive} />
                        <StatCard icon={<BookOpen className="size-5 text-indigo-500" />} label="User Books" value={stats.content.books} />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Signups</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Latest users joining the platform</p>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentUsers.length === 0 && (
                            <p className="px-6 py-8 text-sm text-slate-500">No recent users found.</p>
                        )}
                        {recentUsers.map((user) => (
                            <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                                        {user.role}
                                    </span>
                                    <p className="mt-2 text-xs text-slate-400">
                                        {user.is_active ? 'Active' : 'Inactive'} · {new Date(user.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

AdminDashboard.layout = (page: ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-slate-600">{icon}</div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
                </div>
            </div>
        </div>
    );
}

