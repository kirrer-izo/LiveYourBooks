import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "../../layouts/AppLayout";

export default function PasswordSettings() {
  const { data, setData, put, processing, errors, reset } = useForm({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const submit = (e) => {
    e.preventDefault();
    put("/settings/password", {
      onSuccess: () => {
        reset("current_password", "password", "password_confirmation");
      },
    });
  };

  return (
    <>
      <Head title="Password Settings" />
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Change Password</h2>
            <Link href="/settings/profile" className="text-sm text-indigo-600 hover:text-indigo-700">Back to Profile</Link>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={data.current_password}
                onChange={(e) => setData("current_password", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.current_password && (
                <p className="text-sm text-red-600 mt-1">{errors.current_password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={data.password_confirmation}
                onChange={(e) => setData("password_confirmation", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/settings/profile" className="px-4 py-2 border rounded-md">Cancel</Link>
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

PasswordSettings.layout = (page) => <AppLayout children={page} title="Password Settings" />;
