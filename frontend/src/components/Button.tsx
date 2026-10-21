import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#174D3A] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[#174D3A] text-white hover:bg-[#2E8B68] active:scale-[0.98] shadow-sm',
    secondary: 'bg-[#E4F0E8] text-[#174D3A] hover:bg-[#d4e8da] active:scale-[0.98]',
    outline: 'border-2 border-[#174D3A] text-[#174D3A] hover:bg-[#174D3A] hover:text-white active:scale-[0.98]',
    ghost: 'text-[#777B73] hover:text-[#282A27] hover:bg-[#F0EDE6] active:scale-[0.98]',
    danger: 'bg-[#E98B78] text-white hover:bg-[#d4785e] active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3.5',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
};

export default Button;
