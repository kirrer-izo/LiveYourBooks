import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { 
    CheckCircle, 
    Clock, 
    AlertTriangle,
    Edit,
    Trash2,
    Calendar,
    ArrowLeft,
    BookOpen
} from "lucide-react";

const Show = ({ task }) => {
    const { post } = useForm();

    const toggleCompletion = () => {
        post(`/tasks/${task.id}/toggle`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
            router.delete(`/tasks/${task.id}`, {
                onSuccess: () => {
                    router.visit('/tasks');
                }
            });
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    };

    return (
        <>
            <Head title={`${task.title} - Tasks`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <Link
                            href="/tasks"
                            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block flex items-center"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Tasks
                        </Link>
                        <div className="flex items-start space-x-3 mt-2">
                            <button
                                onClick={toggleCompletion}
                                className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                                    task.is_completed 
                                        ? 'bg-green-600 border-green-600' 
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {task.is_completed && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                )}
                            </button>
                            <div className="flex-1">
                                <h1 className={`text-3xl font-bold ${
                                    task.is_completed 
                                        ? 'line-through text-gray-500 dark:text-gray-400' 
                                        : 'text-gray-900 dark:text-white'
                                }`}>
                                    {task.title}
                                </h1>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            href={`/tasks/${task.id}/edit`}
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

                {/* Task Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                    {/* Priority and Status */}
                    <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority} Priority
                        </span>
                        {task.is_completed && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                ✓ Completed
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {task.description && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
                            <div className="prose max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {task.description}
                            </div>
                        </div>
                    )}

                    {/* Related Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {task.book && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <BookOpen className="h-5 w-5 mr-2" />
                                <span className="font-medium mr-2">Related Book:</span>
                                <Link 
                                    href={`/books/${task.book.id}`}
                                    className="text-indigo-600 hover:text-indigo-800"
                                >
                                    {task.book.title}
                                </Link>
                            </div>
                        )}

                        {task.habit && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Clock className="h-5 w-5 mr-2" />
                                <span className="font-medium mr-2">Related Habit:</span>
                                <Link 
                                    href={`/habits/${task.habit.id}`}
                                    className="text-indigo-600 hover:text-indigo-800"
                                >
                                    {task.habit.name}
                                </Link>
                            </div>
                        )}

                        {task.due_date && (
                            <div className={`flex items-center ${isOverdue(task.due_date) ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                <Calendar className="h-5 w-5 mr-2" />
                                <span className="font-medium mr-2">Due Date:</span>
                                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                {isOverdue(task.due_date) && (
                                    <AlertTriangle className="h-4 w-4 ml-2" />
                                )}
                            </div>
                        )}

                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Clock className="h-5 w-5 mr-2" />
                            <span className="font-medium mr-2">Created:</span>
                            <span>{new Date(task.created_at).toLocaleDateString()}</span>
                        </div>

                        {task.updated_at !== task.created_at && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Clock className="h-5 w-5 mr-2" />
                                <span className="font-medium mr-2">Updated:</span>
                                <span>{new Date(task.updated_at).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

Show.layout = page => <AppLayout children={page} title="Task Details" />;
export default Show;
