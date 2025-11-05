import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '../../components/input-error';

const Edit = ({ habit, books = [] }) => {
    const { data, setData, put, processing, errors } = useForm({
        name: habit.name || '',
        description: habit.description || '',
        target: habit.target || '',
        frequency: habit.frequency || 'daily',
        book_id: habit.book_id ? habit.book_id.toString() : '',
        is_active: habit.is_active ?? true,
    });

    function submit(e) {
        e.preventDefault();
        put(`/habits/${habit.id}`);
    }

    return (
        <>
            <Head title={`Edit Habit - ${habit.name}`} />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={`/habits/${habit.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
                        >
                            ← Back to Habit
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Habit</h1>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Habit Name *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., Read for 30 minutes"
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Describe your habit and why it's important to you..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="target" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Target Days
                                </label>
                                <input
                                    id="target"
                                    name="target"
                                    type="number"
                                    value={data.target}
                                    onChange={(e) => setData('target', e.target.value)}
                                    placeholder="e.g., 30"
                                    min="1"
                                    max="365"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <InputError message={errors.target} />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Frequency
                                </label>
                                <select
                                    id="frequency"
                                    value={data.frequency}
                                    onChange={(e) => setData('frequency', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                                <InputError message={errors.frequency} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="book_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Associated Book (Optional)
                            </label>
                            <select
                                id="book_id"
                                value={data.book_id || ''}
                                onChange={(e) => setData('book_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">None</option>
                                {books && books.length > 0 && books.map((book) => (
                                    <option key={book.id} value={book.id.toString()}>
                                        {book.title}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.book_id} />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <input
                                id="is_active"
                                name="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Set habit as active
                            </label>
                            <InputError message={errors.is_active} />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <Link
                                href={`/habits/${habit.id}`}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50"
                            >
                                {processing ? 'Updating...' : 'Update Habit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

Edit.layout = (page) => <AppLayout children={page} title="Edit Habit" />;
export default Edit;
