import React from 'react';
import { Dithering } from '@paper-design/shaders-react';
import { useAnimationStore } from '../stores/animationStore';

export const ShaderOverlay: React.FC = () => {
  const { settings } = useAnimationStore();

  if (!settings.enableShaderPattern) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <Dithering
        width={600}
        height={600}
        colorBack={settings.shaderColorBack}
        colorFront={settings.shaderColorFront}
        speed={settings.shaderSpeed}
        shape={settings.shaderShape}
        type={settings.shaderType}
        size={settings.shaderSize}
        scale={settings.shaderScale}
      />
    </div>
  );
};
