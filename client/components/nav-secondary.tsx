"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  onItemClick,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    onClick?: () => void
  }[]
  onItemClick?: (title: string) => void
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }
  
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || 
              (item.url !== "#" && pathname.startsWith(item.url))
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  isActive={isActive}
                  render={item.url !== "#" ? <Link href={item.url} onClick={handleLinkClick} /> : undefined}
                  onClick={() => {
                    if (item.url === "#" && item.onClick) {
                      item.onClick();
                    } else if (onItemClick && item.url === "#") {
                      onItemClick(item.title);
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
