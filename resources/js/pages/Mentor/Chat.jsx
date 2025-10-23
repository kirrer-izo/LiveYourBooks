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

  const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

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
        body: JSON.stringify({ conversation_id: conversationId, content, book_id: bookId ? Number(bookId) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create tasks');
    } catch (e) {
      setError(e.message || String(e));
    }
  };

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
            <label className="text-sm text-gray-600 dark:text-gray-300">Book (optional)</label>
            <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">Select a book</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title} {b.author ? `— ${b.author}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 dark:text-gray-300">Mentor (Author, optional)</label>
            <select value={mentorName} onChange={(e) => setMentorName(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">Select an author</option>
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
                  <li key={c.id}>
                    <button
                      className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white ${conversationId === c.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      onClick={() => loadConversation(c.id)}
                    >
                      {c.title || `Conversation ${c.id}`}
                    </button>
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
                  <div key={i} className="space-y-1">
                    <div className={m.role === "user" ? "text-right" : "text-left"}>
                      <div className={`inline-block px-3 py-2 rounded ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                        {m.content}
                      </div>
                    </div>
                    {m.role === 'assistant' && (
                      <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <button type="button" className="underline hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => saveToJournal(m.content)}>Save to Journal</button>
                        <span>•</span>
                        <button type="button" className="underline hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => createTasksFromReply(m.content)}>Create Tasks</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

        <form onSubmit={send} className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Ask your mentor..."
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
