import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}) => {
  return (
    <SwitchPrimitive.Root
      className={clsx(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[#2a2d35] border-[#3a3d45]' : 'bg-[#1a1d23] border-[#2a2d35]',
        className
      )}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    >
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          className={clsx(
            'pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-colors',
            checked ? 'bg-white' : 'bg-gray-500'
          )}
          initial={false}
          animate={{
            x: checked ? 24 : 3,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
};