import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, router } from "@inertiajs/react";


const Index = ({books, filters, genres = [], lifeAreas = []}) => {

//     const books = [
//   { id: 1, title: "Atomic Habits", author: "James Clear", progress: 75, genre: "Self-Help", lifeArea: "Discipline"},
//   { id: 2, title: "Deep Work", author: "Cal Newport", progress: 30, genre: "Productivity", lifeArea: "Work"},
//   { id: 3, title: "The Power of Now", author: "Eckhart Tolle", progress: 100, genre: "Spirituality", lifeArea: "Mindfulness"},
// ];
    const list = Array.isArray(books?.data) ? books.data : [];
    const links = books?.links || [];
    
    const [searchTerm, setSearchTerm] = React.useState(filters?.q || '');
    const [filter, setFilter] = React.useState(filters?.status || 'all');
    const [showAddBookModal, setShowAddBookModal] = React.useState(false);
    const [category, setCategory] = React.useState(filters?.category || 'all');
    const [generatingTasks, setGeneratingTasks] = React.useState({});
    const categories = React.useMemo(() => ['all', ...genres, ...lifeAreas], [genres, lifeAreas]);

    // Push query params to backend when filters change
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page');
        const params = {
            q: searchTerm || undefined,
            status: filter !== 'all' ? filter : undefined,
            category: category !== 'all' ? category : undefined,
            page: currentPage || undefined,
        };
        router.get('/books', params, { preserveState: true, replace: true, preserveScroll: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, filter, category]);
    const filteredBooks = list;

    const generateTasks = (bookId) => {
        setGeneratingTasks(prev => ({ ...prev, [bookId]: true }));
        
        // Use Inertia router for form submission to handle flash messages
        router.post(`/api/books/${bookId}/generate-tasks`, 
            { book_id: bookId },
            {
                onFinish: () => {
                    setGeneratingTasks(prev => ({ ...prev, [bookId]: false }));
                },
                preserveState: true,
                preserveScroll: true,
            }
        );
    };



            
    return (
        <>
        <Head title="Books - Live Your Books" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white"> Books </h1>
        <div className="fade-up">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <h2 className="text-2xl font-bold mb-4 md:mb-0 text-gray-900 dark:text-white">My Books</h2>
                        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search books..."
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <i data-feather="search" className="absolute left-3 top-2.5 text-gray-400"></i>
                            </div>
                            <select
                                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Books</option>
                                <option value="reading">Currently Reading</option>
                                <option value="completed">Completed</option>
                            </select>
                            <select
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </select>
                            <Link
                                href="/books/create"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                Add Book
                            </Link>
                        </div>
                    </div>


                        {filteredBooks.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <i data-feather="book" className="w-12 h-12 mx-auto text-gray-400"></i>
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No books found</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Try adjusting your search or add a new book</p>
                            <Link
                                href="/books/create"
                                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded-md"
                            >
                                Add Book
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBooks.map(book => (
                                <div key={book.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                                    {book.cover_is_pdf ? (
                                      <div className="w-full h-48 flex items-center justify-center bg-gray-50 border-b">
                                        <a
                                          href={book.cover_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-600 hover:underline"
                                        >
                                          Open PDF
                                        </a>
                                      </div>
                                    ) : book.cover_img ? (
                                      <img src={book.cover_img} alt={book.title} className="w-full h-48 object-cover" />
                                    ) : (
                                      <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 border-b">
                                        No Cover
                                      </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg">{book.title}</h3>
                                        <p className="text-gray-600 text-sm">{book.author}</p>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Progress</span>
                                                <span>{book.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-indigo-600 h-2 rounded-full" 
                                                    style={{ width: `${book.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex space-x-2">
                                            <Link 
                                                href={`/books/${book.id}`}
                                                className="flex-1 py-1 px-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 text-center"
                                            >
                                                View
                                            </Link>
                                            <button 
                                                onClick={() => generateTasks(book.id)}
                                                disabled={generatingTasks[book.id]}
                                                className="flex-1 py-1 px-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {generatingTasks[book.id] ? 'Generating...' : 'AI Tasks'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 flex justify-center space-x-2">
                        {links.map(link => 
                            link.url ? (
                                <Link
                                key={link.label}
                                href={link.url}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1 rounded border text-sm transition ${
                                    link.active
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                                />
                            
                        ): (
                            <span
                            key={link.label}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className="px-3 py-1 rounded border text-sm bg-white text-gray-400 border-gray-300"
                            />
                        )
                        )}
                    </div>

        </div>
        </>
    )
}

Index.layout = page  => <AppLayout children={page} title="Books" />;
export default Index; 