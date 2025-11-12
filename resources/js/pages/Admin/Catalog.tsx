import React, { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';

type CatalogEntry = {
  id: number;
  title: string;
  author?: string | null;
  genre?: string | null;
  life_area?: string | null;
  isbn?: string | null;
  description?: string | null;
  is_featured?: boolean;
};

type PaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

type CatalogProps = {
  entries: {
    data: CatalogEntry[];
    links: PaginationLink[];
  };
  filters: {
    search?: string;
    featured?: boolean | string;
  };
};

function Pagination({ links }: { links: PaginationLink[] }) {
  if (!links?.length) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {links.map((link, idx) => (
        <button
          key={`${idx}-${link.label}`}
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

function AdminCatalog({ entries, filters }: CatalogProps) {
  const [search, setSearch] = useState(filters.search ?? '');

  const applySearch = () =>
    router.get('/admin/catalog', { search: search || undefined }, { replace: true, preserveScroll: true, preserveState: true });

  return (
    <>
      <Head title="Book Catalog" />
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Central Catalog</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Browse and manage the catalog.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="button"
              onClick={applySearch}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              Search
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Title</th>
                  <th className="px-6 py-3 font-semibold">Author</th>
                  <th className="px-6 py-3 font-semibold">Genre</th>
                  <th className="px-6 py-3 font-semibold">Life Area</th>
                  <th className="px-6 py-3 font-semibold">ISBN</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      No entries found.
                    </td>
                  </tr>
                )}
                {entries.data.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4">{entry.title}</td>
                    <td className="px-6 py-4">{entry.author ?? '—'}</td>
                    <td className="px-6 py-4">{entry.genre ?? '—'}</td>
                    <td className="px-6 py-4">{entry.life_area ?? '—'}</td>
                    <td className="px-6 py-4">{entry.isbn ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-indigo-400 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                          onClick={() => router.visit(`/admin/catalog?search=${encodeURIComponent(entry.title)}`)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/20"
                          onClick={() => router.delete(`/admin/catalog/${entry.id}`, { preserveScroll: true })}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4">
            <Pagination links={entries.links} />
          </div>
        </section>
      </div>
    </>
  );
}

export default Object.assign(AdminCatalog, {
  layout: (page: React.ReactNode) => <AppLayout>{page}</AppLayout>,
});