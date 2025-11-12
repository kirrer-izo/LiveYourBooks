import AppLayout from '@/layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

type Book = {
  id: number;
  title: string;
  author?: string | null;
  genre?: string | null;
  life_area?: string | null;
  isbn?: string | null;
  description?: string | null;
  is_featured?: boolean;
  created_at?: string | null;
};

type PaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

type PageProps = {
  books: {
    data: Book[];
    links: PaginationLink[];
  };
  filters: {
    search?: string;
  };
};

function Pagination({ links }: { links: PaginationLink[] }) {
  if (!links?.length) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {links.map((link, i) => (
        <button
          key={`${i}-${link.label}`}
          type="button"
          disabled={!link.url}
          className={`px-3 py-1 rounded-md text-xs ${
            link.active
              ? 'bg-indigo-600 text-white'
              : link.url
              ? 'bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'text-slate-400 cursor-not-allowed'
          }`}
          onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ))}
    </div>
  );
}

function AdminBooks({ books, filters }: PageProps) {
  const [search, setSearch] = useState(filters.search ?? '');

  const createForm = useForm({
    title: '',
    author: '',
    genre: '',
    life_area: '',
  });

  const editForms = new Map<number, ReturnType<typeof useForm>>();

  const applySearch = () =>
    router.get('/admin/books', { search: search || undefined }, { replace: true, preserveScroll: true, preserveState: true });

  const handleDelete = (id: number) => {
    if (!confirm('Delete this book?')) return;
    router.delete(`/admin/books/${id}`, { preserveScroll: true });
  };

  return (
    <>
      <Head title="Books" />

      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Books</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage the platform's books.</p>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                router.get('/admin/books', {}, { replace: true, preserveScroll: true, preserveState: false });
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </form>
        </header>

        {/* Create */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Book</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createForm.post('/admin/books', {
                preserveScroll: true,
                onSuccess: () => createForm.reset(),
              });
            }}
            className="px-6 py-4 grid gap-4 md:grid-cols-2"
          >
            <label className="text-sm">
              <span className="block text-slate-600 dark:text-slate-300">Title</span>
              <input
                required
                value={createForm.data.title}
                onChange={(e) => createForm.setData('title', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {createForm.errors.title && <span className="text-xs text-rose-500">{createForm.errors.title}</span>}
            </label>
            <label className="text-sm">
              <span className="block text-slate-600 dark:text-slate-300">Author</span>
              <input
                value={createForm.data.author}
                onChange={(e) => createForm.setData('author', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600 dark:text-slate-300">Genre</span>
              <input
                value={createForm.data.genre}
                onChange={(e) => createForm.setData('genre', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600 dark:text-slate-300">Life Area</span>
              <input
                value={createForm.data.life_area}
                onChange={(e) => createForm.setData('life_area', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => createForm.reset()}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={createForm.processing}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All Books</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Title</th>
                  <th className="px-6 py-3 font-semibold">Author</th>
                  <th className="px-6 py-3 font-semibold">Genre</th>
                  <th className="px-6 py-3 font-semibold">Life Area</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {books.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">No books found.</td>
                  </tr>
                )}
                {books.data.map((book) => (
                  <tr key={book.id}>
                    <td className="px-6 py-4">{book.title}</td>
                    <td className="px-6 py-4">{book.author ?? '—'}</td>
                    <td className="px-6 py-4">{book.genre ?? '—'}</td>
                    <td className="px-6 py-4">{book.life_area ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-indigo-400 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                          onClick={() => router.visit(`/books/${book.id}`)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/20"
                          onClick={() => handleDelete(book.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4">
            <Pagination links={books.links} />
          </div>
        </section>
      </div>
    </>
  );
}

export default Object.assign(AdminBooks, {
  layout: (page: React.ReactNode) => <AppLayout>{page}</AppLayout>,
});
