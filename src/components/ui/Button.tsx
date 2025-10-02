import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'playback';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
        {
          // Variants
          'bg-[#2a2d35] border border-[#3a3d45] text-white hover:bg-[#33363f]': variant === 'primary',
          'bg-[#1a1d23] border border-[#2a2d35] text-gray-300 hover:bg-[#22252b]': variant === 'secondary',
          'w-10 h-10 rounded-full bg-[#1a1d23] border border-[#2a2d35] text-gray-300 hover:bg-[#2a2d35] transition-all duration-200': variant === 'playback',

          // Sizes
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 px-4 py-2 text-sm': size === 'md',
          'h-12 px-6 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};