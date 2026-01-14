import React, { useState } from 'react';

interface Suggestion {
    title: string;
    author: string;
    reason: string;
}

interface Props {
    className?: string;
}

const BookSuggestions: React.FC<Props> = ({ className = '' }) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const generateSuggestions = async () => {
        setLoading(true);
        setError('');
        setShowSuggestions(true);

        try {
            const csrf = csrfToken();
            const res = await fetch('/ai/book-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to generate suggestions');
            }

            setSuggestions(data.suggestions || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Book Suggestions
                </h3>
                <button
                    onClick={generateSuggestions}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Generating...' : 'Get Suggestions'}
                </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get personalized book recommendations based on your current tasks and habits.
            </p>

            {error && (
                <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">
                    {error}
                </div>
            )}

            {showSuggestions && !loading && suggestions.length === 0 && !error && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No suggestions found. Try adding more tasks or habits.
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="space-y-4">
                    {suggestions.map((book, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                                        {book.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        by {book.author}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Why:</span> {book.reason}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookSuggestions;
