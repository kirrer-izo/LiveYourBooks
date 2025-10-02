import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head } from "@inertiajs/react";

const Index = () => {
    const [user, setUser] = React.useState({
                name: "John Doe",
                email: "john@example.com",
                avatar: "http://static.photos/people/200x200/42",
                streak: 7,
                booksRead: 12,
                habitsCompleted: 85
            });
              const [editMode, setEditMode] = React.useState(false);
            const [formData, setFormData] = React.useState({
                name: user.name,
                email: user.email,
                avatar: user.avatar
            });

            const handleChange = (e) => {
                const { name, value } = e.target;
                setFormData(prev => ({ ...prev, [name]: value }));
            };

            const handleSubmit = (e) => {
                e.preventDefault();
                setUser(formData);
                setEditMode(false);
            };
    return (
        <>
        <Head title="Profile - Live Your Books" />
        <div data-aos="fade-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Profile Settings</h2>
                        {!editMode && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        {editMode ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex flex-col items-center">
                                    <img 
                                        src={formData.avatar} 
                                        alt="Profile" 
                                        className="w-24 h-24 rounded-full mb-4 object-cover"
                                    />
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={formData.avatar}
                                        onChange={handleChange}
                                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Profile image URL"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center">
                                    <img 
                                        src={user.avatar} 
                                        alt="Profile" 
                                        className="w-24 h-24 rounded-full mb-4 object-cover"
                                    />
                                    <h3 className="text-xl font-semibold">{user.name}</h3>
                                    <p className="text-gray-600">{user.email}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium mb-2">Account Information</h4>
                                        <div className="space-y-2">
                                            <p className="text-sm"><span className="text-gray-500">Member since:</span> May 2023</p>
                                            <p className="text-sm"><span className="text-gray-500">Last login:</span> Today</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium mb-2">Preferences</h4>
                                        <div className="space-y-2">
                                            <p className="text-sm"><span className="text-gray-500">Theme:</span> Light</p>
                                            <p className="text-sm"><span className="text-gray-500">Notifications:</span> Enabled</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        </>
    )
}

Index.layout = page => <AppLayout children={page} title="Profile - Live Your Books" />
export default Index;