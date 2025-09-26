'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure your organization and user preferences
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="divide-y divide-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Organization Settings
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Manage your organization's basic information and preferences.
                </p>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Organization
                </button>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Preferences
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Update your personal settings and preferences.
                </p>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Security
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Manage your account security settings and two-factor authentication.
                </p>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Security Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}