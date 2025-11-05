import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, router, usePage, Link } from "@inertiajs/react";

const Index = () => {
  const { props } = usePage();
  const books = Array.isArray(props.books) ? props.books : [];
  const authors = Array.isArray(props.authors) ? props.authors : [];
  const initialBookId = props.selectedBookId || (books[0]?.id ?? null);

  const [selectedBookId, setSelectedBookId] = React.useState(initialBookId);
  const [selectedAuthor, setSelectedAuthor] = React.useState(
    books.find(b => b.id === initialBookId)?.author || (authors[0] || "")
  );

  // Load session history from localStorage
  const storageKeyFor = (bookId) => `mentorChatHistory:${bookId || 'global'}`;
  const loadHistory = (bookId) => {
    try {
      return JSON.parse(localStorage.getItem(storageKeyFor(bookId)) || "[]");
    } catch {
      return [];
    }
  };
  const [chatMessages, setChatMessages] = React.useState(loadHistory(initialBookId));

  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const getCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    const bookObj = books.find((b) => b.id === selectedBookId) || {};
    const effectiveAuthor = selectedAuthor || bookObj.author || "";

    const newMessage = {
      id: chatMessages.length + 1,
      sender: "user",
      text: message,
      book: bookObj.title || "",
      mentor: effectiveAuthor,
    };

    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    localStorage.setItem(storageKeyFor(selectedBookId), JSON.stringify(updatedMessages));

    setMessage("");
    setLoading(true);
    setError("");

    fetch("/api/mentor-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCsrfToken(),
        "Accept": "application/json",
      },
      body: JSON.stringify({
        message: newMessage.text,
        book: newMessage.book,
        mentor: newMessage.mentor,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Request failed");
        }
        const reply = data?.reply || "I'm unable to respond right now.";
        const aiResponse = {
          id: updatedMessages.length + 1,
          sender: "ai",
          text: reply,
          book: newMessage.book,
          mentor: newMessage.mentor,
        };
        const updatedWithAI = [...updatedMessages, aiResponse];
        setChatMessages(updatedWithAI);
        localStorage.setItem(storageKeyFor(selectedBookId), JSON.stringify(updatedWithAI));
      })
      .catch((err) => {
        setError(err.message || "Something went wrong");
      })
      .finally(() => setLoading(false));
  };

  const handleBookChange = (e) => {
    const id = e.target.value ? Number(e.target.value) : null;
    setSelectedBookId(id);
    // Navigate to per-book chat screen
    if (id) {
      router.get(`/mentors/${id}`, {}, { preserveState: false, replace: true });
    }
  };

  return (
    <>
      <Head title="Mentor Chat - Live Your Books" />
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
        data-aos="fade-up"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <i data-feather="message-square" className="mr-2 text-indigo-600"></i>
            AI Mentor
          </h2>
          <div className="flex space-x-2">
            {/* Book selector (from DB) */}
            <select
              value={selectedBookId ?? ''}
              onChange={handleBookChange}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
            {/* Author selector (from DB) */}
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {authors.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat history */}
        <div className="chat-height overflow-y-auto p-4 bg-gray-50">
          {chatMessages.length === 0 ? (
            <p className="text-center text-gray-500">No messages yet. Start a conversation!</p>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p className="text-xs text-gray-400 italic mb-1">
                    {msg.book} • {msg.mentor}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          {error && (
            <p className="text-center text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your AI mentor a question..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '...' : <i data-feather="send"></i>}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

Index.layout = (page) => <AppLayout children={page} title="Mentor Chat" />;
export default Index;
