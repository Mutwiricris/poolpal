"use client"

import * as React from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type Option = {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  selected?: Option[]
  onChange?: (options: Option[]) => void
  placeholder?: string
  className?: string
  value?: Option[]
  maxValues?: number
  isDisabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select options...",
  value = [],
  maxValues,
  isDisabled = false,
  ...props
}: MultiSelectProps) {
  const [selectedOptions, setSelectedOptions] = React.useState<Option[]>(value || selected || [])
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Sync with external value prop
  React.useEffect(() => {
    if (value) {
      setSelectedOptions(value)
    }
  }, [value])

  // Handle selection toggle
  const toggleOption = (option: Option) => {
    const isSelected = selectedOptions.some(item => item.value === option.value)
    
    if (isSelected) {
      // Remove option
      const filtered = selectedOptions.filter(item => item.value !== option.value)
      setSelectedOptions(filtered)
      onChange?.(filtered)
    } else {
      // Add option if below max
      if (maxValues && selectedOptions.length >= maxValues) {
        return
      }
      
      const newOptions = [...selectedOptions, option]
      setSelectedOptions(newOptions)
      onChange?.(newOptions)
    }
  }

  // Remove an option
  const removeOption = (option: Option, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const filtered = selectedOptions.filter(item => item.value !== option.value)
    setSelectedOptions(filtered)
    onChange?.(filtered)
  }

  // Filter options based on search
  const filteredOptions = options.filter(option => {
    const matchesSearch = searchQuery
      ? option.label.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    
    return matchesSearch
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-10 py-2",
            isDisabled && "opacity-50 pointer-events-none",
            className
          )}
          onClick={() => setOpen(!open)}
          disabled={isDisabled}
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map(option => (
                <Badge
                  variant="secondary"
                  key={option.value}
                  className="mr-1 mb-1"
                >
                  {option.label}
                  <span
                    className="ml-1 rounded-full outline-none ring-offset-background cursor-pointer"
                    onClick={(e) => removeOption(option, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        removeOption(option, e as any);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="p-2">
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {filteredOptions.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOptions.map(option => {
              const isSelected = selectedOptions.some(item => item.value === option.value)
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => toggleOption(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center p-4 text-sm text-muted-foreground">
            No options found.
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
