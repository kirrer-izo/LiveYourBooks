import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

const Create = ({ genres = [], lifeAreas = [] }) => {
    const { props } = usePage();
    const isFreeUser = !(props.auth?.user?.subscription_status === 'active' || props.auth?.user?.role === 'Admin');

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        author: '',
        genre: '',
        life_area: '',
        book_file: null,
        is_text_only: isFreeUser, // Free users are forced to text-only
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/books', {
            onSuccess: () => {
                reset();
            }
        });
    };

    const handleFileChange = (e) => {
        setData('book_file', e.target.files[0]);
    };

    return (
        <>
            <Head title="Add Book - Live Your Books" />
            <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Add New Book</h3>
                            <Link
                                href="/books"
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <i data-feather="x"></i>
                            </Link>
                        </div>

                        {isFreeUser && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800">
                                    <strong>Coming Soon:</strong> PDF file upload will be available for premium users once we launch our subscription plans. For now, you can add books by entering the title and author.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isFreeUser ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Book Title *</label>
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Enter book title"
                                            required
                                        />
                                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                                        <input
                                            type="text"
                                            value={data.author}
                                            onChange={(e) => setData('author', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Enter author name"
                                            required
                                        />
                                        {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Book PDF</label>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload a book PDF. Title and author will be extracted automatically.</p>
                                    {errors.book_file && <p className="text-red-500 text-sm mt-1">{errors.book_file}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                                <select
                                    value={data.genre}
                                    onChange={(e) => setData('genre', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select a genre</option>
                                    {genres.map((g) => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                                {errors.genre && <p className="text-red-500 text-sm mt-1">{errors.genre}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Life Area</label>
                                <select
                                    value={data.life_area}
                                    onChange={(e) => setData('life_area', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select a life area</option>
                                    {lifeAreas.map((l) => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                                {errors.life_area && <p className="text-red-500 text-sm mt-1">{errors.life_area}</p>}
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <Link
                                    href="/books"
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {processing ? 'Adding...' : 'Add Book'}
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