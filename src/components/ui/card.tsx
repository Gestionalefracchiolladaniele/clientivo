import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export function Card({ children, className, dark = true }: CardProps) {
  return (
    <div className={clsx(
      'rounded-lg border',
      dark
        ? 'bg-[#09090b] border-white/10 shadow-xl'
        : 'bg-white border-zinc-200 shadow-sm',
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, dark = true }: CardProps) {
  return (
    <div className={clsx(
      'px-6 py-4 border-b',
      dark ? 'border-white/10' : 'border-zinc-100',
      className
    )}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>;
}

export function CardTitle({ children, className, dark = true }: CardProps) {
  return (
    <h3 className={clsx(
      'text-base font-semibold',
      dark ? 'text-white' : 'text-zinc-900',
      className
    )}>
      {children}
    </h3>
  );
}
