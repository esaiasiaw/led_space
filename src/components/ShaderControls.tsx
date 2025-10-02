import React from 'react';
import { useAnimationStore } from '../stores/animationStore';

export const ShaderControls: React.FC = () => {
  const { settings, updateSettings } = useAnimationStore();

  if (!settings.enableShaderPattern) return null;

  return (
    <div className="space-y-3 mt-3 p-3 bg-[var(--bg-tertiary)]/50 rounded-lg border border-[var(--border-primary)]">
      <h4 className="parameter-name">Shader Settings</h4>

      {/* Shader Shape */}
      <div className="space-y-2">
        <label className="parameter-name">Shape</label>
        <select
          value={settings.shaderShape}
          onChange={(e) => updateSettings({ shaderShape: e.target.value as any })}
          className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all duration-[var(--duration-fast)]"
        >
          <option value="simplex">Simplex Noise</option>
          <option value="warp">Warp</option>
          <option value="dots">Dots</option>
          <option value="wave">Wave</option>
          <option value="ripple">Ripple</option>
          <option value="swirl">Swirl</option>
          <option value="sphere">Sphere</option>
        </select>
      </div>

      {/* Dither Type */}
      <div className="space-y-2">
        <label className="parameter-name">Dither Grid</label>
        <select
          value={settings.shaderType}
          onChange={(e) => updateSettings({ shaderType: e.target.value as any })}
          className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all duration-[var(--duration-fast)]"
        >
          <option value="random">Random</option>
          <option value="2x2">2x2</option>
          <option value="4x4">4x4</option>
          <option value="8x8">8x8</option>
        </select>
      </div>

      {/* Front Color */}
      <div className="space-y-2">
        <label className="parameter-name">Front Color</label>
        <input
          type="color"
          value={settings.shaderColorFront}
          onChange={(e) => updateSettings({ shaderColorFront: e.target.value })}
          className="w-full h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] cursor-pointer hover:border-[var(--border-secondary)] transition-all duration-[var(--duration-fast)]"
        />
      </div>

      {/* Back Color */}
      <div className="space-y-2">
        <label className="parameter-name">Back Color</label>
        <input
          type="color"
          value={settings.shaderColorBack}
          onChange={(e) => updateSettings({ shaderColorBack: e.target.value })}
          className="w-full h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] cursor-pointer hover:border-[var(--border-secondary)] transition-all duration-[var(--duration-fast)]"
        />
      </div>

      {/* Speed */}
      <div className="space-y-2">
        <div className="parameter-label">
          <label className="parameter-name">Speed</label>
          <span className="text-xs text-[var(--text-tertiary)] font-mono">{settings.shaderSpeed.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={settings.shaderSpeed}
          onChange={(e) => updateSettings({ shaderSpeed: parseFloat(e.target.value) })}
        />
      </div>

      {/* Scale */}
      <div className="space-y-2">
        <div className="parameter-label">
          <label className="parameter-name">Scale</label>
          <span className="text-xs text-[var(--text-tertiary)] font-mono">{settings.shaderScale.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={settings.shaderScale}
          onChange={(e) => updateSettings({ shaderScale: parseFloat(e.target.value) })}
        />
      </div>

      {/* Size */}
      <div className="space-y-2">
        <div className="parameter-label">
          <label className="parameter-name">Pixel Size</label>
          <span className="text-xs text-[var(--text-tertiary)] font-mono">{settings.shaderSize}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={settings.shaderSize}
          onChange={(e) => updateSettings({ shaderSize: parseInt(e.target.value) })}
        />
      </div>
    </div>
  );
};
