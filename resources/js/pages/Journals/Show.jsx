import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, router } from "@inertiajs/react";
import { 
    PencilLine,
    Trash2,
    Calendar,
    ArrowLeft,
    Tag,
    Edit
} from "lucide-react";

const Show = ({ journal }) => {
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${journal.title}"?`)) {
            router.delete(`/journals/${journal.id}`, {
                onSuccess: () => {
                    router.visit('/journals');
                }
            });
        }
    };

    return (
        <>
            <Head title={`${journal.title} - Journals`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <Link
                            href="/journals"
                            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block flex items-center"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Journals
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                            {journal.title}
                        </h1>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mt-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(journal.entry_date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            href={`/journals/${journal.id}/edit`}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Tags */}
                {journal.tags && journal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {journal.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Journal Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="prose max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {journal.content || 'No content available.'}
                    </div>
                </div>

                {/* Metadata */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="font-medium mr-2">Created:</span>
                            <span>{new Date(journal.created_at).toLocaleDateString()}</span>
                        </div>
                        {journal.updated_at !== journal.created_at && (
                            <div className="flex items-center">
                                <PencilLine className="h-4 w-4 mr-2" />
                                <span className="font-medium mr-2">Last Updated:</span>
                                <span>{new Date(journal.updated_at).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

Show.layout = page => <AppLayout children={page} title="Journal Entry" />;
export default Show;
