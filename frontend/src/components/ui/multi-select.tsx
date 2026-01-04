"use client"

import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"
import { Badge } from "@/components/ui/badge"

type MultiSelectContextType = {
  open: boolean
  setOpen: (open: boolean) => void
  selectedValues: Set<string>
  toggleValue: (value: string) => void
  items: Map<string, ReactNode>
  single: boolean
  onItemAdded: (value: string, label: ReactNode) => void
}
const MultiSelectContext = createContext<MultiSelectContextType | null>(null)

export function MultiSelect({
  children,
  values,
  defaultValues,
  onValuesChange,
  single = false,
}: {
  children: ReactNode
  values?: string[]
  defaultValues?: string[]
  onValuesChange?: (values: string[]) => void
  single?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [internalValues, setInternalValues] = useState(
    new Set<string>(values ?? defaultValues),
  )
  const selectedValues = values ? new Set(values) : internalValues
  const [items, setItems] = useState<Map<string, ReactNode>>(new Map())

  function toggleValue(value: string) {
    const getNewSet = (prev: Set<string>) => {
      if (single) {
        return prev.has(value) ? new Set<string>() : new Set<string>([value])
      }
      const newSet = new Set(prev)
      if (newSet.has(value)) {
        newSet.delete(value)
      } else {
        newSet.add(value)
      }
      return newSet
    }
    setInternalValues(getNewSet)
    onValuesChange?.([...getNewSet(selectedValues)])
    if (single) setOpen(false)
  }

  const onItemAdded = useCallback((value: string, label: ReactNode) => {
    setItems(prev => {
      if (prev.get(value) === label) return prev
      return new Map(prev).set(value, label)
    })
  }, [])

  return (
    <MultiSelectContext
      value={{
        open,
        setOpen,
        selectedValues,
        single,
        toggleValue,
        items,
        onItemAdded,
      }}
    >
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        {children}
      </Popover>
    </MultiSelectContext>
  )
}

export function MultiSelectTrigger({
  className,
  children,
  ...props
}: {
  className?: string
  children?: ReactNode
} & ComponentPropsWithoutRef<typeof Button>) {
  const { open } = useMultiSelectContext()

  return (
    <PopoverTrigger asChild>
      <Button
        {...props}
        variant={props.variant ?? "outline"}
        role={props.role ?? "combobox"}
        aria-expanded={props["aria-expanded"] ?? open}
        className={cn(
          "flex h-auto min-h-10 w-fit items-center justify-between gap-2 overflow-hidden",
          "rounded-md border border-input bg-input px-3 py-2 text-sm",
          "shadow-sm hover:bg-hover hover:border-border-strong",
          "transition-colors duration-150",
          // Prevent any transform/movement on hover
          "hover:transform-none hover:translate-y-0",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[placeholder]:text-muted-foreground",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
      >
        {children}
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
  )
}

export function MultiSelectValue({
  placeholder,
  clickToRemove = true,
  className,
  overflowBehavior = "wrap-when-open",
  ...props
}: {
  placeholder?: string
  clickToRemove?: boolean
  overflowBehavior?: "wrap" | "wrap-when-open" | "cutoff"
} & Omit<ComponentPropsWithoutRef<"div">, "children">) {
  const { selectedValues, toggleValue, items, open, single } =
    useMultiSelectContext()
  const [overflowAmount, setOverflowAmount] = useState(0)
  const valueRef = useRef<HTMLDivElement>(null)
  const overflowRef = useRef<HTMLDivElement>(null)

  const shouldWrap =
    overflowBehavior === "wrap" ||
    (overflowBehavior === "wrap-when-open" && open)

  const checkOverflow = useCallback(() => {
    if (valueRef.current == null) return

    const containerElement = valueRef.current
    const overflowElement = overflowRef.current
    const items = containerElement.querySelectorAll<HTMLElement>(
      "[data-selected-item]",
    )

    if (overflowElement != null) overflowElement.style.display = "none"
    items.forEach(child => child.style.removeProperty("display"))
    let amount = 0
    for (let i = items.length - 1; i >= 0; i--) {
      const child = items[i]!
      if (containerElement.scrollWidth <= containerElement.clientWidth) {
        break
      }
      amount = items.length - i
      child.style.display = "none"
      overflowElement?.style.removeProperty("display")
    }
    setOverflowAmount(amount)
  }, [])

  const handleResize = useCallback(
    (node: HTMLDivElement) => {
      valueRef.current = node

      const mutationObserver = new MutationObserver(checkOverflow)
      const observer = new ResizeObserver(debounce(checkOverflow, 100))

      mutationObserver.observe(node, {
        childList: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      })
      observer.observe(node)

      return () => {
        observer.disconnect()
        mutationObserver.disconnect()
        valueRef.current = null
      }
    },
    [checkOverflow],
  )

  if (selectedValues.size === 0 && placeholder) {
    return (
      <span className="min-w-0 overflow-hidden font-normal text-muted-foreground">
        {placeholder}
      </span>
    )
  }

  if (single && selectedValues.size > 0) {
    return (
      <span className="min-w-0 overflow-hidden">
        {items.get([...selectedValues][0])}
      </span>
    )
  }

  return (
    <div
      {...props}
      ref={handleResize}
      className={cn(
        "flex w-full gap-1.5 overflow-hidden",
        shouldWrap && "h-full flex-wrap",
        className,
      )}
    >
      {[...selectedValues]
        .filter(value => items.has(value))
        .map(value => (
          <Badge
            variant="secondary"
            data-selected-item
            className={cn(
              "group flex items-center gap-1",
              "bg-primary/10 text-primary border-primary/20",
              "hover:bg-primary/20 hover:border-primary/30",
              clickToRemove && "cursor-pointer"
            )}
            key={value}
            onClick={
              clickToRemove
                ? e => {
                    e.stopPropagation()
                    toggleValue(value)
                  }
                : undefined
            }
          >
            {items.get(value)}
            {clickToRemove && (
              <XIcon className="size-2.5 text-primary/60 group-hover:text-destructive transition-colors" />
            )}
          </Badge>
        ))}
      <Badge
        style={{
          display: overflowAmount > 0 && !shouldWrap ? "block" : "none",
        }}
        variant="outline"
        className="bg-muted text-muted-foreground"
        ref={overflowRef}
      >
        +{overflowAmount}
      </Badge>
    </div>
  )
}

export function MultiSelectContent({
  search = true,
  children,
  ...props
}: {
  search?: boolean | { placeholder?: string; emptyMessage?: string }
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<typeof Command>, "children">) {
  const canSearch = typeof search === "object" ? true : search

  return (
    <>
      <div style={{ display: "none" }}>
        <Command>
          <CommandList>{children}</CommandList>
        </Command>
      </div>
      <PopoverContent
        className={cn(
          "min-w-[var(--radix-popover-trigger-width)] p-0",
          "surface-floating"
        )}
      >
        <Command {...props} className="bg-transparent">
          {canSearch ? (
            <CommandInput
              placeholder={
                typeof search === "object" ? search.placeholder : undefined
              }
              className="border-b border-border"
            />
          ) : (
            <button autoFocus className="sr-only" />
          )}
          <CommandList className="max-h-[40vh] p-1">
            {canSearch && (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {typeof search === "object"
                  ? (search.emptyMessage ?? "No results found.")
                  : "No results found."}
              </CommandEmpty>
            )}
            {children}
          </CommandList>
        </Command>
      </PopoverContent>
    </>
  )
}

export function MultiSelectItem({
  value,
  children,
  badgeLabel,
  onSelect,
  ...props
}: {
  badgeLabel?: ReactNode
  value: string
} & Omit<ComponentPropsWithoutRef<typeof CommandItem>, "value">) {
  const { toggleValue, selectedValues, onItemAdded } = useMultiSelectContext()
  const isSelected = selectedValues.has(value)

  useEffect(() => {
    onItemAdded(value, badgeLabel ?? children)
  }, [value, children, onItemAdded, badgeLabel])

  return (
    <CommandItem
      {...props}
      value={value}
      onSelect={() => {
        toggleValue(value)
        onSelect?.(value)
      }}
      className={cn(
        // Override base CommandItem styles
        "rounded-md cursor-pointer",
        // Keyboard navigation state (cmdk's selected)
        "data-[selected=true]:bg-accent/80 data-[selected=true]:text-foreground",
        // Checked state (our multi-select selection)
        isSelected && "bg-primary/10 text-primary data-[selected=true]:bg-primary/20"
      )}
    >
      <CheckIcon
        className={cn(
          "mr-2 size-4 shrink-0 transition-opacity",
          isSelected ? "opacity-100 text-primary" : "opacity-0"
        )}
      />
      <span className="truncate">{children}</span>
    </CommandItem>
  )
}

export function MultiSelectGroup({
  columns,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandGroup> & {
  columns?: 2 | 3
}) {
  return (
    <CommandGroup
      className={cn(
        // Better heading styling
        "[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:py-2",
        // Grid layout for columns
        columns === 2 &&
          "[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-2 [&_[cmdk-group-items]]:gap-1",
        columns === 3 &&
          "[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-3 [&_[cmdk-group-items]]:gap-1",
        className
      )}
      {...props}
    />
  )
}

export function MultiSelectSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandSeparator>) {
  return (
    <CommandSeparator
      className={cn("my-2 bg-border", className)}
      {...props}
    />
  )
}

function useMultiSelectContext() {
  const context = useContext(MultiSelectContext)
  if (context == null) {
    throw new Error(
      "useMultiSelectContext must be used within a MultiSelectContext",
    )
  }
  return context
}

function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}
