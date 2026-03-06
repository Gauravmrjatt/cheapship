"use client"

import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarSearch,
  KBarResults,
  useMatches,
} from "kbar"

export default function CommandPalette() {
  const { results } = useMatches()

  return (
    <KBarPortal>
      <KBarPositioner className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
        <KBarAnimator className="w-full max-w-xl overflow-hidden rounded-xl border bg-muted  backdrop-blur-xl shadow-2xl">
          
          <KBarSearch
            className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none"
            placeholder="Type a command or search..."
          />

          <KBarResults
            items={results}
            onRender={({ item, active }) =>
              typeof item === "string" ? (
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                  {item}
                </div>
              ) : (
                <div
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-sm ${
                    active ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  {item.icon && (
                    <span className="text-muted-foreground">
                      {item.icon}
                    </span>
                  )}
                  {item.name}
                </div>
              )
            }
          />
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  )
}