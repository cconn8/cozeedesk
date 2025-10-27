'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Tenant {
  tenantId: string;
  businessName: string;
  subdomain: string;
  roles: string[];
}

export default function SelectTenant() {
  const router = useRouter();
  const { login } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedTenants = localStorage.getItem('tenants');
    const intermediateToken = localStorage.getItem('intermediateToken');
    
    if (!storedTenants || !intermediateToken) {
      router.push('/login');
      return;
    }
    
    setTenants(JSON.parse(storedTenants));
  }, [router]);

  const selectTenant = async (tenantId: string) => {
    setError('');
    setLoading(true);
    
    const intermediateToken = localStorage.getItem('intermediateToken');
    
    try {
      const response = await fetch('http://localhost:3005/auth/select-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          intermediateToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Use the login function from AuthContext which stores as 'token'
        login(data.jwt);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
        localStorage.setItem('subdomain', data.subdomain);
        localStorage.removeItem('intermediateToken');
        localStorage.removeItem('tenants');
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to select tenant');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Select Your Organization
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose which organization you&apos;d like to access
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <button
              key={tenant.tenantId}
              onClick={() => selectTenant(tenant.tenantId)}
              disabled={loading}
              className="w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {tenant.businessName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Roles: {tenant.roles.join(', ')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="text-center">
          <button
            onClick={() => {
              localStorage.removeItem('intermediateToken');
              localStorage.removeItem('tenants');
              router.push('/login');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}