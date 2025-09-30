'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CaseIcon, CogIcon } from '../ui/Icons';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cases', href: '/cases', icon: CaseIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

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
    </div>
  );
}