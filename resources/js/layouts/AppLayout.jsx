import { useState } from "react";
import { Bell, Sun, Moon, ChevronLeft, ChevronRight, Home, Book, Brain, BookOpenCheck, PersonStanding, Notebook, ChartSpline, User } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

export default function AppLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { url } = usePage(); // current route from Inertia

  const navItems = [
    { name: "Dashboard", href: '/dashboard', icon: <Home className="mr-3" /> },
    { name: "Books", href: '/books', icon: <Book className="mr-3" /> },
    { name: "AI Mentor", href: '/mentors-chat', icon: <Brain className="mr-3" /> },
    { name: "Task Generator", href: '/tasks', icon: <BookOpenCheck className="mr-3" /> },
    { name: "Habit Tracker", href: '/habits', icon: <PersonStanding className="mr-3" /> },
    { name: "Journal", href: '/journals', icon: <Notebook className="mr-3" /> },
    { name: "Analytics", href: '/analytics', icon: <ChartSpline className="mr-3" /> },
    { name: "Profile", href: '/profile', icon: <User className="mr-3" /> },
  ];
  

  const user = {
    name: "John Doe",
    avatar: "https://i.pravatar.cc/150?img=3",
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-64" : "w-20"} sidebar-transition bg-indigo-700 text-white flex flex-col`}>
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">{sidebarOpen ? "Live Your Books" : "LYB"}</h1>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-md hover:bg-indigo-600">
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
                      url === item.href ? "bg-indigo-800" : "hover:bg-indigo-600"
                    } transition-colors`}
                  >
                    {item.icon}
                    {sidebarOpen && item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-indigo-600">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center w-full p-2 rounded hover:bg-indigo-600"
            >
              {darkMode ? <Sun className="mr-3" /> : <Moon className="mr-3" />}
              {sidebarOpen && (darkMode ? "Light Mode" : "Dark Mode")}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Top Navigation */}
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-xl font-semibold capitalize">
                {url.split("/") [1]?.split("?")[0] || "dashboard"}
              </h2>
              <div className="flex items-center space-x-4">
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <Bell />
                </button>
                <div className="flex items-center space-x-2">
                  <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full" />
                  {sidebarOpen && <span className="font-medium">{user.name}</span>}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
