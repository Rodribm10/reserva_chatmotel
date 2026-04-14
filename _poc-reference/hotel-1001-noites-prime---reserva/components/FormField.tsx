

import * as React from 'react';
import { cn } from '../lib/utils.ts';

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string; // 'text', 'email', 'datetime-local', etc. For input elements
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  instruction?: string;
  fieldType?: 'input' | 'textarea';
  rows?: number; // for textarea
  autoComplete?: string;
  inputPrefix?: string; // New prop for the prefix
  error?: boolean; // New prop for validation state
  icon?: React.ReactNode; // New prop for icon
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  instruction,
  fieldType = 'input',
  rows = 4,
  autoComplete,
  inputPrefix,
  error = false,
  icon,
}) => {
  const dateTimeStyles = type.includes('date') || type.includes('time') ? { colorScheme: 'light' } : {};

  const renderInput = () => {
    const finalInputClasses = cn(
      "block w-full px-4 py-3.5 bg-[#F8FAFC] border-[1.5px] rounded-xl text-sm font-medium text-[#1B3B5F] placeholder-[#9CA3AF]",
      "transition-all duration-300 ease-out",
      "focus:outline-none focus:border-[#1E90FF] focus:bg-white focus:ring-4 focus:ring-[#1E90FF]/10",
      "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed",
      inputPrefix ? 'rounded-l-none border-l-0' : '',
      icon ? 'pl-11' : '',
      "relative min-w-0 flex-1 hover:border-[#1B3B5F]/50",
      error
        ? "border-red-500 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500/10"
        : "border-[#1B3B5F]/20"
    );

    if (fieldType === 'textarea') {
      return (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={rows}
          className={finalInputClasses}
          autoComplete={autoComplete}
          aria-invalid={error}
        />
      );
    }
    return (
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={finalInputClasses}
        autoComplete={autoComplete}
        step={type === 'number' ? 'any' : undefined}
        style={dateTimeStyles}
        aria-invalid={error}
      />
    );
  };

  return (
    <div className="mb-6 group">
      <label htmlFor={id} className="block text-xs font-semibold text-[#1B3B5F] uppercase tracking-wider mb-2 ml-1">
        {label} {required && <span className="text-[#1E90FF]">*</span>}
      </label>
      <div className="relative flex shadow-sm rounded-xl">
        {inputPrefix && (
          <span className={cn(
            "inline-flex items-center rounded-l-xl border-[1.5px] border-r-0 bg-[#F8FAFC] px-4 text-sm font-medium text-[#9CA3AF] transition-colors duration-200",
            error ? "border-red-500" : "border-[#1B3B5F]/20"
          )}>
            {inputPrefix}
          </span>
        )}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] z-10">
            {icon}
          </div>
        )}
        {renderInput()}
      </div>
      {instruction && <p className="mt-2 text-xs text-[#9CA3AF] ml-1">{instruction}</p>}
    </div>
  );
};

export default FormField;