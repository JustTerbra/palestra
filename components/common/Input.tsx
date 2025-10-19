import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <input
        id={id}
        className={`w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 text-base sm:text-sm py-2 px-3 ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;