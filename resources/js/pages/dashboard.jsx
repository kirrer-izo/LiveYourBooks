import React from "react";
import AppLayout from "../layouts/AppLayout";
import { Head } from "@inertiajs/react";

const dashboard = () => {
                // Mock data
            const books = [
                { id: 1, title: "Atomic Habits", author: "James Clear", progress: 75, cover: "http://static.photos/books/200x200/1" },
                { id: 2, title: "Deep Work", author: "Cal Newport", progress: 30, cover: "http://static.photos/books/200x200/2" },
                { id: 3, title: "The Power of Now", author: "Eckhart Tolle", progress: 100, cover: "http://static.photos/books/200x200/3" },
            ];

            const habits = [
                { id: 1, name: "Morning Journal", streak: 14, frequency: "daily" },
                { id: 2, name: "Exercise", streak: 5, frequency: "daily" },
                { id: 3, name: "Read 30 mins", streak: 21, frequency: "daily" },
            ];

            const journals = [
                { id: 1, date: "2023-05-15", title: "Today's Reflection", preview: "Today I learned about..." },
                { id: 2, date: "2023-05-14", title: "Habit Progress", preview: "I'm noticing improvements in..." },
            ];

            const messages = [
                { id: 1, sender: "user", text: "How can I apply the 1% rule from Atomic Habits?" },
                { id: 2, sender: "ai", text: "Start by identifying a tiny habit you can do daily. For example..." },
            ];

            const tasks = [
                { id: 1, book: "Atomic Habits", chapter: "Chapter 3", task: "Identify one habit to improve", completed: false },
                { id: 2, book: "Deep Work", chapter: "Chapter 1", task: "Schedule 2 hours of focused work", completed: true },
            ];
                        const [user, setUser] = React.useState({
                name: "John Doe",
                email: "john@example.com",
                avatar: "http://static.photos/people/200x200/42",
                streak: 7,
                booksRead: 12,
                habitsCompleted: 85
            });
    return (
        <>
        <Head title="Dashboard" />
        <h1>Welcome to dashboard</h1>
        <div data-aos="fade-up">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Current Streak</p>
                                    <p className="text-3xl font-bold mt-1">{user.streak} days</p>
                                </div>
                                <div className="p-3 bg-indigo-100 rounded-full">
                                    <i data-feather="zap" className="text-indigo-600"></i>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Books Read</p>
                                    <p className="text-3xl font-bold mt-1">{user.booksRead}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <i data-feather="book" className="text-green-600"></i>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Habits Completed</p>
                                    <p className="text-3xl font-bold mt-1">{user.habitsCompleted}%</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <i data-feather="check-circle" className="text-blue-600"></i>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Journal Entries</p>
                                    <p className="text-3xl font-bold mt-1">{journals.length}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <i data-feather="edit" className="text-purple-600"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Current Books</h3>
                                <button className="text-sm text-indigo-600 hover:text-indigo-500">View All</button>
                            </div>
                            <div className="space-y-4">
                                {books.map(book => (
                                    <div key={book.id} className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                        <img src={book.cover} alt={book.title} className="w-12 h-16 rounded-md object-cover" />
                                        <div className="ml-4 flex-1">
                                            <h4 className="font-medium">{book.title}</h4>
                                            <p className="text-sm text-gray-500">{book.author}</p>
                                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-indigo-600 h-2 rounded-full" 
                                                    style={{ width: `${book.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Active Habits</h3>
                                <button className="text-sm text-indigo-600 hover:text-indigo-500">View All</button>
                            </div>
                            <div className="space-y-4">
                                {habits.map(habit => (
                                    <div key={habit.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">{habit.name}</h4>
                                            <span className="text-sm font-medium text-indigo-600">{habit.streak} day streak</span>
                                        </div>
                                        <div className="mt-2 flex items-center">
                                            {Array.from({ length: 7 }).map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`w-6 h-6 rounded-full mr-1 ${i < habit.streak ? 'habit-streak' : 'bg-gray-200'}`}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Journals</h3>
                            <button className="text-sm text-indigo-600 hover:text-indigo-500">View All</button>
                        </div>
                        <div className="space-y-4">
                            {journals.map(journal => (
                                <div key={journal.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{journal.title}</h4>
                                        <span className="text-sm text-gray-500">{journal.date}</span>
                                    </div>
                                    <p className="mt-2 text-gray-600">{journal.preview}...</p>
                                    <div className="mt-3 flex">
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full mr-2">
                                            Reflection
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
        </>
    )
}

dashboard.layout = page => <AppLayout children={page} title="Dashboard"/>
export default dashboard;