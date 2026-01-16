import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

interface ChatProps {
    books: any[];
    mentors: any[];
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
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
