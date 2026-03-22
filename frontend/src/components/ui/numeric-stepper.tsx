import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface NumberStepperProps {
    value?: number
    onChange?: (value: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
    className?: string
    label?: string
    hasError?: boolean
    id?: string
}

export function NumberStepper({
    value = 0,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    unit,
    className,
    label,
    hasError,
    id,
}: NumberStepperProps) {

    const handleDecrement = () => {
        if (value > min) onChange?.(value - step)
    }

    const handleIncrement = () => {
        if (value < max) onChange?.(value + step)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value)
        if (!isNaN(newValue)) {
            onChange?.(Math.min(Math.max(newValue, min), max))
        }
    }

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {label && (
                <label className="text-sm text-foreground">
                    {label}
                </label>
            )}
            <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-none bg-elevated text-primary hover:bg-hover hover:text-primary active:scale-95 transition-transform border-r border-border"
                    onClick={handleDecrement}
                    disabled={value <= min}
                    aria-label={label ? `Decrease ${label}` : "Decrease value"}
                >
                    <Minus className="size-3.5" strokeWidth={1.5} />
                </Button>

                <div className="relative flex-1 min-w-[50px]">
                    <Input
                        id={id}
                        type="number"
                        value={value}
                        onChange={handleInputChange}
                        className={cn(
                            "text-center pr-1 bg-background border-0 rounded-none shadow-none focus-visible:ring-0",
                            hasError && "border-destructive",
                        )}
                    />
                    {unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                            {unit}
                        </span>
                    )}
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-none bg-elevated text-primary hover:bg-hover hover:text-primary active:scale-95 transition-transform border-l border-border"
                    onClick={handleIncrement}
                    disabled={value >= max}
                    aria-label={label ? `Increase ${label}` : "Increase value"}
                >
                    <Plus className="size-3.5" strokeWidth={1.5} />
                </Button>
            </div>
        </div>
    )
}
