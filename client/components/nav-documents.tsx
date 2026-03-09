"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon  } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon , Settings05Icon } from "@hugeicons/core-free-icons"

export function NavDocuments({
  items,
}: {
  items: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Documents</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url)
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                isActive={isActive}
                onClick={handleLinkClick}
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70" onClick={handleLinkClick} render={<Link href="/dashboard/settings" />}>
            <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} className="text-sidebar-foreground/70" />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
