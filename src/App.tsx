import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnimationCanvas } from './components/AnimationCanvas';
import { CodeEditor } from './components/CodeEditor';
import { MediaUpload } from './components/MediaUpload';
import { LayersPanel } from './components/LayersPanel';
import { Transport } from './components/Transport';
import { VersionHistory } from './components/VersionHistory';
import { SaveVersionDialog } from './components/SaveVersionDialog';
import { InspectorTabs } from './components/InspectorTabs';
import { Code, Save } from 'lucide-react';
import { useAnimationStore } from './stores/animationStore';
import { LEDAnimationEngine } from './animation/LEDAnimationEngine';
import { useInactivityDetector } from './hooks/useInactivityDetector';

const useCanvasResizer = (canvasRef: React.RefObject<HTMLCanvasElement | null>, containerRef: React.RefObject<HTMLDivElement | null>, engineRef: React.RefObject<LEDAnimationEngine | undefined>) => {
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const canvasSize = 600;

      canvas.style.width = `${canvasSize}px`;
      canvas.style.height = `${canvasSize}px`;
      canvas.width = canvasSize * dpr;
      canvas.height = canvasSize * dpr;

      if (engineRef.current) {
        engineRef.current.resize(canvasSize, canvasSize);
      }
    };

    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef, containerRef, engineRef]);
};

function App() {
  const animationEngineRef = useRef<LEDAnimationEngine | undefined>(undefined);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, updateSettings, isCodeEditorOpen, toggleCodeEditor } = useAnimationStore();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  useCanvasResizer(canvasRef, canvasHostRef, animationEngineRef);
  useInactivityDetector();

  return (
    <div className="w-full h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <header className="h-12 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">LED Space v2</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSaveDialogOpen(true)}
            className="px-3 py-1.5 text-xs rounded-md bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 transition-all duration-[var(--duration-fast)] flex items-center gap-2"
          >
            <Save size={14} />
            Save Version
          </button>
          <button
            onClick={() => toggleCodeEditor()}
            className="px-3 py-1.5 text-xs rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-all duration-[var(--duration-fast)] flex items-center gap-2"
          >
            <Code size={14} />
            Code Editor
          </button>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Version History & Layers & Media */}
        <aside className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col flex-shrink-0">
          {/* Version History Section */}
          <div className="h-[35%] border-b border-[var(--border-primary)] overflow-hidden">
            <VersionHistory />
          </div>

          {/* Layers Section */}
          <div className="flex-1 min-h-0 border-b border-[var(--border-primary)]">
            <LayersPanel />
          </div>

          {/* Media & Patterns Section */}
          <div className="h-[45%] overflow-y-auto">
            <div className="p-2 space-y-3">
              {/* Media Upload */}
              <div>
                <h4 className="section-title mb-2">Media</h4>
                <MediaUpload />
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--border-primary)]"></div>

              {/* Pattern Selector */}
              <div>
                <h4 className="section-title mb-2">Pattern</h4>
                <select
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all duration-[var(--duration-fast)]"
                  value={
                    settings.enableBuildDebuild ? 'buildDebuild' :
                    settings.enableSpiral ? 'spiral' :
                    settings.enableWave ? 'wave' :
                    settings.enableRipple ? 'ripple' :
                    settings.enablePulse ? 'pulse' :
                    settings.enableScanner ? 'scanner' :
                    settings.enableSparkle ? 'sparkle' :
                    settings.enableRadar ? 'radar' : 'none'
                  }
                  onChange={(e) => {
                    const pattern = e.target.value;
                    updateSettings({
                      enableBuildDebuild: pattern === 'buildDebuild',
                      enableSpiral: pattern === 'spiral',
                      enableWave: pattern === 'wave',
                      enableRipple: pattern === 'ripple',
                      enablePulse: pattern === 'pulse',
                      enableScanner: pattern === 'scanner',
                      enableSparkle: pattern === 'sparkle',
                      enableRadar: pattern === 'radar',
                    });
                  }}
                >
                  <option value="none">None</option>
                  <option value="buildDebuild">Build-Debuild</option>
                  <option value="spiral">Spiral</option>
                  <option value="wave">Wave</option>
                  <option value="ripple">Ripple</option>
                  <option value="pulse">Pulse</option>
                  <option value="scanner">Scanner</option>
                  <option value="sparkle">Sparkle</option>
                  <option value="radar">Radar</option>
                </select>

                {/* Pattern Speed */}
                <div className="mt-3">
                  <div className="parameter-label">
                    <label className="parameter-name">Speed</label>
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">{settings.patternSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={settings.patternSpeed}
                    onChange={(e) => updateSettings({ patternSpeed: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Canvas Workspace */}
        <main className="flex-1 min-w-0 bg-[var(--bg-primary)] flex flex-col items-center justify-center relative overflow-auto">
          <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-6">
            {/* Canvas Frame */}
            <motion.div
              id="canvasHost"
              ref={canvasHostRef}
              className="relative"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {/* Frame Label */}
              <div className="absolute -top-7 left-0 text-xs text-[var(--text-tertiary)] font-medium">
                LED Animation Frame
              </div>

              {/* Frame Container */}
              <div className="relative bg-black rounded-lg shadow-2xl border border-[var(--border-primary)]">
                {/* Ambient glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 blur-2xl -z-10 opacity-50" />

                {/* Canvas */}
                <div className="relative overflow-hidden rounded-lg">
                  <AnimationCanvas ref={animationEngineRef} canvasRef={canvasRef} />
                </div>
              </div>
            </motion.div>

            {/* Display Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="flex items-center gap-0 bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border-primary)]">
                <button
                  onClick={() => updateSettings({ displayMode: 'led', enableMediaMode: false })}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-[var(--duration-normal)] focus:outline-none ${
                    settings.displayMode === 'led'
                      ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  LED
                </button>
                <button
                  onClick={() => updateSettings({ displayMode: 'media', enableMediaMode: true })}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-[var(--duration-normal)] focus:outline-none ${
                    settings.displayMode === 'media'
                      ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Media
                </button>
                <button
                  onClick={() => updateSettings({ displayMode: 'combined', enableMediaMode: true })}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-[var(--duration-normal)] focus:outline-none ${
                    settings.displayMode === 'combined'
                      ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Combined
                </button>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Right Inspector Panel */}
        <aside className="w-96 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] flex flex-col flex-shrink-0">
          <InspectorTabs animationEngineRef={animationEngineRef} />
        </aside>
      </div>

      {/* Bottom Transport Bar */}
      <Transport />

      {/* Code Editor Modal */}
      {isCodeEditorOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => toggleCodeEditor()}
        >
          <motion.div
            className="w-[90%] h-[85%] bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-primary)] shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CodeEditor />
          </motion.div>
        </motion.div>
      )}

      {/* Save Version Dialog */}
      <SaveVersionDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        canvasRef={canvasRef}
      />
    </div>
  );
}

export default App;
