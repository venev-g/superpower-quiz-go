// src/components/ui/Input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Search, X } from 'lucide-react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  description?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, description, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {description && !error && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Password Input Component
interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          showToggle ? (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="p-1 hover:bg-accent rounded-sm transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          ) : undefined
        }
        {...props}
      />
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

// Search Input Component
interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon' | 'rightIcon'> {
  onClear?: () => void
  clearable?: boolean
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, clearable = true, value, ...props }, ref) => {
    const hasValue = value && value.toString().length > 0

    return (
      <Input
        ref={ref}
        type="text"
        value={value}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          clearable && hasValue && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1 hover:bg-accent rounded-sm transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
        {...props}
      />
    )
  }
)
SearchInput.displayName = 'SearchInput'

// Numeric Input Component
interface NumericInputProps extends Omit<InputProps, 'type'> {
  min?: number
  max?: number
  step?: number
  allowDecimals?: boolean
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ min, max, step = 1, allowDecimals = false, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      
      // Allow empty value
      if (value === '') {
        onChange?.(e)
        return
      }

      // Validate numeric input
      const pattern = allowDecimals ? /^\d*\.?\d*$/ : /^\d*$/
      if (pattern.test(value)) {
        const numValue = parseFloat(value)
        
        // Check bounds
        if (min !== undefined && numValue < min) return
        if (max !== undefined && numValue > max) return
        
        onChange?.(e)
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern={allowDecimals ? '[0-9]*.?[0-9]*' : '[0-9]*'}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
NumericInput.displayName = 'NumericInput'

export { Input, PasswordInput, SearchInput, NumericInput }