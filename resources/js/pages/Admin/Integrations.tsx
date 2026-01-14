import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';

type Integration = {
    id: number;
    service: string;
    display_name: string;
    is_active: boolean;
    status?: string | null;
    notes?: string | null;
    last_checked_at?: string | null;
    settings?: Record<string, unknown>;
};

type IntegrationsProps = {
    integrations: Integration[];
};

function formatDateTime(value?: string | null) {
    if (!value) return 'Never';
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function AdminIntegrations({ integrations = [] }: IntegrationsProps) {
    const {
        data,
        setData,
        post,
        processing,
        reset,
        errors: createErrors,
    } = useForm({
        service: '',
        display_name: '',
        status: '',
        notes: '',
        is_active: true,
        last_checked_at: '',
        settingsJson: '',
    });

    const [jsonError, setJsonError] = React.useState<string | null>(null);

    const [editingIntegration, setEditingIntegration] = React.useState<Integration | null>(null);
    const editForm = useForm({
        service: '',
        display_name: '',
        status: '',
        notes: '',
        is_active: true,
        last_checked_at: '',
        settingsJson: '',
    });
    const [editJsonError, setEditJsonError] = React.useState<string | null>(null);

    const toSettingsPayload = (json: string) => {
        const trimmed = json.trim();
        if (trimmed === '') {
            return null;
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                throw new Error('Settings must be an object of key/value pairs.');
            }
            return parsed as Record<string, unknown>;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Invalid JSON supplied.';
            throw new Error(msg);
        }
    };

    const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const settings = toSettingsPayload(data.settingsJson);
            setJsonError(null);
            post('/admin/integrations', {
                preserveScroll: true,
                data: {
                    service: data.service,
                    display_name: data.display_name,
                    status: data.status || null,
                    notes: data.notes || null,
                    is_active: data.is_active,
                    last_checked_at: data.last_checked_at || null,
                    settings,
                },
                onSuccess: () => {
                    reset();
                },
            });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'An error occurred';
            setJsonError(msg);
        }
    };

    const startEditing = (integration: Integration) => {
        setEditingIntegration(integration);
        editForm.setData({
            service: integration.service,
            display_name: integration.display_name,
            status: integration.status ?? '',
            notes: integration.notes ?? '',
            is_active: integration.is_active,
            last_checked_at: integration.last_checked_at
                ? new Date(integration.last_checked_at).toISOString().slice(0, 16)
                : '',
            settingsJson: JSON.stringify(integration.settings ?? {}, null, 2),
        });
        setEditJsonError(null);
    };

    const cancelEditing = () => {
        setEditingIntegration(null);
        editForm.reset();
    };

    const submitEdit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingIntegration) return;

        try {
            const settings = toSettingsPayload(editForm.data.settingsJson);
            setEditJsonError(null);
            router.put(
                `/admin/integrations/${editingIntegration.id}`,
                {
                    service: editForm.data.service,
                    display_name: editForm.data.display_name,
                    status: editForm.data.status || null,
                    notes: editForm.data.notes || null,
                    is_active: editForm.data.is_active,
                    last_checked_at: editForm.data.last_checked_at || null,
                    settings,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        cancelEditing();
                    },
                },
            );
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'An error occurred';
            setEditJsonError(msg);
        }
    };

    const toggleActive = (integration: Integration) => {
        router.put(
            `/admin/integrations/${integration.id}`,
            {
                service: integration.service,
                display_name: integration.display_name,
                status: integration.status ?? null,
                notes: integration.notes ?? null,
                is_active: !integration.is_active,
                last_checked_at: integration.last_checked_at ?? null,
                settings: integration.settings ?? null,
            },
            { preserveScroll: true },
        );
    };

    const deleteIntegration = (integration: Integration) => {
        if (!window.confirm(`Remove integration "${integration.display_name}"?`)) {
            return;
        }

        router.delete(`/admin/integrations/${integration.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Integrations" />
            <div className="space-y-8">
                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Add Integration</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Track API keys, status, and notes for connected services such as AI models or analytics tools.
                    </p>

                    <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submitCreate}>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Service ID</label>
                            <input
                                type="text"
                                value={data.service}
                                onChange={(event) => setData('service', event.target.value)}
                                required
                                placeholder="e.g. openai"
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            {createErrors.service && <p className="mt-1 text-sm text-rose-500">{createErrors.service}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Display Name</label>
                            <input
                                type="text"
                                value={data.display_name}
                                onChange={(event) => setData('display_name', event.target.value)}
                                required
                                placeholder="OpenAI API"
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            {createErrors.display_name && (
                                <p className="mt-1 text-sm text-rose-500">{createErrors.display_name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
                            <input
                                type="text"
                                value={data.status}
                                onChange={(event) => setData('status', event.target.value)}
                                placeholder="operational, degraded..."
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Last Checked</label>
                            <input
                                type="datetime-local"
                                value={data.last_checked_at}
                                onChange={(event) => setData('last_checked_at', event.target.value)}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                                Notes (internal)
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                rows={2}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                                Settings (JSON)
                            </label>
                            <textarea
                                value={data.settingsJson}
                                onChange={(event) => setData('settingsJson', event.target.value)}
                                rows={4}
                                placeholder='{"api_key": "sk-...", "model": "gpt-4"}'
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                            {jsonError && <p className="mt-1 text-sm text-rose-500">{jsonError}</p>}
                        </div>

                        <div className="md:col-span-2 flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(event) => setData('is_active', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Active
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
                            >
                                Save Integration
                            </button>
                        </div>
                    </form>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Connected Services</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Toggle availability, update credentials, and monitor status.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {integrations.length === 0 && (
                            <div className="rounded border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                No integrations configured. Add connections above to support AI and automation modules.
                            </div>
                        )}
                        {integrations.map((integration) => (
                            <div
                                key={integration.id}
                                className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 transition hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500 md:flex-row md:items-start md:justify-between"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{integration.display_name}</h3>
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        {integration.service}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        {integration.status ?? 'No status reported'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Last checked: {formatDateTime(integration.last_checked_at)}
                                    </p>
                                    {integration.notes && (
                                        <p className="mt-2 rounded bg-slate-100 p-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {integration.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleActive(integration)}
                                        className={`rounded-md border px-3 py-1 text-xs font-medium transition ${integration.is_active
                                            ? 'border-emerald-400 bg-emerald-400/20 text-emerald-700 hover:bg-emerald-400/30 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-500/20'
                                            : 'border-slate-300 text-slate-600 hover:border-emerald-400 hover:text-emerald-500 dark:border-slate-600 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-300'
                                            }`}
                                    >
                                        {integration.is_active ? 'Disable' : 'Activate'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startEditing(integration)}
                                        className="rounded-md border border-indigo-400 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteIntegration(integration)}
                                        className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/20"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {editingIntegration && (
                    <section className="rounded-lg border border-indigo-300 bg-white p-6 shadow-sm dark:border-indigo-600 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    Edit Integration — {editingIntegration.display_name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Update credentials and operational metadata.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                        </div>

                        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submitEdit}>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Service ID</label>
                                <input
                                    type="text"
                                    value={editForm.data.service}
                                    onChange={(event) => editForm.setData('service', event.target.value)}
                                    required
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Display Name</label>
                                <input
                                    type="text"
                                    value={editForm.data.display_name}
                                    onChange={(event) => editForm.setData('display_name', event.target.value)}
                                    required
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
                                <input
                                    type="text"
                                    value={editForm.data.status}
                                    onChange={(event) => editForm.setData('status', event.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Last Checked</label>
                                <input
                                    type="datetime-local"
                                    value={editForm.data.last_checked_at}
                                    onChange={(event) => editForm.setData('last_checked_at', event.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Notes
                                </label>
                                <textarea
                                    rows={2}
                                    value={editForm.data.notes}
                                    onChange={(event) => editForm.setData('notes', event.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Settings (JSON)
                                </label>
                                <textarea
                                    rows={4}
                                    value={editForm.data.settingsJson}
                                    onChange={(event) => editForm.setData('settingsJson', event.target.value)}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                                {editJsonError && <p className="mt-1 text-sm text-rose-500">{editJsonError}</p>}
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={editForm.data.is_active}
                                        onChange={(event) => editForm.setData('is_active', event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Active
                                </label>
                            </div>

                            <div className="md:col-span-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
                                >
                                    Update Integration
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </div>
        </>
    );
}

AdminIntegrations.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default AdminIntegrations;

