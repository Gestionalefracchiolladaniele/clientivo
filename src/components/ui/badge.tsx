import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'secondary';
  className?: string;
}

const variants = {
  default: 'bg-zinc-800 text-zinc-300',
  success: 'bg-green-950 text-green-400',
  warning: 'bg-amber-950 text-amber-400',
  danger: 'bg-red-950 text-red-400',
  secondary: 'bg-zinc-100 text-zinc-600',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
