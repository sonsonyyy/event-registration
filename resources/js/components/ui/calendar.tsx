import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import * as React from "react"
import { DayPicker } from "react-day-picker"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "flex w-full flex-col gap-4",
        month_caption: "relative flex items-center justify-center px-10 pt-1",
        caption_label: "pointer-events-none text-sm font-medium",
        nav: "absolute inset-x-2 top-1 z-10 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "relative z-10 size-8 rounded-md bg-white p-0 text-slate-500 shadow-none hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "relative z-10 size-8 rounded-md bg-white p-0 text-slate-500 shadow-none hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "mt-4 flex",
        weekday:
          "text-muted-foreground w-9 rounded-md font-normal text-[0.8rem]",
        week: "mt-2 flex w-full",
        day: "relative size-9 p-0 text-center text-sm [&:has([aria-selected])]:bg-[#184d47]/8 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal text-slate-700 aria-selected:bg-[#184d47] aria-selected:text-white aria-selected:hover:bg-[#143f3a] aria-selected:hover:text-white dark:text-slate-200"
        ),
        today:
          "rounded-md border border-[#184d47]/20 bg-[#184d47]/6 text-[#184d47] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon

          return <Icon className={cn("size-4", className)} {...props} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
