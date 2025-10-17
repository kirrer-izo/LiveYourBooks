import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { 
    Flame, 
    Plus, 
    CheckCircle,
    X,
    Calendar,
    BarChart3
} from "lucide-react";

const Index = ({ habits, filters, books }) => {
    const list = Array.isArray(habits?.data) ? habits.data : [];
    const links = habits?.links || [];
    
    const [statusFilter, setStatusFilter] = React.useState(filters?.status || 'all');
    const [bookFilter, setBookFilter] = React.useState(filters?.book_id || 'all');
    
    const { post } = useForm();

    // Update filters when they change
    React.useEffect(() => {
        const params = {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            book_id: bookFilter !== 'all' ? bookFilter : undefined,
        };
        router.get('/habits', params, { preserveState: true, replace: true, preserveScroll: true });
    }, [statusFilter, bookFilter]);

    const handleCheckIn = (habitId) => {
        post(`/habits/${habitId}/checkin`, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Show success message or update UI
            }
        });
    };

    const getStreakColor = (streak) => {
        if (streak >= 30) return 'text-purple-600';
        if (streak >= 14) return 'text-green-600';
        if (streak >= 7) return 'text-blue-600';
        return 'text-gray-600';
    };

    const getStatusBadge = (habit) => {
        if (habit.completed_today) {
            return {
                text: '✓ Done Today',
                className: 'bg-green-100 text-green-800'
            };
        }
        
        const status = habit.streak_status?.status;
        if (status === 'pending') {
            return {
                text: 'Pending',
                className: 'bg-yellow-100 text-yellow-800'
            };
        }
        
        if (status === 'broken') {
            return {
                text: 'Streak Broken',
                className: 'bg-red-100 text-red-800'
            };
        }
        
        return {
            text: 'Active',
            className: 'bg-blue-100 text-blue-800'
        };
    };
    return (
        <>
        <Head title="Habits - Live Your Books" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-3">
                        <Flame className="h-8 w-8 text-orange-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
                    </div>
                    <Link
                        href="/habits/create"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Habit
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Habits</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={bookFilter}
                            onChange={(e) => setBookFilter(e.target.value)}
                        >
                            <option value="all">All Books</option>
                            {books && books.map((book) => (
                                <option key={book.id} value={book.id}>
                                    {book.title} - {book.author}
                                </option>
                            ))}
                        </select>
                        
                        <div className="flex items-center text-sm text-gray-500">
                            {list.length} habit{list.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>


                {/* Habits List */}
                {list.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
                        <Flame className="w-12 h-12 mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            No habits found
                        </h3>
                        <p className="mt-1 text-gray-500">
                            {statusFilter !== 'all' || bookFilter !== 'all'
                                ? 'Try adjusting your filters or create a new habit'
                                : 'Start building positive habits today'
                            }
                        </p>
                        <Link
                            href="/habits/create"
                            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Create Habit
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {list.map(habit => {
                                const statusBadge = getStatusBadge(habit);
                                return (
                                    <div key={habit.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <Link 
                                                    href={`/habits/${habit.id}`}
                                                    className="text-lg font-semibold hover:text-indigo-600"
                                                >
                                                    {habit.name}
                                                </Link>
                                                {habit.book && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        📚 {habit.book.title}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                                                {statusBadge.text}
                                            </span>
                                        </div>

                                        {/* Streak Display */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Current Streak</span>
                                                <span className={`text-2xl font-bold ${getStreakColor(habit.streak)}`}>
                                                    {habit.streak}
                                                </span>
                                            </div>
                                            
                                            {/* Streak Visualization */}
                                            <div className="flex space-x-1 mb-2">
                                                {Array.from({ length: 7 }).map((_, i) => {
                                                    const daysPast = 6 - i;
                                                    const isCompleted = habit.streak > daysPast;
                                                    return (
                                                        <div 
                                                            key={i}
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                                                isCompleted 
                                                                    ? 'bg-green-500 text-white' 
                                                                    : 'bg-gray-200 text-gray-400'
                                                            }`}
                                                            title={`${daysPast} days ago`}
                                                        >
                                                            {isCompleted ? '✓' : daysPast}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        habit.streak >= 30 ? 'bg-purple-500' :
                                                        habit.streak >= 14 ? 'bg-green-500' :
                                                        habit.streak >= 7 ? 'bg-blue-500' :
                                                        'bg-indigo-500'
                                                    }`}
                                                    style={{ width: `${Math.min((habit.streak / 30) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-2">
                                            {!habit.completed_today ? (
                                                <button 
                                                    onClick={() => handleCheckIn(habit.id)}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Check In
                                                </button>
                                            ) : (
                                                <div className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-md flex items-center justify-center">
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Completed Today
                                                </div>
                                            )}
                                            
                                            {/* <Link 
                                                href={`/habits/${habit.id}`}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
                                            >
                                                <BarChart3 className="h-4 w-4" />
                                            </Link> */}
                                        </div>
                                        
                                        {habit.target && (
                                            <div className="mt-3 text-xs text-gray-500 text-center">
                                                Target: {habit.target} days
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Pagination */}
                        {links.length > 3 && (
                            <div className="mt-6 flex justify-center space-x-2">
                                {links.map((link, index) => 
                                    link.url ? (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1 rounded border text-sm transition ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                            }`}
                                        />
                                    ) : (
                                        <span
                                            key={index}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className="px-3 py-1 rounded border text-sm bg-white text-gray-400 border-gray-300"
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}

Index.layout = page => <AppLayout children={page} title="Habits" />;
export default Index;