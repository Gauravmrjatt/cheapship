"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Xmark } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ 
  date, 
  onDateChange, 
  placeholder = "Pick a date",
  className 
}: DatePickerProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Input
        type="date"
        value={date ? format(date, "yyyy-MM-dd") : ""}
        onChange={(e) => {
          const newDate = e.target.value ? new Date(e.target.value) : undefined
          onDateChange?.(newDate)
        }}
        className="h-8 pr-8 text-xs"
        placeholder={placeholder}
      />
    </div>
  )
}

interface DateRangePickerProps {
  fromDate?: Date
  toDate?: Date
  onFromDateChange?: (date: Date | undefined) => void
  onToDateChange?: (date: Date | undefined) => void
  className?: string
}

export function DateRangePicker({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  className
}: DateRangePickerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Input
        type="date"
        value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
        onChange={(e) => {
          const newDate = e.target.value ? new Date(e.target.value) : undefined
          onFromDateChange?.(newDate)
        }}
        className="h-8 w-32 text-xs"
        placeholder="From"
      />
      <span className="text-muted-foreground text-xs">to</span>
      <Input
        type="date"
        value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
        onChange={(e) => {
          const newDate = e.target.value ? new Date(e.target.value) : undefined
          onToDateChange?.(newDate)
        }}
        className="h-8 w-32 text-xs"
        placeholder="To"
      />
    </div>
  )
}
