import React, { useCallback, useMemo } from 'react';
import { ParameterControl } from './ParameterControl';
import { Switch } from './ui/Switch';
import { Button } from './ui/Button';
import { ExportControls } from './ExportControls';
import { PerformanceSettings } from './PerformanceSettings';
import { CollapsibleSection } from './CollapsibleSection';
import { useAnimationStore } from '../stores/animationStore';

interface AnimationControlsProps {
  animationEngineRef: React.RefObject<any>;
  showExport?: boolean;
}

export const AnimationControls: React.FC<AnimationControlsProps> = React.memo(({ animationEngineRef, showExport = true }) => {
  const { settings, updateSettings, toggleCodeEditor, isCodeEditorOpen } = useAnimationStore();

  // Memoize callbacks to prevent unnecessary re-renders
  const handleDurationChange = useCallback((value: number) => {
    updateSettings({ animationDuration: value });
  }, [updateSettings]);

  const handleGridSizeChange = useCallback((value: number) => {
    updateSettings({ gridSize: value });
  }, [updateSettings]);

  const handleLedSpacingChange = useCallback((value: number) => {
    updateSettings({ ledSpacing: value });
  }, [updateSettings]);

  const handleInnerRadiusChange = useCallback((value: number) => {
    updateSettings({ innerRadius: value });
  }, [updateSettings]);

  const handleOuterRadiusChange = useCallback((value: number) => {
    updateSettings({ outerRadius: value });
  }, [updateSettings]);

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Basic Settings */}
      <div className="mb-5 pb-4 border-b-half border-[#2a2d35]">
        <ParameterControl
          label="Duration (ms)"
          value={settings.animationDuration}
          min={100}
          max={5000}
          onChange={handleDurationChange}
        />

        <ParameterControl
          label="Grid Size"
          value={settings.gridSize}
          min={10}
          max={40}
          onChange={handleGridSizeChange}
        />

        <ParameterControl
          label="LED Spacing"
          value={settings.ledSpacing}
          min={8}
          max={20}
          onChange={handleLedSpacingChange}
        />

        <ParameterControl
          label="Inner Radius"
          value={settings.innerRadius}
          min={0}
          max={80}
          onChange={handleInnerRadiusChange}
        />

        <ParameterControl
          label="Outer Radius"
          value={settings.outerRadius}
          min={40}
          max={120}
          onChange={handleOuterRadiusChange}
        />
      </div>

      {/* Appearance & Color */}
      <div className="mb-5 pb-4 border-b-half border-[#2a2d35]">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Appearance & Color</h3>

        <div className="control-group mb-3">
          <div className="parameter-label">
            <span className="parameter-name">Canvas Background</span>
            <input
              type="color"
              value={settings.canvasBackgroundColor}
              onChange={(e) => updateSettings({ canvasBackgroundColor: e.target.value })}
              className="w-16 h-8 border border-[#2a2d35] rounded cursor-pointer bg-[#1a1d23]"
            />
          </div>
        </div>

        <div className="control-group mb-3">
          <div className="parameter-label">
            <span className="parameter-name">LED Color</span>
            <input
              type="color"
              value={settings.ledColor}
              onChange={(e) => updateSettings({ ledColor: e.target.value })}
              className="w-16 h-8 border border-[#2a2d35] rounded cursor-pointer bg-[#1a1d23]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-[#2a2d35] transition-colors mb-3">
          <span className="parameter-name text-sm">Show LED Background Grid</span>
          <Switch
            checked={settings.showBackground}
            onCheckedChange={(checked) => updateSettings({ showBackground: checked })}
          />
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-[#2a2d35] transition-colors mb-3">
          <span className="parameter-name text-sm">Enable Color Cycling</span>
          <Switch
            checked={settings.enableColorTransition}
            onCheckedChange={(checked) => updateSettings({ enableColorTransition: checked })}
          />
        </div>

        <div className="control-group mb-3">
          <div className="parameter-label">
            <span className="parameter-name">Color 2</span>
            <input
              type="color"
              value={settings.ledColor2}
              onChange={(e) => updateSettings({ ledColor2: e.target.value })}
              className="w-16 h-8 border border-[#2a2d35] rounded cursor-pointer bg-[#1a1d23]"
            />
          </div>
        </div>

        <div className="control-group mb-3">
          <div className="parameter-label">
            <span className="parameter-name">Color 3</span>
            <input
              type="color"
              value={settings.ledColor3}
              onChange={(e) => updateSettings({ ledColor3: e.target.value })}
              className="w-16 h-8 border border-[#2a2d35] rounded cursor-pointer bg-[#1a1d23]"
            />
          </div>
        </div>

        <ParameterControl
          label="Color Cycle Speed"
          value={settings.colorSpeed}
          min={0.1}
          max={3.0}
          step={0.1}
          onChange={(value) => updateSettings({ colorSpeed: value })}
        />
      </div>

      {/* 3D Rotation */}
      <div className="mb-5 pb-4 border-b-half border-[#2a2d35]">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">3D Rotation</h3>

        <div className={`flex items-center py-2 px-3 rounded transition-colors mb-3 ${settings.enableYAxisRotate ? 'bg-cyan-600/20 ring-1 ring-cyan-600/50' : 'hover:bg-[#2a2d35]'}`}>
          <Switch
            checked={settings.enableYAxisRotate}
            onCheckedChange={(checked) => updateSettings({ enableYAxisRotate: checked })}
            className="mr-2"
          />
          <span className="parameter-name text-sm">Y-Axis Rotation</span>
        </div>

        <ParameterControl
          label="Y-Rotation Speed"
          value={settings.yRotateSpeed}
          min={0}
          max={3}
          step={0.1}
          onChange={(value) => updateSettings({ yRotateSpeed: value })}
        />
      </div>

      {/* Shape Distortion */}
      <div className="mb-5 pb-4 border-b-half border-[#2a2d35]">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Shape Distortion</h3>

        <div className={`flex items-center py-2 px-3 rounded transition-colors mb-3 ${settings.enableMorphing ? 'bg-purple-600/20 ring-1 ring-purple-600/50' : 'hover:bg-[#2a2d35]'}`}>
          <Switch
            checked={settings.enableMorphing}
            onCheckedChange={(checked) => updateSettings({ enableMorphing: checked })}
            className="mr-2"
          />
          <span className="parameter-name text-sm">Morphing</span>
        </div>

        <ParameterControl
          label="Morph Intensity"
          value={settings.morphIntensity}
          min={0}
          max={2}
          step={0.1}
          onChange={(value) => updateSettings({ morphIntensity: value })}
        />

        <div className={`flex items-center py-2 px-3 rounded transition-colors my-2 ${settings.enableSpiralModifier ? 'bg-yellow-600/20 ring-1 ring-yellow-600/50' : 'hover:bg-[#2a2d35]'}`}>
          <Switch
            checked={settings.enableSpiralModifier}
            onCheckedChange={(checked) => updateSettings({ enableSpiralModifier: checked })}
            className="mr-2"
          />
          <span className="parameter-name text-sm">Spiral Distortion</span>
        </div>

        <ParameterControl
          label="Spiral Intensity"
          value={settings.spiralIntensity}
          min={0}
          max={2}
          step={0.1}
          onChange={(value) => updateSettings({ spiralIntensity: value })}
        />
      </div>

      {/* Visual Effects */}
      <div className="mb-5 pb-4 border-b-half border-[#2a2d35]">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Visual Effects</h3>

        <div className={`flex items-center py-2 px-3 rounded transition-colors mb-3 ${settings.enableFlicker ? 'bg-pink-600/20 ring-1 ring-pink-600/50' : 'hover:bg-[#2a2d35]'}`}>
          <Switch
            checked={settings.enableFlicker}
            onCheckedChange={(checked) => updateSettings({ enableFlicker: checked })}
            className="mr-2"
          />
          <span className="parameter-name text-sm">Flicker</span>
        </div>

        <ParameterControl
          label="Flicker Amount"
          value={settings.flickerAmount}
          min={0}
          max={1}
          step={0.05}
          onChange={(value) => updateSettings({ flickerAmount: value })}
        />

        <div className={`flex items-center justify-between py-2 px-3 rounded transition-colors mb-3 ${settings.enableBloom ? 'bg-orange-600/20 ring-1 ring-orange-600/50' : 'hover:bg-[#2a2d35]'}`}>
          <div className="flex items-center">
            <Switch
              checked={settings.enableBloom}
              onCheckedChange={(checked) => updateSettings({ enableBloom: checked })}
              className="mr-2"
            />
            <span className="parameter-name text-sm">Bloom</span>
          </div>
          <span className="text-[10px] text-yellow-400/80 font-medium uppercase tracking-wide">
            High GPU
          </span>
        </div>

        {settings.enableBloom && (
          <>
            <ParameterControl
              label="Bloom Strength"
              value={settings.bloomStrength}
              min={0}
              max={3}
              step={0.1}
              onChange={(value) => updateSettings({ bloomStrength: value })}
            />

            <ParameterControl
              label="Bloom Radius"
              value={settings.bloomRadius}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => updateSettings({ bloomRadius: value })}
            />

            <ParameterControl
              label="Bloom Threshold"
              value={settings.bloomThreshold}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => updateSettings({ bloomThreshold: value })}
            />
          </>
        )}
      </div>

      {/* Media Dithering Controls */}
      {settings.enableMediaMode && settings.mediaUrl && (
        <div className="mb-5 pb-4 border-b-half border-[#2a2d35]">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Media Dithering</h3>

          <ParameterControl
            label="Threshold"
            value={settings.ditherThreshold}
            min={0}
            max={255}
            step={1}
            onChange={(value) => updateSettings({ ditherThreshold: value })}
          />

          <ParameterControl
            label="Contrast"
            value={settings.mediaContrast}
            min={0}
            max={3}
            step={0.1}
            onChange={(value) => updateSettings({ mediaContrast: value })}
          />

          <ParameterControl
            label="Brightness"
            value={settings.mediaBrightness}
            min={0}
            max={3}
            step={0.1}
            onChange={(value) => updateSettings({ mediaBrightness: value })}
          />
        </div>
      )}

      {/* Export Controls - only show if not in tab mode */}
      {showExport && <ExportControls animationEngineRef={animationEngineRef} />}
    </div>
  );
});