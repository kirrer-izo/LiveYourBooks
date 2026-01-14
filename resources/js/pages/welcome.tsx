import { login, register } from '@/routes';

import { Head, Link } from '@inertiajs/react';

export default function Welcome() {


  return (
    <>
      <Head title="Welcome">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>


      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 6v12a2 2 0 0 0 2 2h12V4H6a2 2 0 0 0-2 2zM8 8h8v2H8V8zm0 4h8v2H8v-2z" />
          </svg>
          <div>
            <h1 className="text-xl font-semibold">Live Your Books</h1>
            <p className="text-sm text-slate-500">Turn reading into action</p>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link href={login().url} className="text-sm font-medium text-slate-700 hover:underline">Log in</Link>
          <Link href={register().url} className="ml-2 inline-flex items-center px-4 py-2 rounded-md bg-blue-500 text-white text-sm font-semibold shadow hover:bg-blue-600">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center py-20 px-6">
        <section className="max-w-4xl w-full bg-white/80 ring-1 ring-slate-200 rounded-2xl shadow-lg p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900">Apply what you read</h2>
              <p className="mt-4 text-lg text-slate-600">
                Live Your Books helps you transform book ideas into daily habits, tasks, and journaled progress guided by AI mentors inspired by the authors you love.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="inline-block mt-1 w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Save books, extract actionable tasks, and track habits.
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block mt-1 w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Chat with AI mentors that emulate book authors.
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block mt-1 w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Journals, tags, and progress reports to keep you accountable.
                </li>
              </ul>

              <div className="mt-8 flex gap-3">
                <Link href={register().url} className="inline-flex items-center px-5 py-3 bg-blue-500 text-white rounded-md font-semibold shadow hover:bg-blue-600">
                  Get started
                </Link>
                <Link href={login().url} className="inline-flex items-center px-5 py-3 border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50">
                  Explore demo
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-xl border border-slate-100">
              <div className="space-y-4">
                <div className="rounded-md bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800">AI Mentor Chat</h3>
                  <p className="mt-2 text-sm text-slate-600">Ask questions tied to a book or mentor and receive contextualized, book-grounded advice.</p>
                </div>

                <div className="rounded-md bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800">Habit Tracker</h3>
                  <p className="mt-2 text-sm text-slate-600">Create habits linked to tasks generated from chapters and track streaks over time.</p>
                </div>

                <div className="rounded-md bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800">Journal</h3>
                  <p className="mt-2 text-sm text-slate-600">Log reflections, tag entries, and generate weekly progress summaries.</p>
                </div>
              </div>

              <footer className="mt-6 text-xs text-slate-500">
                By signing up you agree to our <a href="{{ route('terms') }}" className="underline">Terms</a> and <a href="{{ route('privacy') }}" className="underline">Privacy Policy</a>.
              </footer>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          © {new Date().toLocaleDateString()}Live Your Books. All rights reserved.
        </div>
      </footer>

    </>
  );
}

