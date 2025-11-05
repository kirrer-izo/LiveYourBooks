import React from "react";

const AIBookChat = ({ book, onClose, className = "" }) => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [conversationId, setConversationId] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError("");

    try {
      const csrf = csrfToken();
      const res = await fetch("/api/mentor-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          message: input,
          conversation_id: conversationId,
          book_id: book?.id ? Number(book.id) : undefined,
        }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (_) {
        const txt = await res.text();
        throw new Error(txt || "AI service error");
      }
      
      if (!res.ok) throw new Error(data?.error || "AI service error");
      
      const newConvId = data.conversation_id ?? conversationId;
      setConversationId(newConvId);
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setInput("");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const saveToJournal = async (content) => {
    try {
      setError("");
      const csrf = csrfToken();
      const res = await fetch('/api/journals/from-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ conversation_id: conversationId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save journal');
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const createTasksFromReply = async (content) => {
    try {
      setError("");
      const csrf = csrfToken();
      const res = await fetch('/api/tasks/from-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ conversation_id: conversationId, content, book_id: book?.id ? Number(book.id) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create tasks');
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Book Assistant
            </h3>
            {book && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ask questions about "{book.title}" by {book.author}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p>Ask me anything about this book!</p>
            <p className="text-sm mt-1">I can help you understand concepts, create tasks, and provide personalized advice based on your habits and goals.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block px-3 py-2 rounded-lg max-w-xs lg:max-w-md ${
                  m.role === "user" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
              {m.role === 'assistant' && (
                <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400 ml-1">
                  <button 
                    type="button" 
                    className="underline hover:text-indigo-600 dark:hover:text-indigo-400" 
                    onClick={() => saveToJournal(m.content)}
                  >
                    Save to Journal
                  </button>
                  <span>•</span>
                  <button 
                    type="button" 
                    className="underline hover:text-indigo-600 dark:hover:text-indigo-400" 
                    onClick={() => createTasksFromReply(m.content)}
                  >
                    Create Tasks
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        </div>
      )}

      <form onSubmit={send} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ask about this book..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            disabled={loading || !input.trim()} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIBookChat;
