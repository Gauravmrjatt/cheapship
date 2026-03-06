"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Action } from "kbar"

interface NavItem {
  title?: string
  name?: string
  url: string
  icon?: React.ReactNode
}

interface UseKbarActionsProps {
  userType?: string
  adminNav: NavItem[]
  navMain: NavItem[]
  navSecondary: NavItem[]
  documents: NavItem[]
  openSearchDialog?: () => void
}

export function useKbarActions({
  userType,
  adminNav,
  navMain,
  navSecondary,
  documents,
  openSearchDialog,
}: UseKbarActionsProps) {
  const router = useRouter()

  const createActions = (items: NavItem[], section: string): Action[] => {
    return items.map((item) => ({
      id: item.url,
      name: item.title || item.name || "",
      section,
      icon: item.icon,
      keywords: `${item.title || item.name} navigation page`,
      perform: () => router.push(item.url),
    }))
  }

  return useMemo(() => {
    const actions: Action[] = []

    // Dashboard navigation
    actions.push(...createActions(navMain, "Dashboard"))

    // Secondary navigation
    actions.push(
      ...navSecondary.map((item) => {
        const name = item.title || ""

        if (name === "Search Orders") {
          return {
            id: "search-orders",
            name: "Search Orders",
            section: "Tools",
            icon: item.icon,
            keywords: "search orders tracking shipment",
            perform: () => {
              if (openSearchDialog) openSearchDialog()
            },
          }
        }

        return {
          id: item.url,
          name,
          section: "Tools",
          icon: item.icon,
          keywords: `${name} settings help`,
          perform: () => router.push(item.url),
        }
      })
    )

    // Documents
    actions.push(...createActions(documents, "Issues"))

    // Admin only actions
    if (userType === "ADMIN") {
      actions.push(...createActions(adminNav, "Admin"))
    }

    return actions
  }, [userType, navMain, navSecondary, documents, adminNav, router])
}