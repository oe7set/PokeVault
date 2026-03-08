import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-accent hover:bg-accent-hover text-white',
    secondary: 'bg-card-border hover:bg-gray-600 text-gray-200',
    ghost: 'bg-transparent hover:bg-card-hover text-gray-300 hover:text-white',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    success: 'bg-green-700 hover:bg-green-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      disabled={disabled ?? loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
