"use client"

import * as React from "react"
import {
  IconDashboard,
  IconUsers,
  IconTrophy,
  IconShoppingBag,
  IconSettings,
  IconHome,
  IconHelp,
  IconSearch,
  IconPhoto,
  IconFile,
  IconMessageCircle,
  IconDatabase,
  IconFileReport,
  IconFileText,
  IconPool,
  IconActivity,
  IconCreditCard,
  IconMoneybag,
  IconCashBanknote,
  IconBuildingCommunity
} from "@tabler/icons-react"
import { NavFinancial } from "@/components/nav-financial"
import { NavDocuments } from "@/components/nav-documents"
// import { NavFinancial } from "./nav-financial"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useAuth } from '@/lib/auth-context';

const data = {
  navFinancial: [
    {
      title: "Financial",
      url: "/dashboard/financial",
      icon: IconCreditCard,
    },
    {
      title: "Expenses",
      url: "/dashboard/expenses",
      icon: IconCreditCard,
    },
    {
      title: "Revenue",
      url: "/dashboard/revenue",
      icon: IconMoneybag,
    },
    {
      title: "Reconciliation",
      url: "/dashboard/reconciliation",
      icon: IconCashBanknote,
    },
    {
      title: "Income",
      url: "/dashboard/income",
      icon: IconMoneybag,
    },
  ],
  navMain: [
    // Admin routes
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Insights",
      url: "/dashboard/insights",
      icon: IconActivity,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: IconUsers,
    },

    // financial routes
    

   
    {
      title: "Public Tournament",
      url: "/dashboard/tournaments",
      icon: IconTrophy,
    },
    {
      title: "Communities",
      url: "/dashboard/communities",
      icon: IconBuildingCommunity,
    },
    
    // Public app routes
  
  ],
  navMarketplace: [
   
    //marketplace routes
 
  ],
  
  navSecondary: [
    {
      title: "Products",
      url: "/dashboard/products",
      icon: IconShoppingBag,
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: IconFileText,
    },
    {
      title: "payments",
      url: "/dashboard/payments",
      icon: IconCreditCard,
    },
   
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconFileReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileText,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <IconPool className="size-6 text-primary" />
                <span className="text-xl font-bold text-primary">PoolPal</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavFinancial items={data.navFinancial} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
