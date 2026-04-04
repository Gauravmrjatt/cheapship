"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

function Switch({ className, onCheckedChange, checked, ...props }: SwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <div className={cn(
        "w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors",
        "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20",
        "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform",
        "peer-checked:after:translate-x-full",
        className
      )} />
    </label>
  )
}

export { Switch }