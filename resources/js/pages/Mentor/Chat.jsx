import React from "react";
import { Head, usePage } from "@inertiajs/react";
import AppLayout from "../../layouts/AppLayout";

const Chat = () => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [conversationId, setConversationId] = React.useState(null);
  const { props } = usePage();
  const books = props.books || [];
  const mentors = props.mentors || [];
  const [bookId, setBookId] = React.useState("");
  const [mentorName, setMentorName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [conversations, setConversations] = React.useState([]);
  const [loadingConvs, setLoadingConvs] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [editingTitle, setEditingTitle] = React.useState('');
  const [deletingId, setDeletingId] = React.useState(null);

  const fetchConversations = async () => {
    try {
      setLoadingConvs(true);
      const res = await fetch('/api/conversations', { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      // ignore UI error here; sidebar is optional
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadConversation = async (id) => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/conversations/${id}`, { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load conversation');
      const data = await res.json();
      setConversationId(data.conversation?.id || id);
      const msgs = (data.messages || []).map(m => ({ role: m.role, content: m.content }));
      setMessages(msgs);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchConversations(); }, []);

  const handleEditTitle = (conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title || '');
  };

  const handleSaveTitle = async (conversationId) => {
    try {
      const csrf = csrfToken();
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update title');
      }

      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, title: editingTitle.trim() }
          : c
      ));
      setEditingId(null);
      setEditingTitle('');
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDeleteConversation = async (idToDelete) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(idToDelete);
      const csrf = csrfToken();
      const res = await fetch(`/api/conversations/${idToDelete}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
        },
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete conversation');
      }

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== idToDelete));
      
      // If deleted conversation was active, clear it
      if (conversationId === idToDelete) {
        setConversationId(null);
        setMessages([]);
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setDeletingId(null);
    }
  };

  const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  
  // Auto-scroll to bottom when messages change
  const messagesEndRef = React.useRef(null);
  
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError("");

    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
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
          book_id: bookId ? Number(bookId) : undefined,
          mentor: mentorName || undefined,
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
      if (!conversationId && newConvId) {
        // refresh sidebar to include the new conversation
        fetchConversations();
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setInput("");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head title="Mentor Chat - Live Your Books" />
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mentor Chat</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book (optional)</label>
            <select 
              value={bookId} 
              onChange={(e) => setBookId(e.target.value)} 
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a book to discuss</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title} {b.author ? `— ${b.author}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author (optional)</label>
            <select 
              value={mentorName} 
              onChange={(e) => setMentorName(e.target.value)} 
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select an author to discuss</option>
              {mentors.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 md:col-span-3 border border-gray-300 dark:border-gray-600 rounded p-3 bg-white dark:bg-gray-800 h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900 dark:text-white">Conversations</div>
              {loadingConvs && <div className="text-xs text-gray-500 dark:text-gray-400">Loading…</div>}
            </div>
            {conversations.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">No conversations yet</div>
            ) : (
              <ul className="space-y-1">
                {conversations.map(c => (
                  <li key={c.id} className="group">
                    {editingId === c.id ? (
                      <div className="flex items-center gap-1 px-2 py-1">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle(c.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTitle(c.id)}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          title="Save"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${conversationId === c.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                        <button
                          className="flex-1 text-left text-gray-900 dark:text-white text-sm"
                          onClick={() => loadConversation(c.id)}
                          disabled={deletingId === c.id}
                        >
                          {c.title || `Conversation ${c.id}`}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTitle(c);
                            }}
                            className="px-1.5 py-0.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                            title="Edit title"
                            disabled={deletingId === c.id}
                          >
                            ✎
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(c.id);
                            }}
                            className="px-1.5 py-0.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                            title="Delete conversation"
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id ? '...' : '🗑'}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>
          <section className="col-span-12 md:col-span-9 border border-gray-300 dark:border-gray-600 rounded p-3 h-96 overflow-y-auto bg-white dark:bg-gray-800">
            {messages.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">Start a conversation by sending a message.</div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i}>
                    <div className={m.role === "user" ? "text-right" : "text-left"}>
                      <div className={`inline-block px-3 py-2 rounded max-w-[80%] ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="text-left">
                    <div className="inline-block px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </section>
        </div>

        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

        <form onSubmit={send} className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Ask about books, authors, or any topic..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded disabled:opacity-50">
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </>
  );
};

Chat.layout = (page) => <AppLayout children={page} title="Mentor Chat" />;
export default Chat;
