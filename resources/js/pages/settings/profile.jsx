import React, { useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import AppLayout from "../../layouts/AppLayout";

export default function ProfileSettings() {
  const { auth, mustVerifyEmail, status } = usePage().props;
  const user = auth?.user || {};

  const { data, setData, patch, processing, errors, delete: destroy } = useForm({
    name: user.name || "",
    email: user.email || "",
    avatar: null,
  });

  const [showDelete, setShowDelete] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    patch('/settings/profile');
  };

  const deleteAccount = (e) => {
    e.preventDefault();
    const pwd = prompt("Confirm your password to delete the account:");
    if (!pwd) return;
    destroy('/settings/profile', { data: { password: pwd } });
  };

  return (
    <>
      <Head title="Profile Settings" />
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Profile</h2>
            <Link href="/settings/password" className="text-sm text-indigo-600 hover:text-indigo-700">Change Password</Link>
          </div>
          <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                {mustVerifyEmail && (
                  <p className="text-xs text-gray-500 mt-1">Email change requires re-verification.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                <div className="flex items-center gap-4">
                  <img
                    src={data.avatar ? URL.createObjectURL(data.avatar) : (user.avatar || 'https://i.pravatar.cc/100')}
                    alt="Avatar Preview"
                    className="w-14 h-14 rounded-full object-cover border"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData('avatar', e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 hover:file:bg-gray-200"
                  />
                </div>
                {errors.avatar && <p className="text-sm text-red-600 mt-1">{errors.avatar}</p>}
                <p className="text-xs text-gray-500 mt-1">PNG/JPG up to 2MB.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/dashboard" className="px-4 py-2 border rounded-md">Cancel</Link>
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">Deleting your account is irreversible.</p>
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Account
          </button>
          {showDelete && (
            <div className="mt-4 p-4 border rounded-md bg-red-50">
              <p className="text-sm text-red-800 mb-3">Type your password in the prompt to confirm deletion.</p>
              <div className="flex items-center gap-3">
                <button onClick={deleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirm Delete</button>
                <button onClick={() => setShowDelete(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

ProfileSettings.layout = (page) => <AppLayout children={page} title="Profile" />;
