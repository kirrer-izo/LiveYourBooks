import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head } from "@inertiajs/react";

const Index = () => {
    
            const tasks = [
                { id: 1, book: "Atomic Habits", chapter: "Chapter 3", task: "Identify one habit to improve", completed: false },
                { id: 2, book: "Deep Work", chapter: "Chapter 1", task: "Schedule 2 hours of focused work", completed: true },
            ];
    const [taskList, setTaskList] = React.useState(tasks);
            const [newTask, setNewTask] = React.useState('');
            const [selectedBook, setSelectedBook] = React.useState('all');

            const handleAddTask = (e) => {
                e.preventDefault();
                if (newTask.trim() === '') return;
                
                const task = {
                    id: taskList.length + 1,
                    book: "New Book",
                    chapter: "Chapter 1",
                    task: newTask,
                    completed: false
                };
                
                setTaskList([...taskList, task]);
                setNewTask('');
            };

            const toggleTaskCompletion = (taskId) => {
                setTaskList(taskList.map(task => 
                    task.id === taskId ? { ...task, completed: !task.completed } : task
                ));
            };

            const filteredTasks = selectedBook === 'all' 
                ? taskList 
                : taskList.filter(task => task.book === selectedBook);

    return (
        <>
        <Head title="Tasks - Live Your Books" />
                        <div data-aos="fade-up">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <h2 className="text-2xl font-bold mb-4 md:mb-0">Task Generator</h2>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <select
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={selectedBook}
                                onChange={(e) => setSelectedBook(e.target.value)}
                            >
                                <option value="all">All Books</option>
                                <option value="Atomic Habits">Atomic Habits</option>
                                <option value="Deep Work">Deep Work</option>
                                <option value="The Power of Now">The Power of Now</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4">Generate New Tasks</h3>
                        <form onSubmit={handleAddTask} className="flex">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Enter a new task..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                Add Task
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold">Your Tasks</h3>
                        </div>
                        {filteredTasks.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No tasks found. Add a new task or select a different book.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {filteredTasks.map(task => (
                                    <li key={task.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-start">
                                            <button
                                                onClick={() => toggleTaskCompletion(task.id)}
                                                className={`mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded border ${task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}
                                            >
                                                {task.completed && <i data-feather="check" className="w-3 h-3 text-white"></i>}
                                            </button>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <p className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                        {task.task}
                                                    </p>
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500">
                                                    <span>{task.book} • {task.chapter}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
        </>
    )
}

Index.layout = page => <AppLayout children={page} title="Tasks" />
export default Index;