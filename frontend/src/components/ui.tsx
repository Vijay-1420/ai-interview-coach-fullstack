import React from 'react';

// Skeleton shimmer card
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#E8E6DF] p-6 animate-pulse ${className}`}>
    <div className="h-4 bg-[#E8E6DF] rounded-full w-1/3 mb-4"></div>
    <div className="h-8 bg-[#E8E6DF] rounded-full w-1/2 mb-2"></div>
    <div className="h-3 bg-[#F0EDE6] rounded-full w-2/3"></div>
  </div>
);

// Loading spinner overlay
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16">
    <div className="w-12 h-12 border-3 border-[#E4F0E8] border-t-[#174D3A] rounded-full animate-spin"></div>
    <p className="text-[#777B73] text-sm font-medium">{message}</p>
  </div>
);

// Empty state
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
    {icon && (
      <div className="w-16 h-16 bg-[#E4F0E8] rounded-2xl flex items-center justify-center text-[#2E8B68]">
        {icon}
      </div>
    )}
    <div>
      <h3 className="text-lg font-semibold text-[#282A27] mb-2">{title}</h3>
      <p className="text-[#777B73] text-sm max-w-sm">{description}</p>
    </div>
    {action}
  </div>
);

// Error state
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
    <div className="w-14 h-14 bg-[#fde8e4] rounded-2xl flex items-center justify-center">
      <span className="text-2xl">⚠️</span>
    </div>
    <div>
      <h3 className="text-base font-semibold text-[#282A27] mb-1">Something went wrong</h3>
      <p className="text-[#777B73] text-sm max-w-sm">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-sm font-semibold text-[#2E8B68] hover:text-[#174D3A] transition-colors underline"
      >
        Try again
      </button>
    )}
  </div>
);

// Badge component
interface BadgeProps {
  label: string;
  variant?: 'sage' | 'coral' | 'lavender' | 'forest' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  const variants = {
    sage: 'bg-[#E4F0E8] text-[#174D3A]',
    coral: 'bg-[#fde8e4] text-[#c0624e]',
    lavender: 'bg-[#EAE5F7] text-[#5b4b8a]',
    forest: 'bg-[#174D3A] text-white',
    neutral: 'bg-[#F0EDE6] text-[#777B73]',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${variants[variant]}`}>
      {label}
    </span>
  );
};

// Progress bar
interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = '#2E8B68',
  className = '',
}) => (
  <div className={`w-full bg-[#E8E6DF] rounded-full h-2 overflow-hidden ${className}`}>
    <div
      className="h-full rounded-full transition-all duration-700 ease-out"
      style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
    />
  </div>
);

// Card wrapper
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => (
  <div
    className={`bg-white rounded-2xl border border-[#E8E6DF] ${
      hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''
    } ${className}`}
  >
    {children}
  </div>
);
