'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { HomeIcon } from '../ui/Icons';
import { Button } from '../ui/Button';
import { FolderOpen, FileText } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Templates', href: '/templates', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">CozeeDesk</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
                ${isActive 
                  ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-600' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <item.icon 
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Current Business
          </p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {tenant?.businessName}
          </p>
          <p className="text-xs text-gray-500">
            {user?.email}
          </p>
        </div>
        <Button
          onClick={logout}
          variant="secondary"
          className="w-full text-sm"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}