'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ToastProvider } from '@/components/ui/toast-provider';
import { 
  HomeIcon, 
  UserIcon, 
  TrophyIcon, 
  ShoppingBagIcon, 
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { IconDashboard, IconUsers, IconSettings } from '@tabler/icons-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Update the navigation data in app-sidebar.tsx to match these routes
const poolpalNavigation = [
  { title: 'Dashboard', url: '/dashboard', icon: IconDashboard },
  { title: 'Users', url: '/dashboard/users', icon: IconUsers },
  { title: 'Tournaments', url: '/dashboard/tournaments', icon: IconDashboard },
  { title: 'Products', url: '/dashboard/products', icon: IconDashboard },
  { title: 'Orders', url: '/dashboard/orders', icon: IconDashboard },
  { title: 'Settings', url: '/dashboard/settings', icon: IconSettings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !currentUser) {
      console.log('No user detected in dashboard, redirecting to login');
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    console.log('Dashboard layout is in loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-2 text-sm text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  // Don't render the dashboard if user is not authenticated
  if (!currentUser) {
    console.log('User not authenticated, returning null in dashboard layout');
    return null;
  }
  
  console.log('Rendering dashboard with user:', currentUser?.uid);

  return (
    <ToastProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "280px",
          "--header-height": "64px",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex flex-1 flex-col min-h-screen bg-background">
            <div className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ToastProvider>
  );
}
