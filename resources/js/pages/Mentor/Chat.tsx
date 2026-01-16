import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { User } from '@/types';

interface Book {
    id: number;
    title: string;
    [key: string]: unknown;
}

interface ChatProps {
    books: Book[];
    mentors: User[];
}

export default function Chat({ books, mentors }: ChatProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Mentor Chat', href: '/mentor/chat' }]}>
            <Head title="Mentor Chat" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
                        <h1 className="text-2xl font-bold mb-4">Mentor Chat</h1>
                        <div className="text-gray-600">
                            Select a book or mentor to start chatting.
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h2 className="font-semibold text-lg mb-2">Available Books ({books.length})</h2>
                                <p className="text-sm text-gray-500">Pick a book context to start.</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h2 className="font-semibold text-lg mb-2">Available Mentors ({mentors.length})</h2>
                                <p className="text-sm text-gray-500">Choose a mentor persona.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
