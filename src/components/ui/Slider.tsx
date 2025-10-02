import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { clsx } from 'clsx';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
}) => {
  return (
    <SliderPrimitive.Root
      className={clsx(
        'relative flex items-center select-none touch-none w-full h-5',
        className
      )}
      value={[value]}
      onValueChange={(values) => onChange(values[0])}
      max={max}
      min={min}
      step={step}
    >
      <SliderPrimitive.Track className="bg-muted relative grow rounded-full h-1">
        <SliderPrimitive.Range className="absolute bg-accent rounded-full h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block w-4 h-4 bg-accent shadow-lg rounded-full hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background cursor-pointer" />
    </SliderPrimitive.Root>
  );
};