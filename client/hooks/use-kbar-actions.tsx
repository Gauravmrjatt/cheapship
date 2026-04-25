"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Action } from "kbar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserCircle02Icon,
  Notification03Icon,
  Shield01Icon,
  PaintBoardIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"

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

    // Admin only actions - at top
    if (userType === "ADMIN") {
      actions.push(...createActions(adminNav, "Admin"))
    }

    // Dashboard navigation
    actions.push(...createActions(navMain, "Dashboard"))

    // Settings actions for all users
    const settingsActions: Action[] = [
      {
        id: "settings-profile",
        name: "Profile",
        section: "Settings",
        icon: <HugeiconsIcon icon={UserCircle02Icon} strokeWidth={2} />,
        keywords: "profile account settings",
        perform: () => router.push("/dashboard/settings?tab=profile"),
      },
      {
        id: "settings-notifications",
        name: "Notifications",
        section: "Settings",
        icon: <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />,
        keywords: "notifications settings alerts",
        perform: () => router.push("/dashboard/settings?tab=notifications"),
      },
      {
        id: "settings-security",
        name: "Security",
        section: "Settings",
        icon: <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />,
        keywords: "security settings password",
        perform: () => router.push("/dashboard/settings?tab=security"),
      },
      {
        id: "settings-appearance",
        name: "Appearance",
        section: "Settings",
        icon: <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} />,
        keywords: "appearance theme light dark mode",
        perform: () => router.push("/dashboard/settings?tab=appearance"),
      },
      {
        id: "settings-kyc",
        name: "KYC",
        section: "Settings",
        icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} />,
        keywords: "kyc verification identity",
        perform: () => router.push("/dashboard/settings?tab=kyc"),
      },
    ]
    actions.push(...settingsActions)

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

    return actions
  }, [userType, navMain, navSecondary, documents, adminNav, router, openSearchDialog])
}