import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, useForm } from "@inertiajs/react";

const Create = ({ genres = [], lifeAreas = [] }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        genre: '',
        life_area: '',
        cover_img: null,
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
        setData('cover_img', e.target.files[0]);
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
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Book PDF</label>
                            <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload a book PDF. Title and author will be extracted automatically.</p>
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