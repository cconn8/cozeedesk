// Simple Button Component - No advanced patterns

interface ButtonProps {
  children: string | React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button(props: ButtonProps) {
  const {
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    className = ''
  } = props;

  // Simple function to get variant styles
  function getVariantStyles(variant: string): string {
    if (variant === 'primary') {
      return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
    if (variant === 'secondary') {
      return 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300';
    }
    if (variant === 'danger') {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }
    return 'bg-indigo-600 hover:bg-indigo-700 text-white'; // fallback
  }

  // Simple function to get size styles
  function getSizeStyles(size: string): string {
    if (size === 'small') {
      return 'px-3 py-1 text-sm';
    }
    if (size === 'medium') {
      return 'px-4 py-2 text-sm';
    }
    if (size === 'large') {
      return 'px-6 py-3 text-base';
    }
    return 'px-4 py-2 text-sm'; // fallback
  }

  // Combine all styles into one string
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const disabledStyles = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);
  
  const allStyles = `${baseStyles} ${variantStyles} ${sizeStyles} ${disabledStyles} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={allStyles}
    >
      {loading && <span className="mr-2">⏳</span>}
      {children}
    </button>
  );
}