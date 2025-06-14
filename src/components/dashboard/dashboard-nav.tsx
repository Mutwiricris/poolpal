'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  UserIcon, 
  Cog6ToothIcon, 
  TrophyIcon, 
  ShoppingBagIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/dashboard/users', icon: UserIcon },
  { name: 'Tournaments', href: '/dashboard/tournaments', icon: TrophyIcon },
  { name: 'Products', href: '/dashboard/products', icon: ShoppingBagIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-white border-r">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">PoolPal</h1>
      </div>
      <nav className="flex flex-1 flex-col p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                'group flex gap-x-3 rounded-md p-3 text-sm font-medium'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  'h-5 w-5 shrink-0'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-x-3 rounded-md p-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
