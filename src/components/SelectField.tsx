import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  options: Option[]
  placeholder?: string
  error?: string
  required?: boolean
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    { label, options, placeholder = 'Selecione...', error, required, className, id, ...props },
    ref
  ) => {
    const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={selectId}
          className="font-sans text-xs uppercase tracking-widest text-champagne"
        >
          {label}
          {required && <span className="text-rose-gold ml-1">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? 'true' : 'false'}
            className={cn(
              'w-full appearance-none rounded-lg border border-champagne/30 bg-midnight/60 px-4 py-3 pr-10',
              'font-sans text-ivory',
              'focus:outline-none focus:border-champagne focus:glow-champagne',
              'transition-all duration-200',
              error && 'border-ruby focus:border-ruby',
              className
            )}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-midnight text-ivory">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-champagne"
          />
        </div>
        {error && <span className="text-ruby text-xs font-sans">{error}</span>}
      </div>
    )
  }
)

SelectField.displayName = 'SelectField'
