'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, tenant, logout } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting}, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome to {tenant?.businessName} on CozeDesk
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Business Information
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Business:</span> {tenant?.businessName}</p>
            <p><span className="font-medium">Plan:</span> {tenant?.plan}</p>
            <p><span className="font-medium">User:</span> {user?.email}</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Getting Started
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your authentication system is ready! This is a clean Phase 0 implementation.
          </p>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">✅ Multi-tenant authentication</p>
            <p className="text-xs text-gray-500">✅ JWT token management</p>
            <p className="text-xs text-gray-500">✅ Tenant isolation</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Actions
          </h3>
          <div className="space-y-3">
            <Button 
              onClick={logout}
              variant="secondary"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Phase 0 Complete 🎉
        </h3>
        <div className="prose text-sm text-gray-600">
          <p>
            Congratulations! You now have a clean, production-ready multi-tenant authentication system.
            This implementation follows the specifications in <code>AUTH.md</code> and provides:
          </p>
          <ul className="mt-3 space-y-1">
            <li>✅ User signup with automatic tenant creation</li>
            <li>✅ Smart login flow (single vs multi-tenant detection)</li>
            <li>✅ Tenant selection for multi-tenant users</li>
            <li>✅ JWT tokens scoped to specific tenants</li>
            <li>✅ Protected routes with authentication guards</li>
            <li>✅ Clean, maintainable codebase</li>
          </ul>
          <p className="mt-4">
            <strong>Next steps:</strong> When ready to add features, build them incrementally 
            on top of this solid authentication foundation.
          </p>
        </div>
      </Card>
    </div>
  );
}