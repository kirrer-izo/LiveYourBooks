import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { PencilLine, Trash2, Search } from "lucide-react";
import DatePicker from "../../components/ui/date-picker";

const Index = ({ journals, filters, availableTags }) => {
  const list = Array.isArray(journals?.data) ? journals.data : [];
  const links = journals?.links || [];

  const [searchTerm, setSearchTerm] = React.useState(filters?.search || '');
  const [selectedTag, setSelectedTag] = React.useState(filters?.tag || '');
  const [selectedDate, setSelectedDate] = React.useState(filters?.date || '');

  const { delete: destroy } = useForm();

  // Update filters when they change
  React.useEffect(() => {
    const params = {
      search: searchTerm || undefined,
      tag: selectedTag || undefined,
      date: selectedDate || undefined,
    };
    router.get('/journals', params, { preserveState: true, replace: true, preserveScroll: true });
  }, [searchTerm, selectedTag, selectedDate]);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      destroy(`/journals/${id}`);
    }
  };


  return (
    <>
      <Head title="Journals - Live Your Books" />
      <div data-aos="fade-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold mb-4 md:mb-0">Journal & Reflection</h2>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search journals..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {availableTags && availableTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <DatePicker
              value={selectedDate}
              onChange={(value) => setSelectedDate(value)}
              className="w-full sm:w-auto"
            />
            <Link
              href="/journals/create"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
            >
              New Entry
            </Link>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
            <PencilLine className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No journal entries found
            </h3>
            <p className="mt-1 text-gray-500">
              {searchTerm || selectedTag || selectedDate 
                ? 'Try adjusting your filters or create a new entry'
                : 'Start by creating your first journal entry'
              }
            </p>
            <Link
              href="/journals/create"
              className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              New Entry
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6">
              {list.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link 
                        href={`/journals/${entry.id}`}
                        className="text-lg font-semibold hover:text-indigo-600"
                      >
                        {entry.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(entry.entry_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/journals/${entry.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <PencilLine className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {entry.content && (
                    <p className="mt-3 text-gray-600 line-clamp-3">
                      {entry.content.length > 200 
                        ? entry.content.substring(0, 200) + '...' 
                        : entry.content
                      }
                    </p>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {entry.tags && entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {links.length > 3 && (
              <div className="mt-6 flex justify-center space-x-2">
                {links.map((link, index) => 
                  link.url ? (
                    <Link
                      key={index}
                      href={link.url}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      className={`px-3 py-1 rounded border text-sm transition ${
                        link.active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    />
                  ) : (
                    <span
                      key={index}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      className="px-3 py-1 rounded border text-sm bg-white text-gray-400 border-gray-300"
                    />
                  )
                )}
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
