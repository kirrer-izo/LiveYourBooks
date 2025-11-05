import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { 
    Flame, 
    Edit,
    Trash2,
    Calendar,
    ArrowLeft,
    BookOpen,
    CheckCircle,
    Target,
    TrendingUp
} from "lucide-react";

const Show = ({ habit, completionData }) => {
    const { post } = useForm();

    const handleCheckIn = () => {
        post(`/habits/${habit.id}/checkin`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
            router.delete(`/habits/${habit.id}`, {
                onSuccess: () => {
                    router.visit('/habits');
                }
            });
        }
    };

    const getStreakColor = (streak) => {
        if (streak >= 30) return 'text-purple-600 dark:text-purple-400';
        if (streak >= 14) return 'text-green-600 dark:text-green-400';
        if (streak >= 7) return 'text-blue-600 dark:text-blue-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    const getStatusBadge = () => {
        if (habit.completed_today) {
            return {
                text: '✓ Done Today',
                className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            };
        }
        
        const status = habit.streak_status?.status;
        if (status === 'pending') {
            return {
                text: 'Pending',
                className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            };
        }
        
        if (status === 'broken') {
            return {
                text: 'Streak Broken',
                className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            };
        }
        
        return {
            text: 'Active',
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
    };

    const statusBadge = getStatusBadge();

    return (
        <>
            <Head title={`${habit.name} - Habits`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <Link
                            href="/habits"
                            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block flex items-center"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Habits
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 flex items-center">
                            <Flame className="h-8 w-8 mr-3 text-orange-600 dark:text-orange-400" />
                            {habit.name}
                        </h1>
                        <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}>
                            {statusBadge.text}
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            href={`/habits/${habit.id}/edit`}
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

                {/* Habit Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                    {/* Streak Display */}
                    <div className="text-center py-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="mb-4">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</span>
                        </div>
                        <div className={`text-6xl font-bold ${getStreakColor(habit.streak)}`}>
                            {habit.streak}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {habit.target ? `Target: ${habit.target} days` : 'Keep it up!'}
                        </div>
                        
                        {/* Progress Bar */}
                        {habit.target && (
                            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                        habit.streak >= habit.target ? 'bg-purple-500' :
                                        habit.streak >= habit.target * 0.7 ? 'bg-green-500' :
                                        habit.streak >= habit.target * 0.4 ? 'bg-blue-500' :
                                        'bg-indigo-500'
                                    }`}
                                    style={{ width: `${Math.min((habit.streak / habit.target) * 100, 100)}%` }}
                                ></div>
                            </div>
                        )}
                    </div>

                    {/* Check In Button */}
                    <div className="flex justify-center">
                        {!habit.completed_today ? (
                            <button 
                                onClick={handleCheckIn}
                                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-lg font-medium"
                            >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Check In Today
                            </button>
                        ) : (
                            <div className="px-6 py-3 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-md flex items-center text-lg font-medium">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Completed Today
                            </div>
                        )}
                    </div>

                    {/* Habit Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {habit.description && (
                            <div className="md:col-span-2">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
                                <div className="prose max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {habit.description}
                                </div>
                            </div>
                        )}

                        {habit.book && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <BookOpen className="h-5 w-5 mr-2" />
                                <span className="font-medium mr-2">Related Book:</span>
                                <Link 
                                    href={`/books/${habit.book.id}`}
                                    className="text-indigo-600 hover:text-indigo-800"
                                >
                                    {habit.book.title}
                                </Link>
                            </div>
                        )}

                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Target className="h-5 w-5 mr-2" />
                            <span className="font-medium mr-2">Frequency:</span>
                            <span className="capitalize">{habit.frequency}</span>
                        </div>

                        {habit.last_completed && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Calendar className="h-5 w-5 mr-2" />
                                <span className="font-medium mr-2">Last Completed:</span>
                                <span>{new Date(habit.last_completed).toLocaleDateString()}</span>
                            </div>
                        )}

                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Calendar className="h-5 w-5 mr-2" />
                            <span className="font-medium mr-2">Created:</span>
                            <span>{new Date(habit.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* 30-Day Calendar */}
                    {completionData && completionData.length > 0 && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2" />
                                Last 30 Days
                            </h2>
                            <div className="grid grid-cols-7 gap-2">
                                {completionData.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`h-8 rounded flex items-center justify-center text-xs ${
                                            day.completed
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                        title={new Date(day.date).toLocaleDateString()}
                                    >
                                        {day.completed ? '✓' : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

Show.layout = page => <AppLayout children={page} title="Habit Details" />;
export default Show;
