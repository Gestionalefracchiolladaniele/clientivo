'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white hover:bg-zinc-800',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
        ghost: 'text-zinc-700 hover:bg-zinc-100',
        secondary: 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700',
        success: 'bg-zinc-900 text-white hover:bg-zinc-800',
        white: 'bg-white text-zinc-950 hover:bg-zinc-100',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={clsx(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';
