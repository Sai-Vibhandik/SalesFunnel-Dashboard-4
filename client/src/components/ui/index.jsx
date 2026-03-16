import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  ...props
}, ref) {
  const variants = {
    primary: 'bg-primary-500 text-dark-300 hover:bg-primary-600 active:bg-primary-700 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300',
    dark: 'bg-dark-300 text-white hover:bg-dark-200 active:bg-dark-100',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

export const Input = forwardRef(function Input({
  label,
  error,
  helperText,
  className,
  ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          'transition-all duration-200',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({
  label,
  error,
  helperText,
  className,
  rows = 4,
  ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          'transition-all duration-200',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select...',
  className,
  ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          'transition-all duration-200',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

export function Checkbox({
  label,
  className,
  ...props
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        className={cn(
          'w-4 h-4 text-primary-500 border-gray-300 rounded',
          'focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0',
          'rounded-md',
          className
        )}
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export function Card({
  children,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'px-6 py-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = 'default',
  className,
  ...props
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    dark: 'bg-dark-100 text-gray-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value = 0,
  max = 100,
  color = 'primary',
  size = 'md',
  showLabel = false,
  className,
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700">{value}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', sizes[size])}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: color === 'success'
              ? '#10B981'
              : 'linear-gradient(90deg, #FFC107 0%, #FFD54F 100%)'
          }}
        />
      </div>
    </div>
  );
}

export function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('animate-spin text-primary-500', sizes[size], className)}>
      <svg
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto w-12 h-12 text-gray-300 bg-gray-50 rounded-2xl flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="mt-4 text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-dark-300/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div
          className={cn(
            'relative inline-block w-full bg-white rounded-2xl text-left',
            'shadow-xl transform transition-all sm:my-8',
            sizes[size]
          )}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          )}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}