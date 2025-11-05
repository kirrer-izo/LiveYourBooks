import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, router } from "@inertiajs/react";
import { BookOpen, Edit, Trash2, Calendar, Tag, User } from "lucide-react";

const Show = ({ book }) => {
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
            router.delete(`/books/${book.id}`, {
                onSuccess: () => {
                    router.visit('/books');
                }
            });
        }
    };

    return (
        <>
            <Head title={`${book.title} - Live Your Books`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <Link
                            href="/books"
                            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
                        >
                            ← Back to Books
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                            {book.title}
                        </h1>
                        {book.author && (
                            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                {book.author}
                            </p>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            href={`/books/${book.id}/edit`}
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

                {/* Book Cover and Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Cover Image */}
                        <div className="md:col-span-1">
                            {book.cover_is_pdf ? (
                                <div className="w-full h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <a
                                        href={book.cover_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:underline flex flex-col items-center"
                                    >
                                        <BookOpen className="h-12 w-12 mb-2" />
                                        Open PDF
                                    </a>
                                </div>
                            ) : book.cover_img ? (
                                <img 
                                    src={book.cover_img} 
                                    alt={book.title} 
                                    className="w-full h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-600" 
                                />
                            ) : (
                                <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <div className="text-center">
                                        <BookOpen className="h-12 w-12 mx-auto mb-2" />
                                        <p>No Cover</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Book Details */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="space-y-3">
                                {book.genre && (
                                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                                        <Tag className="h-4 w-4 mr-2" />
                                        <span className="font-medium mr-2">Genre:</span>
                                        <span>{book.genre}</span>
                                    </div>
                                )}
                                
                                {book.life_area && (
                                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                                        <Tag className="h-4 w-4 mr-2" />
                                        <span className="font-medium mr-2">Life Area:</span>
                                        <span>{book.life_area}</span>
                                    </div>
                                )}

                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span className="font-medium mr-2">Added:</span>
                                    <span>{new Date(book.created_at).toLocaleDateString()}</span>
                                </div>

                                {book.is_completed !== undefined && (
                                    <div className="flex items-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            book.is_completed 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        }`}>
                                            {book.is_completed ? '✓ Completed' : 'Reading'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Open File Button */}
                            {book.file_path && (
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <a
                                        href={`/books/${book.id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                                    >
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Open File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

Show.layout = page => <AppLayout children={page} title="Book Details" />;
export default Show;
