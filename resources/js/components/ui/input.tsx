import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<"input">) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node

      if (typeof ref === "function") {
        ref(node)
        return
      }

      if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  React.useEffect(() => {
    const inputElement = inputRef.current

    if (!inputElement || type !== "number") {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      if (document.activeElement === inputElement) {
        event.preventDefault()
      }
    }

    inputElement.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      inputElement.removeEventListener("wheel", handleWheel)
    }
  }, [type])

  return (
    <input
      ref={setRef}
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-11 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        type === "number" &&
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      {...props}
    />
  )
}

export { Input }
