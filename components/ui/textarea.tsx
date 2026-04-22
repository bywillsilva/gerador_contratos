import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-xl border bg-white/72 px-3.5 py-2.5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_10px_24px_-22px_rgba(15,23,42,0.55)] transition-[color,box-shadow,border-color,background-color] outline-none focus-visible:ring-[3px] hover:border-primary/25 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
