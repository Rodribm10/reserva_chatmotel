

import * as React from 'react';
import { cn } from '../lib/utils.ts';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  required?: boolean;
  placeholder?: string; // For the default/disabled option
  instruction?: string;
  disabled?: boolean;
  error?: boolean; // New prop for validation state
  icon?: React.ReactNode; // New prop for icon
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  options,
  required = false,
  placeholder = 'Selecione uma opção',
  instruction,
  disabled = false,
  error = false,
  icon,
}) => {
  const selectClassName = cn(
    "block w-full appearance-none rounded-xl border-[1.5px] bg-[#F8FAFC] px-4 py-3.5 text-sm font-medium text-[#1B3B5F]",
    "transition-all duration-300 ease-out",
    "focus:outline-none focus:border-[#1E90FF] focus:bg-white focus:ring-4 focus:ring-[#1E90FF]/10",
    "hover:border-[#1B3B5F]/50",
    "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed",
    icon ? 'pl-11' : '',
    error
      ? "border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500/10"
      : "border-[#1B3B5F]/20"
  );

  return (
    <div className="mb-6 group">
      <label htmlFor={id} className="block text-xs font-semibold text-[#1B3B5F] uppercase tracking-wider mb-2 ml-1">
        {label} {required && <span className="text-[#1E90FF]">*</span>}
      </label>
      <div className="relative shadow-sm rounded-xl">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] z-10">
            {icon}
          </div>
        )}
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={selectClassName}
          disabled={disabled}
          aria-describedby={instruction ? `${id}-instruction` : undefined}
          aria-invalid={error}
        >
          {placeholder && <option value="" disabled={required || value !== ""}>{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value} className="text-[#1B3B5F] py-2">
              {option.label}
            </option>
          ))}
        </select>
        <div className={cn(
            "pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 transition-colors duration-200",
            error ? "text-red-500" : "text-[#1B3B5F]/50 group-hover:text-[#1E90FF]"
          )}>
          <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {instruction && <p id={`${id}-instruction`} className="mt-2 text-xs text-[#9CA3AF] ml-1">{instruction}</p>}
    </div>
  );
};

export default SelectField;