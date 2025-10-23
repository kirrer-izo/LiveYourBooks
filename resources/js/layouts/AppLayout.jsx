import { useState, useEffect } from "react";
import { Bell, Sun, Moon, ChevronLeft, ChevronRight, Home, Book, Brain, BookOpenCheck, PersonStanding, Notebook, ChartSpline, User } from "lucide-react";
import { Link, usePage, router } from "@inertiajs/react";

export default function AppLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize dark mode from localStorage and apply to document
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, []);

  // Toggle dark mode and persist to localStorage
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const { url, props } = usePage(); // current route and props from Inertia

  const navItems = [
    { name: "Dashboard", href: '/dashboard', icon: <Home className="mr-3" /> },
    { name: "Books", href: '/books', icon: <Book className="mr-3" /> },
    { name: "AI Mentor", href: '/mentor/chat', icon: <Brain className="mr-3" /> },
    { name: "Task Generator", href: '/tasks', icon: <BookOpenCheck className="mr-3" /> },
    { name: "Habit Tracker", href: '/habits', icon: <PersonStanding className="mr-3" /> },
    { name: "Journal", href: '/journals', icon: <Notebook className="mr-3" /> },
    { name: "Analytics", href: '/analytics', icon: <ChartSpline className="mr-3" /> },
    { name: "Profile", href: '/profile', icon: <User className="mr-3" /> },
  ];
  // Pull authenticated user from shared Inertia props (fallback for dev)
  const user = props?.auth?.user ?? {
    name: "User",
    avatar: "https://i.pravatar.cc/150?img=3",
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-64" : "w-20"} sidebar-transition bg-indigo-700 dark:bg-indigo-800 text-white flex flex-col`}>
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">{sidebarOpen ? "Live Your Books" : "LYB"}</h1>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-700">
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </button>
          </div>

          <nav className="flex-1 mt-6">
            <ul>
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`w-full flex items-center p-3 ${
                      url === item.href ? "bg-indigo-800 dark:bg-indigo-900" : "hover:bg-indigo-600 dark:hover:bg-indigo-700"
                    } transition-colors`}
                  >
                    {item.icon}
                    {sidebarOpen && item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-indigo-600 dark:border-indigo-500">
            <button
              onClick={toggleDarkMode}
              className="flex items-center w-full p-2 rounded hover:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {darkMode ? <Sun className="mr-3" /> : <Moon className="mr-3" />}
              {sidebarOpen && (darkMode ? "Light Mode" : "Dark Mode")}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Top Navigation */}
          <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg md:text-xl font-semibold capitalize truncate text-gray-900 dark:text-white">
                {url.split("/") [1]?.split("?")[0] || "dashboard"}
              </h2>
              <div className="flex items-center space-x-3 md:space-x-4">
                {/* Notifications */}
                <button aria-label="Notifications" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <Bell className="h-5 w-5" />
                </button>
                {/* User */}
                <Link href="/profile" className="flex items-center space-x-2">
                  <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full" />
                  {/* Show username on md+ screens */}
                  <span className="hidden md:block font-medium max-w-[10rem] truncate text-gray-900 dark:text-white">{user.name}</span>
                </Link>
                {/* Logout */}
                <button
                  onClick={() => router.post('/logout')}
                  className="hidden sm:inline-flex px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Log out
                </button>
              </div>
            </div>
          </header>

          {/* Flash Messages */}
          {props?.flash?.success && (
            <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              {props.flash.success}
            </div>
          )}
          {props?.flash?.error && (
            <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {props.flash.error}
            </div>
          )}
          {props?.flash?.info && (
            <div className="mx-6 mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              {props.flash.info}
            </div>
          )}

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
