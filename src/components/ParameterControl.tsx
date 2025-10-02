import React, { memo, useCallback } from 'react';
import { Slider } from './ui/Slider';
import { Input } from './ui/Input';

interface ParameterControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export const ParameterControl: React.FC<ParameterControlProps> = memo(({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}) => {
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  }, [onChange]);

  return (
    <div className="control-group">
      <div className="parameter-label">
        <span className="parameter-name">{label}</span>
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleInputChange}
          onDragChange={onChange}
          className="parameter-value"
        />
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="mt-2"
      />
    </div>
  );
});