import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-20 w-full rounded-lg border bg-background/80 px-3.5 py-3 text-base text-foreground shadow-none transition-[color,box-shadow,border-color,background-color] outline-none focus-visible:ring-[3px] hover:border-foreground/20 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-white/[0.12] dark:bg-white/[0.045] dark:hover:bg-white/[0.07]',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
