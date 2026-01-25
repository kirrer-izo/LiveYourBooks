import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { User as UserType } from '@/types';
import { BookOpen, User as UserIcon, MessageCircle, Sparkles, ArrowRight, ArrowLeft, Send, AlertCircle, Bot, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface Book {
    id: number;
    title: string;
    author: string | null;
    created_at: string;
}

interface Mentor {
    id: string | number;
    name: string;
    type: 'author' | 'thinker' | 'custom';
    avatar?: string | null;
    description?: string;
}

interface ChatProps {
    books: Book[];
    mentors: Mentor[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

type SelectionType = 'book' | 'mentor' | null;

export default function Chat({ books, mentors }: ChatProps) {
    // Selection State
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [selectionType, setSelectionType] = useState<SelectionType>(null);

    // Chat State
    const [chatMode, setChatMode] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Reset selection helper
    const resetSelection = () => {
        setChatMode(false);
        setConversationId(null);
        setMessages([]);
        setSelectedBook(null);
        setSelectedMentor(null);
        setSelectionType(null);
        setError(null);
    };

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle Start Chat
    const startChat = () => {
        if (selectedBook || selectedMentor) {
            setChatMode(true);
            setMessages([]); // Clear previous messages or fetch history if needed
            // Ideally we could check for existing conversations here via API but for now we start fresh or relying on backend to find existing logic if we passed ID properly? 
            // The backend checks `conversation_id`. If we don't pass it, it creates new.
            // We'll start fresh visually for this task unless we implement a conversation history picker.
        }
    };

    // Send Message
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);
        setError(null);

        try {
            // Prepare payload
            const payload: any = {
                message: userMsg,
                conversation_id: conversationId,
            };

            if (selectionType === 'book' && selectedBook) {
                payload.book_id = selectedBook.id;
                payload.book = selectedBook.title; // Legacy support
            } else if (selectionType === 'mentor' && selectedMentor) {
                payload.mentor_id = selectedMentor.id; // Can be string or number
                payload.mentor = selectedMentor.name;
            }

            const response = await axios.post('/mentor/chat/message', payload);

            if (response.data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
            }

            if (response.data.conversation_id) {
                setConversationId(response.data.conversation_id);
            }

        } catch (err: any) {
            console.error(err);
            let errorMessage = 'Failed to send message. Please try again.';

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectBook = (book: Book) => {
        setSelectedBook(book);
        setSelectedMentor(null);
        setSelectionType('book');
    };

    const handleSelectMentor = (mentor: Mentor) => {
        setSelectedMentor(mentor);
        setSelectedBook(null);
        setSelectionType('mentor');
    };

    return (
        <AppLayout>
            <Head title="Mentor Chat" />

            <div className="py-6 min-h-screen bg-gray-50 dark:bg-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mentor Chat</h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {!chatMode
                                        ? "Who would you like to speak with today?"
                                        : `Chatting with ${selectionType === 'book' ? selectedBook?.title : selectedMentor?.name}`
                                    }
                                </p>
                            </div>
                            {chatMode && (
                                <button
                                    onClick={resetSelection}
                                    className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition"
                                >
                                    <X className="w-4 h-4" />
                                    <span>End Chat</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {!chatMode ? (
                        /* SELECTION MODE */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">

                            {/* Books Column */}
                            <div className={cn(
                                "space-y-6 transition-all duration-300",
                                // Dim this section if mentor is selected
                                selectionType === 'mentor' ? "opacity-40 grayscale pointer-events-none" : "opacity-100"
                            )}>
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Books</h2>
                                </div>
                                <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {books.length > 0 ? books.map(book => (
                                        <div
                                            key={book.id}
                                            onClick={() => handleSelectBook(book)}
                                            className={cn(
                                                "cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group",
                                                selectedBook?.id === book.id
                                                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500"
                                                    : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                                            )}
                                        >
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{book.title}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{book.author || 'Unknown Author'}</p>
                                            </div>
                                            {selectedBook?.id === book.id && (
                                                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                                    <Sparkles className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                                            No books found
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mentors Column */}
                            <div className={cn(
                                "space-y-6 transition-all duration-300",
                                // Dim this section if book is selected
                                selectionType === 'book' ? "opacity-40 grayscale pointer-events-none" : "opacity-100"
                            )}>
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <UserIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mentors</h2>
                                </div>
                                <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {mentors.length > 0 ? mentors.map(mentor => (
                                        <div
                                            key={mentor.id}
                                            onClick={() => handleSelectMentor(mentor)}
                                            className={cn(
                                                "cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group",
                                                selectedMentor?.id === mentor.id
                                                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500 ring-1 ring-purple-500"
                                                    : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-700"
                                            )}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                                                    mentor.type === 'custom'
                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                                )}>
                                                    {mentor.name.substring(0, 1)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{mentor.name}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{mentor.type}</p>
                                                </div>
                                            </div>
                                            {selectedMentor?.id === mentor.id && (
                                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <Sparkles className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                                            No mentors found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* CHAT MODE */
                        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-zinc-800 flex flex-col h-[70vh]">

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    {messages.length === 0 && (
                                        <div className="text-center py-10">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Bot className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                Start the conversation with
                                                <strong className="text-gray-700 dark:text-gray-200 mx-1">
                                                    {selectionType === 'book' ? selectedBook?.title : selectedMentor?.name}
                                                </strong>
                                            </p>
                                        </div>
                                    )}

                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex w-full",
                                                msg.role === 'user' ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "max-w-[80%] rounded-2xl px-5 py-3 text-sm md:text-base shadow-sm",
                                                msg.role === 'user'
                                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                                    : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-zinc-700"
                                            )}>
                                                <div className="text-sm md:text-base">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 mb-2" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 mb-2" {...props} />,
                                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0" {...props} />,
                                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-1 mt-2" {...props} />,
                                                            code: ({ node, ...props }) => <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 font-mono text-sm" {...props} />,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex justify-start w-full">
                                            <div className="bg-gray-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none px-5 py-4 border border-gray-200 dark:border-zinc-700 flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                    {error && (
                                        <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={`Ask ${selectionType === 'book' ? 'about the book' : selectedMentor?.name}...`}
                                            className="flex-1 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 dark:text-white dark:placeholder-gray-500"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputValue.trim() || isLoading}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Start Chat Button (Selection Mode) */}
                    {!chatMode && (selectedBook || selectedMentor) && (
                        <div className="fixed bottom-8 left-0 right-0 p-4 flex justify-center animate-in slide-in-from-bottom-4 z-50">
                            <button
                                onClick={startChat}
                                className="shadow-2xl bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-semibold text-lg px-8 py-3 rounded-full flex items-center space-x-2 hover:scale-105 transition-transform"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>Start Conversation</span>
                                <ArrowRight className="w-5 h-5 ml-1" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
