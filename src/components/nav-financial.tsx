"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface NavFinancialProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string
    url: string
    icon?: React.ComponentType<{ className?: string }>
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}

export function NavFinancial({
  className,
  items,
  ...props
}: NavFinancialProps) {
  const pathname = usePathname()

  return (
    <div className={cn("grid gap-1", className)} {...props}>
      <h4 className="font-medium text-xs text-muted-foreground px-2 mb-1">FINANCIAL</h4>
      {items.map((item: {
        title: string;
        url: string;
        icon?: React.ComponentType<{ className?: string }>;
        isActive?: boolean;
      }, index: number) => {
        const Icon = item.icon
        const isActive = item.isActive || pathname === item.url

        return (
          <Link
            key={index}
            href={item.url}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start gap-2"
            )}
          >
            {Icon && <Icon className="size-4" />}
            <span>{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
