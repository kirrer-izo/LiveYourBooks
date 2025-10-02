import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head } from "@inertiajs/react";

const Index = () => {
  // Example data
  const books = [
    { id: 1, title: "Atomic Habits", author: "James Clear" },
    { id: 2, title: "Deep Work", author: "Cal Newport" },
    { id: 3, title: "The Power of Now", author: "Eckhart Tolle" },
  ];

  const mentors = [
    { id: "james-clear", name: "James Clear" },
    { id: "cal-newport", name: "Cal Newport" },
    { id: "eckhart-tolle", name: "Eckhart Tolle" },
  ];

  const [selectedBook, setSelectedBook] = React.useState(books[0].id);
  const [selectedMentor, setSelectedMentor] = React.useState(mentors[0].id);

  // Load session history from localStorage
  const storedMessages = JSON.parse(localStorage.getItem("mentorChatHistory") || "[]");
  const [chatMessages, setChatMessages] = React.useState(storedMessages);

  const [message, setMessage] = React.useState("");

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    const newMessage = {
      id: chatMessages.length + 1,
      sender: "user",
      text: message,
      book: books.find((b) => b.id === selectedBook).title,
      mentor: mentors.find((m) => m.id === selectedMentor).name,
    };

    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    localStorage.setItem("mentorChatHistory", JSON.stringify(updatedMessages));

    setMessage("");

    // Simulate AI response in selected mentor’s voice
    setTimeout(() => {
      const aiResponse = {
        id: updatedMessages.length + 1,
        sender: "ai",
        text: `(${mentors.find((m) => m.id === selectedMentor).name}): Great point about "${newMessage.book}". I’d recommend focusing on...`,
        book: newMessage.book,
        mentor: newMessage.mentor,
      };

      const updatedWithAI = [...updatedMessages, aiResponse];
      setChatMessages(updatedWithAI);
      localStorage.setItem("mentorChatHistory", JSON.stringify(updatedWithAI));
    }, 1000);
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
            {/* Book selector */}
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
            {/* Mentor selector */}
            <select
              value={selectedMentor}
              onChange={(e) => setSelectedMentor(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name}
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
                  <p>{msg.text}</p>
                </div>
              </div>
            ))
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
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <i data-feather="send"></i>
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

Index.layout = (page) => <AppLayout children={page} title="Mentor Chat" />;
export default Index;
