import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head } from "@inertiajs/react";

const Index = () => {
  const journals = [
    {
      id: 1,
      date: "2023-05-15",
      title: "Today's Reflection",
      preview: "Today I learned about...",
      tags: ["Reflection"],
    },
    {
      id: 2,
      date: "2023-05-14",
      title: "Habit Progress",
      preview: "I'm noticing improvements in...",
      tags: ["Progress", "Challenge"],
    },
  ];

  const [journalEntries, setJournalEntries] = React.useState(journals);
  const [showEditor, setShowEditor] = React.useState(false);
  const [currentEntry, setCurrentEntry] = React.useState(null);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredEntries = journalEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!title || !content) return;

    if (currentEntry) {
      // Update existing entry
      setJournalEntries(
        journalEntries.map((entry) =>
          entry.id === currentEntry.id
            ? {
                ...entry,
                title,
                preview: content.substring(0, 50) + "...",
                tags,
              }
            : entry
        )
      );
    } else {
      // Add new entry
      const newEntry = {
        id: journalEntries.length + 1,
        date: new Date().toISOString().split("T")[0],
        title,
        preview: content.substring(0, 50) + "...",
        tags,
      };
      setJournalEntries([...journalEntries, newEntry]);
    }

    setShowEditor(false);
    setCurrentEntry(null);
    setTitle("");
    setContent("");
    setTags([]);
  };

  const handleEditEntry = (entry) => {
    setCurrentEntry(entry);
    setTitle(entry.title);
    setContent(entry.preview.replace("...", ""));
    setTags(entry.tags || []);
    setShowEditor(true);
  };

  const handleDeleteEntry = (id) => {
    setJournalEntries(journalEntries.filter((entry) => entry.id !== id));
  };

  return (
    <>
      <Head title="Journals - Live Your Books" />
      <div data-aos="fade-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold mb-4 md:mb-0">Journal & Reflection</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search journals..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i
                data-feather="search"
                className="absolute left-3 top-2.5 text-gray-400"
              ></i>
            </div>
            <button
              onClick={() => {
                setCurrentEntry(null);
                setTitle("");
                setContent("");
                setTags([]);
                setShowEditor(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              New Entry
            </button>
          </div>
        </div>

        {showEditor ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {currentEntry ? "Edit Journal Entry" : "New Journal Entry"}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <i data-feather="x"></i>
              </button>
            </div>
            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Write your thoughts here..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Reflection", "Insight", "Progress", "Challenge"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                      className={`px-3 py-1 rounded-full text-sm ${
                        tags.includes(tag)
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {filteredEntries.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
                <i
                  data-feather="edit"
                  className="w-12 h-12 mx-auto text-gray-400"
                ></i>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No journal entries yet
                </h3>
                <p className="mt-1 text-gray-500">
                  Start by creating your first journal entry
                </p>
                <button
                  onClick={() => setShowEditor(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  New Entry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{entry.title}</h3>
                      <span className="text-sm text-gray-500">{entry.date}</span>
                    </div>
                    <p className="mt-3 text-gray-600">{entry.preview}</p>
                    <div className="mt-4 flex justify-between items-center">
                      {/* Show tags */}
                      <div className="flex space-x-2">
                        {entry.tags &&
                          entry.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <i data-feather="edit-2" className="w-4 h-4"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <i data-feather="trash-2" className="w-4 h-4"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

Index.layout = (page) => <AppLayout children={page} title="Journals" />;
export default Index;
