import React, { useState } from 'react';
import { Settings, Zap, Download, Info } from 'lucide-react';
import { AnimationControls } from './AnimationControls';
import { PerformanceSettings } from './PerformanceSettings';
import { ExportControls } from './ExportControls';

interface InspectorTabsProps {
  animationEngineRef: React.RefObject<any>;
}

type TabType = 'animation' | 'performance' | 'export' | 'info';

export function InspectorTabs({ animationEngineRef }: InspectorTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('animation');

  const tabs = [
    { id: 'animation' as TabType, label: 'Animation', icon: Settings },
    { id: 'performance' as TabType, label: 'Performance', icon: Zap },
    { id: 'export' as TabType, label: 'Export', icon: Download },
    { id: 'info' as TabType, label: 'Info', icon: Info },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Header */}
      <div className="flex border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition-all
                ${
                  activeTab === tab.id
                    ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'animation' && (
          <AnimationControls animationEngineRef={animationEngineRef} showExport={false} />
        )}
        {activeTab === 'performance' && (
          <div className="p-3">
            <PerformanceSettings />
          </div>
        )}
        {activeTab === 'export' && (
          <div className="p-3">
            <ExportControls animationEngineRef={animationEngineRef} />
          </div>
        )}
        {activeTab === 'info' && (
          <div className="p-4">
            <div className="bg-surface p-3 rounded text-sm leading-relaxed">
              <h3 className="text-accent text-sm font-medium mb-2">Advanced LED Animation Studio</h3>
              <p className="mb-3 text-xs">Multiple animation patterns with real-time controls:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Build-Debuild:</strong> Pulse expansion and contraction</li>
                <li><strong>Spiral:</strong> Rotating spiral arms with trails</li>
                <li><strong>Wave:</strong> Concentric wave ripples</li>
                <li><strong>Ripple:</strong> Dynamic radius pulsing</li>
                <li><strong>3D Y-Axis Rotation:</strong> Full 3D rotation of entire animation</li>
                <li><strong>Z-Axis Rotation:</strong> 2D planar rotation</li>
                <li><strong>Morphing:</strong> Dynamic shape deformation</li>
                <li><strong>Color Cycling:</strong> Smooth color transitions</li>
              </ul>
              <div className="mt-4 pt-3 border-t border-[var(--border-primary)]">
                <p className="text-xs text-muted">
                  <strong>Shortcuts:</strong> Space=Play/Pause, R=Reset, G=Toggle Background, B=Reverse, 1-4=Toggle Patterns, C=Color Cycling
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
