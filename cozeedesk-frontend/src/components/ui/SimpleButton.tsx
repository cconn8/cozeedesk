import React from 'react';

interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}

export function SimpleButton({ 
  variant = 'primary', 
  size = 'medium', 
  loading = false,
  disabled,
  children,
  className = '',
  ...props 
}: SimpleButtonProps) {
  // Define styles for each variant
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  // Define styles for each size
  const sizeStyles = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  // Combine all the classes
  const buttonClasses = `
    rounded-md font-medium transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-indigo-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block animate-spin mr-2">⏳</span>
      )}
      {children}
    </button>
  );
}