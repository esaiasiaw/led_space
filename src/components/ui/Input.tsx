import React, { useRef, useState } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onDragChange?: (value: number) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  className,
  onDragChange,
  min,
  max,
  step = 1,
  value,
  ...props
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValueRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    if (props.type !== 'number' || !onDragChange) return;

    setIsDragging(true);
    startXRef.current = e.clientX;
    startValueRef.current = Number(value) || 0;

    e.preventDefault();
    e.currentTarget.style.cursor = 'ew-resize';
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onDragChange) return;

      const deltaX = e.clientX - startXRef.current;
      const stepSize = typeof step === 'number' ? step : 1;
      const sensitivity = stepSize < 1 ? 0.5 : 1; // More sensitive for decimal values
      const change = Math.round(deltaX * sensitivity / 2) * stepSize;

      let newValue = startValueRef.current + change;

      // Apply min/max constraints
      if (typeof min === 'number') newValue = Math.max(min, newValue);
      if (typeof max === 'number') newValue = Math.min(max, newValue);

      onDragChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, onDragChange, min, max, step]);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-muted-light text-sm">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-16 bg-surface border border-muted text-white px-2 py-1 rounded text-xs text-center focus:outline-none focus:border-accent',
          isDragging && 'cursor-ew-resize border-accent',
          props.type === 'number' && onDragChange && 'cursor-ew-resize select-none',
          className
        )}
        onMouseDown={handleMouseDown}
        min={min}
        max={max}
        step={step}
        value={value}
        {...props}
      />
    </div>
  );
};