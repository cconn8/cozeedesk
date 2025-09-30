// Simple Input Component - No advanced patterns

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function Input(props: InputProps) {
  const {
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    helperText,
    disabled = false,
    required = false,
    className = ''
  } = props;

  // Handle input change
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (onChange) {
      onChange(event.target.value);
    }
  }

  // Get input styles based on error state
  function getInputStyles(): string {
    const baseStyles = 'w-full px-3 py-2 border rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2';
    
    if (error) {
      return `${baseStyles} border-red-300 focus:ring-red-500 focus:border-red-500`;
    }
    
    return `${baseStyles} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
  }

  const inputStyles = `${getInputStyles()} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={inputStyles}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}