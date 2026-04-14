import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="font-sans text-xs uppercase tracking-widest text-champagne"
        >
          {label}
          {required && <span className="text-rose-gold ml-1">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          className={cn(
            'w-full rounded-lg border border-champagne/30 bg-midnight/60 px-4 py-3',
            'font-sans text-ivory placeholder:text-slate',
            'focus:outline-none focus:border-champagne focus:glow-champagne',
            'transition-all duration-200',
            error && 'border-ruby focus:border-ruby',
            className
          )}
          {...props}
        />
        {error && <span className="text-ruby text-xs font-sans">{error}</span>}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
