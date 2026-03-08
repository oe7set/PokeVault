import { clsx } from 'clsx';
import { getTypeClass } from '@/utils/typeColors';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'type';
  type?: string;
}

export function Badge({ children, className, variant = 'default', type }: BadgeProps) {
  if (variant === 'type' && type) {
    return (
      <span
        className={clsx(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white',
          getTypeClass(type),
          className,
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variant === 'outline'
          ? 'border border-gray-600 text-gray-300'
          : 'bg-gray-700 text-gray-200',
        className,
      )}
    >
      {children}
    </span>
  );
}
