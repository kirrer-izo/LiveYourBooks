import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, useForm } from "@inertiajs/react";

const Edit = ({ book, genres = [], lifeAreas = [] }) => {
    // Initialize form with book data - use default values to ensure fields are always set
    const { data, setData, put, processing, errors } = useForm({
        title: book?.title ?? '',
        author: book?.author ?? '',
        genre: book?.genre ?? '',
        life_area: book?.life_area ?? '',
        cover_img: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/books/${book.id}`, {
            preserveScroll: true,
            onError: (errors) => {
                console.log('Update errors:', errors);
            },
        });
    };

    const handleFileChange = (e) => {
        setData('cover_img', e.target.files[0]);
    };

    return (
        <>
        <Head title="Edit Book - Live Your Books" />
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Edit Book</h3>
                        <Link
                            href="/books"
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <i data-feather="x"></i>
                        </Link>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                            <input
                                type="text"
                                value={data.author}
                                onChange={(e) => setData('author', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
                        </div>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload a new cover image (optional).</p>
                            {errors.cover_img && <p className="text-red-500 text-sm mt-1">{errors.cover_img}</p>}
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
                                {processing ? 'Updating...' : 'Update Book'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        </>
    )
}

Edit.layout = page => <AppLayout children={page} title="Edit Book" />
export default Edit;

