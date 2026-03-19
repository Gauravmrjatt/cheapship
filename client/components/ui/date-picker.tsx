"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
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
          const value = e.target.value;
          if (value) {
            const [year, month, day] = value.split('-').map(Number);
            const newDate = new Date(year, month - 1, day);
            onDateChange?.(newDate);
          } else {
            onDateChange?.(undefined);
          }
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
          const value = e.target.value;
          if (value) {
            const [year, month, day] = value.split('-').map(Number);
            const newDate = new Date(year, month - 1, day);
            onFromDateChange?.(newDate);
          } else {
            onFromDateChange?.(undefined);
          }
        }}
        className="h-8 w-32 text-xs"
        placeholder="From"
      />
      <span className="text-muted-foreground text-xs">to</span>
      <Input
        type="date"
        value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
        onChange={(e) => {
          const value = e.target.value;
          if (value) {
            const [year, month, day] = value.split('-').map(Number);
            const newDate = new Date(year, month - 1, day);
            onToDateChange?.(newDate);
          } else {
            onToDateChange?.(undefined);
          }
        }}
        className="h-8 w-32 text-xs"
        placeholder="To"
      />
    </div>
  )
}
