import React from 'react';
import { useAnimationStore } from '../stores/animationStore';
import { Zap, Clock } from 'lucide-react';
import { Switch } from './ui/Switch';

export function PerformanceSettings() {
  const {
    isPerformanceMode,
    togglePerformanceMode,
    inactivityTimeout,
    setInactivityTimeout,
    settings,
    updateSettings,
  } = useAnimationStore();

  const handlePerformanceModeToggle = () => {
    const newMode = !isPerformanceMode;
    togglePerformanceMode();

    if (newMode) {
      // Enable performance mode - reduce resource usage
      updateSettings({
        gridSize: Math.min(settings.gridSize, 20), // Cap grid size
        showGlow: false, // Disable glow
        bloomStrength: 0, // Disable bloom
        enableFlicker: false, // Disable flicker
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Performance Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Performance Mode
          </label>
        </div>
        <Switch
          checked={isPerformanceMode}
          onCheckedChange={handlePerformanceModeToggle}
        />
      </div>

      {isPerformanceMode && (
        <div className="pl-6 text-xs text-[var(--text-tertiary)] space-y-1">
          <p>✓ Reduced grid size (max 20x20)</p>
          <p>✓ Glow effects disabled</p>
          <p>✓ Bloom disabled</p>
          <p>✓ Flicker disabled</p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-[var(--border-primary)]"></div>

      {/* Auto-pause timeout */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Auto-pause after inactivity
          </label>
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={inactivityTimeout}
            onChange={(e) => setInactivityTimeout(Number(e.target.value))}
            className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-secondary)]">
              {inactivityTimeout} minute{inactivityTimeout !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              Saves battery & CPU
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">💡 Tip:</strong> Enable Performance Mode
          to reduce CPU/GPU usage and prevent overheating. Animation will auto-pause after{' '}
          {inactivityTimeout} minute{inactivityTimeout !== 1 ? 's' : ''} of inactivity.
        </p>
      </div>
    </div>
  );
}
