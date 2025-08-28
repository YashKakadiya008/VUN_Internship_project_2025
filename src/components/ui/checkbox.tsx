"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SingleCheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  label?: string
}

interface MultiCheckboxItem {
  id: string
  label: string
  checked?: boolean
}

interface MultiCheckboxProps {
  multiple: true
  value?: string[]
  containerClassName?: string;
  itemsPerColumn?: number
  items: MultiCheckboxItem[]
  onChange?: (selected: string[]) => void
  className?: string
}

type CheckboxProps = SingleCheckboxProps | MultiCheckboxProps

function isMultiCheckboxProps(props: CheckboxProps): props is MultiCheckboxProps {
  return (props as MultiCheckboxProps).multiple === true
}

export function Checkbox(props: CheckboxProps) {
  const isMulti = isMultiCheckboxProps(props)

  const [selected, setSelected] = React.useState<string[]>(() => {
    if (isMulti) {
      return props.value ?? props.items.filter((i) => i.checked).map((i) => i.label)
    }
    return []
  })

  React.useEffect(() => {
    if (isMulti && props.value !== undefined) {
      setSelected(props.value)
    }
  }, [isMulti, props.value])

  if (isMulti) {
    const {
      items,
      value,
      onChange,
      itemsPerColumn = null,
      containerClassName = "gap-5",
      className,
    } = props

    // Handle checkbox toggle
    const handleChange = (label: string, checked: boolean) => {
      const updated = checked
        ? [...selected, label]
        : selected.filter((item) => item !== label)

      if (value === undefined) {
        setSelected(updated)
      }
      onChange?.(updated)
    }

    const getGridColumnsClass = (totalItems: number, itemsPerCol: number) => {
      const cols = Math.ceil(totalItems / itemsPerCol)
      switch (cols) {
        case 1: return "grid-cols-1"
        case 2: return "grid-cols-2"
        case 3: return "grid-cols-3"
        case 4: return "grid-cols-4"
        case 5: return "grid-cols-5"
        case 6: return "grid-cols-6"
        default: return "grid-cols-2"
      }
    }

    const containerClasses = itemsPerColumn
      ? `grid ${getGridColumnsClass(items.length, itemsPerColumn)} ${containerClassName}`
      : `flex ${containerClassName}`

    return (
      <div className={containerClasses}>
        {items.map((item) => {
          const isChecked = selected.includes(item.label)
          return (
            <label
              key={item.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-amber-600/5 px-1 py-1 rounded-md"
            >
              <CheckboxPrimitive.Root
                checked={isChecked}
                onCheckedChange={(checked) => handleChange(item.label, !!checked)}
                className={cn(
                  "peer dark:bg-transparent data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border border-primary shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
                  className
                )}
              >
                <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current transition-none">
                  <CheckIcon className="size-3.5" />
                </CheckboxPrimitive.Indicator>
              </CheckboxPrimitive.Root>
              <span>{item.label}</span>
            </label>
          )
        })}
      </div>
    )
  }

  // Single Checkbox Mode
  const { className, label, ...rest } = props as SingleCheckboxProps

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <CheckboxPrimitive.Root
        className={cn(
          "peer dark:bg-transparent data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border border-primary shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...rest}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current transition-none">
          <CheckIcon className="size-3.5 text-white" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && <span>{label}</span>}
    </label>
  )
}