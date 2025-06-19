import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  className,
}: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-text-black">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'flex h-12 w-full rounded-lg border border-grey bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
            error && 'border-red focus-visible:ring-red',
            className
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey pointer-events-none" />
      </div>
      {error && (
        <p className="text-sm text-red">{error}</p>
      )}
    </div>
  );
}