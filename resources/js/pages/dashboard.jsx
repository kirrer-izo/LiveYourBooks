import React from "react";
import AppLayout from "../layouts/AppLayout";
import { Head, Link } from "@inertiajs/react";
import { 
    BookOpen, 
    CheckCircle, 
    Flame, 
    PencilLine,
    Clock,
    AlertTriangle,
    TrendingUp,
    Calendar
} from "lucide-react";

const Dashboard = ({ 
    stats, 
    recentBooks, 
    recentTasks, 
    recentJournals, 
    habits, 
    weeklyData, 
    genreProgress, 
    tasksByPriority, 
    overdueTasks 
}) => {
    // Defensive defaults to avoid runtime errors when props are missing
    const safeStats = stats ?? {
        total_books: 0,
        books_reading: 0,
        books_completed: 0,
        total_tasks: 0,
        tasks_completed: 0,
        tasks_pending: 0,
        active_habits: 0,
        journal_entries: 0,
        ai_conversations: 0,
    };
    const safeRecentBooks = Array.isArray(recentBooks) ? recentBooks : [];
    const safeRecentTasks = Array.isArray(recentTasks) ? recentTasks : [];
    const safeRecentJournals = Array.isArray(recentJournals) ? recentJournals : [];
    const safeHabits = Array.isArray(habits) ? habits : [];
    const safeWeeklyData = Array.isArray(weeklyData) ? weeklyData : [];
    const safeOverdueTasks = Array.isArray(overdueTasks) ? overdueTasks : [];
    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <div className="flex space-x-3">
                        <Link href="/journals/create" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-4 py-2 rounded-md text-sm font-medium">
                            Quick Journal
                        </Link>
                        <Link href="/mentor/chat" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-4 py-2 rounded-md text-sm font-medium">
                            AI Mentor
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Books</p>
                                <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{safeStats.total_books}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{safeStats.books_completed} completed</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Tasks</p>
                                <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{safeStats.tasks_pending}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{safeStats.tasks_completed} completed</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Habits</p>
                                <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{safeStats.active_habits}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Daily tracking</p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                                <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Journal Entries</p>
                                <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{safeStats.journal_entries}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total reflections</p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                                <PencilLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overdue Tasks Alert */}
                {safeOverdueTasks.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-400 dark:text-red-500 mr-2" />
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                                You have {safeOverdueTasks.length} overdue task(s)
                            </h3>
                        </div>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                            <Link href="/tasks?status=overdue" className="underline hover:text-red-900 dark:hover:text-red-300">
                                View overdue tasks
                            </Link>
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Books */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Books</h3>
                            <Link href="/books" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">View All</Link>
                        </div>
                        <div className="space-y-3">
                            {safeRecentBooks.map(book => (
                                <div key={book.id} className="flex items-center p-3 border border-gray-100 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">{book.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{book.author}</p>
                                        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div 
                                                className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full" 
                                                style={{ width: `${book.progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{book.progress}% complete</p>
                                    </div>
                                </div>
                            ))}
                            {safeRecentBooks.length === 0 && (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                    <p>No books yet</p>
                                    <Link href="/books/create" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">Add your first book</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Habits */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Habits</h3>
                            <Link href="/habits" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">View All</Link>
                        </div>
                        <div className="space-y-3">
                            {safeHabits.map(habit => (
                                <div key={habit.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm">{habit.name}</h4>
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                habit.completed_today 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : habit.streak_status.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {habit.completed_today ? 'Done' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{habit.streak} day streak</span>
                                        <div className="flex space-x-1">
                                            {Array.from({ length: 7 }).map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`w-2 h-2 rounded-full ${
                                                        i < habit.streak ? 'bg-green-500' : 'bg-gray-200'
                                                    }`}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {safeHabits.length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    <Flame className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p>No habits yet</p>
                                    <Link href="/habits/create" className="text-indigo-600 hover:text-indigo-500">Create your first habit</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Tasks */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Tasks</h3>
                            <Link href="/tasks" className="text-sm text-indigo-600 hover:text-indigo-500">View All</Link>
                        </div>
                        <div className="space-y-3">
                            {safeRecentTasks.map(task => (
                                <div key={task.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className={`font-medium text-sm ${
                                                task.is_completed ? 'line-through text-gray-500' : ''
                                            }`}>
                                                {task.title}
                                            </h4>
                                            {task.book && (
                                                <p className="text-xs text-gray-500 mt-1">{task.book.title}</p>
                                            )}
                                            {task.due_date && (
                                                <p className="text-xs text-gray-400 mt-1 flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(task.due_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {safeRecentTasks.length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p>No tasks yet</p>
                                    <Link href="/tasks/create" className="text-indigo-600 hover:text-indigo-500">Create your first task</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Journals */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Recent Journal Entries</h3>
                        <Link href="/journals" className="text-sm text-indigo-600 hover:text-indigo-500">View All</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safeRecentJournals.map(journal => (
                            <div key={journal.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">{journal.title}</h4>
                                    <span className="text-xs text-gray-500">
                                        {new Date(journal.entry_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {journal.tags && journal.tags.map((tag, index) => (
                                        <span key={index} className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {safeRecentJournals.length === 0 && (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                <PencilLine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">No journal entries yet</p>
                                <p className="text-sm mb-4">Start reflecting on your journey</p>
                                <Link href="/journals/create" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                                    Write First Entry
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Weekly Progress Chart */}
                {safeWeeklyData.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Weekly Progress</h3>
                            <TrendingUp className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {safeWeeklyData.map((day, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-xs font-medium text-gray-500 mb-2">{day.day}</div>
                                    <div className="space-y-1">
                                        <div className={`h-8 rounded ${
                                            day.tasks_completed > 0 ? 'bg-green-200' : 'bg-gray-100'
                                        }`} title={`${day.tasks_completed} tasks completed`}></div>
                                        <div className={`h-6 rounded ${
                                            day.habits_completed > 0 ? 'bg-blue-200' : 'bg-gray-100'
                                        }`} title={`${day.habits_completed} habits completed`}></div>
                                        <div className={`h-4 rounded ${
                                            day.journal_entries > 0 ? 'bg-purple-200' : 'bg-gray-100'
                                        }`} title={`${day.journal_entries} journal entries`}></div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{day.date.split('-')[2]}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-200 rounded mr-1"></div>
                                <span>Tasks</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-200 rounded mr-1"></div>
                                <span>Habits</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-purple-200 rounded mr-1"></div>
                                <span>Journals</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

Dashboard.layout = page => <AppLayout children={page} title="Dashboard" />;
export default Dashboard;