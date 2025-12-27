"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchSelectOption {
  value: string
  label: string
  searchText?: string
}

interface SearchSelectProps {
  options: SearchSelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function SearchSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  disabled = false,
}: SearchSelectProps) {
  const [query, setQuery] = React.useState("")

  const selectedOption = options.find((o) => o.value === value) || null
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = normalizedQuery
    ? options.filter((o) =>
        (o.searchText || o.label).toLowerCase().includes(normalizedQuery),
      )
    : options

  return (
    <div className={cn("w-full", className)}>
      <div className="space-y-2">
        <Input
          id="searchselect-input"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
        {(filtered.length > 0 || !value) && (
          <div
            className={cn(
              "max-h-56 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-sm",
            )}
          >
            {filtered.length === 0 ? (
              // Hide empty state when a value is already selected
              !value ? (
                <div className="p-3 text-sm text-muted-foreground">{emptyText}</div>
              ) : null
            ) : (
              <ul className="py-1">
                {filtered.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                        value === option.value && "bg-accent/60",
                      )}
                      onClick={() => {
                        onValueChange?.(option.value)
                        setQuery(option.label)
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


