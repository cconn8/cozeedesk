'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardIcon } from '@/components/ui/Card';

interface Tenant {
  id: string;
  businessName: string;
  plan: string;
}

export default function Dashboard() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subdomain, setSubdomain] = useState<string>('');

  useEffect(() => {
    const storedTenant = localStorage.getItem('tenant');
    const storedSubdomain = localStorage.getItem('subdomain');

    if (storedTenant) {
      setTenant(JSON.parse(storedTenant));
    }
    setSubdomain(storedSubdomain || '');
  }, []);

  if (!tenant) {
    return <DashboardLayout><div>Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of your organization's activity and metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className='flex items-center'>
                <CardIcon className='bg-green-500'>
                  {tenant.businessName[0]}
                </CardIcon>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Organization
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {tenant.businessName}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      Plan: {tenant.plan || 'Free'}
                    </dd>
                  </dl>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='flex items-center'>
              <CardIcon className='bg-blue-500'>🌐</CardIcon>
              <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Subdomain
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {subdomain || 'Not available'}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      Plan: {tenant.plan || 'Free'}
                    </dd>
                  </dl>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='flex items-center'>
              <CardIcon className='bg-gray-100'>📊</CardIcon>
              <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Cases
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                    <dd className="text-sm text-gray-500">
                      No cases yet
                    </dd>
                  </dl>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Welcome to CozeeDesk
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                You have successfully logged into your multi-tenant CozeeDesk account. 
                Your authentication session is active and you can now access all features 
                available to your organization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}