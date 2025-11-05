import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { PencilLine } from "lucide-react";
import DatePicker from "../../components/ui/date-picker";

const Create = () => {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        content: '',
        tags: [],
        entry_date: new Date().toISOString().split('T')[0],
    });

    const [customTag, setCustomTag] = React.useState('');
    const commonTags = ['Reflection', 'Insight', 'Progress', 'Challenge', 'Gratitude', 'Learning', 'Goal'];

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/journals', {
            onSuccess: () => {
                reset();
            }
        });
    };

    const addTag = (tag) => {
        if (!data.tags.includes(tag)) {
            setData('tags', [...data.tags, tag]);
        }
    };

    const removeTag = (tagToRemove) => {
        setData('tags', data.tags.filter(tag => tag !== tagToRemove));
    };

    const addCustomTag = () => {
        if (customTag.trim() && !data.tags.includes(customTag.trim())) {
            addTag(customTag.trim());
            setCustomTag('');
        }
    };

    return (
        <>
            <Head title="New Journal Entry - Live Your Books" />
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <PencilLine className="h-8 w-8 text-indigo-600" />
                        <h1 className="text-2xl font-bold text-gray-900">New Journal Entry</h1>
                    </div>
                    <Link
                        href="/journals"
                        className="text-gray-600 hover:text-gray-800"
                    >
                        ← Back to Journals
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Entry Date
                            </label>
                            <DatePicker
                                value={data.entry_date}
                                onChange={(value) => setData('entry_date', value)}
                            />
                            {errors.entry_date && <p className="text-red-500 text-sm mt-1">{errors.entry_date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="What's on your mind today?"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Content
                            </label>
                            <textarea
                                value={data.content}
                                onChange={(e) => setData('content', e.target.value)}
                                rows="12"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Write your thoughts, reflections, insights, or anything that comes to mind..."
                            />
                            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                {data.content.length} characters
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tags
                            </label>
                            
                            {/* Selected Tags */}
                            {data.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {data.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-2 text-indigo-600 hover:text-indigo-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Common Tags */}
                            <div className="mb-3">
                                <p className="text-sm text-gray-600 mb-2">Quick tags:</p>
                                <div className="flex flex-wrap gap-2">
                                    {commonTags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => addTag(tag)}
                                            disabled={data.tags.includes(tag)}
                                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                                data.tags.includes(tag)
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Tag Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customTag}
                                    onChange={(e) => setCustomTag(e.target.value)}
                                    placeholder="Add custom tag..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomTag();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={addCustomTag}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Add
                                </button>
                            </div>
                            {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t">
                            <Link
                                href="/journals"
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Saving...' : 'Save Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

Create.layout = page => <AppLayout children={page} title="Create Journal Entry" />;
export default Create;
