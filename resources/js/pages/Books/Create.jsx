import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link } from "@inertiajs/react";

const Create = () => {
    return (
        <>
        <Head title="Add Book - Live Your Books" />
                                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Add New Book</h3>
                                        <button 
                                            onClick={() => setShowAddBookModal(false)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <i data-feather="x"></i>
                                        </button>
                                    </div>
                                    <form className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                                <option>Self Improvement</option>
                                                <option>Business</option>
                                                <option>Psychology</option>
                                                <option>Productivity</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-4">
                                            <Link
                                                href="/books"
                                                onClick={() => setShowAddBookModal(false)}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </Link>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                            >
                                                Add Book
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
        </>
    )
}

Create.layout = page => <AppLayout children={page} title="Create Book" />
export default Create;