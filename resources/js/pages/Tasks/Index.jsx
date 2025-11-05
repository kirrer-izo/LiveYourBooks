import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { 
    CheckCircle, 
    Clock, 
    AlertTriangle,
    Plus,
    Search,
    Calendar
} from "lucide-react";

const Index = ({ tasks, filters, books }) => {
    const list = Array.isArray(tasks?.data) ? tasks.data : [];
    const links = tasks?.links || [];
    
    const [searchTerm, setSearchTerm] = React.useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = React.useState(filters?.status || 'all');
    const [priorityFilter, setPriorityFilter] = React.useState(filters?.priority || 'all');
    const [bookFilter, setBookFilter] = React.useState(filters?.book_id || 'all');
    const [dueDateFilter, setDueDateFilter] = React.useState(filters?.due_date || 'all');
    
    const { post } = useForm();

    // Update filters when they change
    React.useEffect(() => {
        const params = {
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            book_id: bookFilter !== 'all' ? bookFilter : undefined,
            due_date: dueDateFilter !== 'all' ? dueDateFilter : undefined,
        };
        router.get('/tasks', params, { preserveState: true, replace: true, preserveScroll: true });
    }, [searchTerm, statusFilter, priorityFilter, bookFilter, dueDateFilter]);

    const toggleTaskCompletion = (taskId) => {
        post(`/tasks/${taskId}/toggle`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isOverdue = (dueDate) => {
        return dueDate && new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    };

    return (
        <>
        <Head title="Tasks - Live Your Books" />
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <Link
                        href="/tasks/create"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                        
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                        
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="all">All Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
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
                        
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={dueDateFilter}
                            onChange={(e) => setDueDateFilter(e.target.value)}
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Due Today</option>
                            <option value="overdue">Overdue</option>
                            <option value="this_week">This Week</option>
                        </select>
                        
                        <div className="flex items-center text-sm text-gray-500">
                            {list.length} task{list.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>


                {/* Tasks List */}
                {list.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            No tasks found
                        </h3>
                        <p className="mt-1 text-gray-500">
                            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || bookFilter !== 'all' || dueDateFilter !== 'all'
                                ? 'Try adjusting your filters or create a new task'
                                : 'Start by creating your first task'
                            }
                        </p>
                        <Link
                            href="/tasks/create"
                            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Create Task
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <ul className="divide-y divide-gray-100">
                                {list.map(task => (
                                    <li key={task.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-start space-x-3">
                                            <button
                                                onClick={() => toggleTaskCompletion(task.id)}
                                                className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                    task.is_completed 
                                                        ? 'bg-green-600 border-green-600' 
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                {task.is_completed && (
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                )}
                                            </button>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <Link 
                                                            href={`/tasks/${task.id}`}
                                                            className={`text-sm font-medium hover:text-indigo-600 ${
                                                                task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                                                            }`}
                                                        >
                                                            {task.title}
                                                        </Link>
                                                        
                                                        {task.description && (
                                                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                        
                                                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                                            {task.book && (
                                                                <span className="flex items-center">
                                                                    📚 {task.book.title}
                                                                </span>
                                                            )}
                                                            
                                                            {task.due_date && (
                                                                <span className={`flex items-center ${
                                                                    isOverdue(task.due_date) ? 'text-red-600' : ''
                                                                }`}>
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    {new Date(task.due_date).toLocaleDateString()}
                                                                    {isOverdue(task.due_date) && (
                                                                        <AlertTriangle className="h-3 w-3 ml-1" />
                                                                    )}
                                                                </span>
                                                            )}
                                                            
                                                            <span className="text-xs text-gray-400">
                                                                Updated {new Date(task.updated_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-2 ml-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            getPriorityColor(task.priority)
                                                        }`}>
                                                            {task.priority}
                                                        </span>
                                                        
                                                        {task.is_completed && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                ✓ Done
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
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

Index.layout = page => <AppLayout children={page} title="Tasks" />
export default Index;