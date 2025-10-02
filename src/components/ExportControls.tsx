import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAnimationStore } from '../stores/animationStore';

interface ExportControlsProps {
  animationEngineRef: React.RefObject<any>;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ animationEngineRef }) => {
  const { settings, exportSettings, setExportSettings, isExporting, exportProgress, setExporting } = useAnimationStore();
  const [showSettings, setShowSettings] = useState(false);

  const downloadFrames = (frames: string[], fps: number) => {
    frames.forEach((frameData, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `led-animation-${String(index).padStart(4, '0')}.png`;
        link.href = frameData;
        link.click();
      }, index * 100); // Stagger downloads
    });

    // Show completion message
    setTimeout(() => {
      alert(`
PNG Sequence Export Complete!
${frames.length} frames exported at ${fps} FPS

To create a video:
1. Use video editing software (Premiere, After Effects, DaVinci Resolve, etc.)
2. Import the PNG sequence
3. Set frame rate to ${fps} FPS
4. Export as MP4, MOV, or GIF

For quick GIF creation:
- Use online tools like ezgif.com
- Or ffmpeg: ffmpeg -framerate ${fps} -pattern_type glob -i 'led-animation-*.png' -c:v gif output.gif
      `);
    }, frames.length * 100 + 500);
  };

  const exportSingleFrame = () => {
    if (!animationEngineRef.current) return;

    const frameData = animationEngineRef.current.exportFrame();
    const link = document.createElement('a');
    link.download = 'led-animation-frame.png';
    link.href = frameData;
    link.click();
  };

  const startPNGSequenceExport = async () => {
    if (!animationEngineRef.current) return;

    setExporting(true, 0);
    setShowSettings(false);

    try {
      const frames = await animationEngineRef.current.exportSequence(exportSettings);
      downloadFrames(frames, exportSettings.fps);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false, 0);
    }
  };


  const exportAnimationData = () => {
    const data = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      framework: "React + Three.js + TypeScript",
      settings: settings,
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'led-animation-settings.json');
    link.click();
  };

  const exportLottieJSON = () => {
    // Create a basic Lottie structure
    const lottieData = {
      v: "5.7.0",
      fr: 30,
      ip: 0,
      op: Math.floor(settings.animationDuration * 0.03),
      w: 400,
      h: 400,
      nm: "LED Animation",
      ddd: 0,
      assets: [],
      layers: generateLottieLayers()
    };

    const dataStr = JSON.stringify(lottieData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'led-animation.json');
    link.click();
  };

  const generateLottieLayers = () => {
    // Simplified Lottie layer generation
    const layers = [];
    const gridSize = settings.gridSize;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = -(gridSize * settings.ledSpacing) / 2 + col * settings.ledSpacing;
        const y = -(gridSize * settings.ledSpacing) / 2 + row * settings.ledSpacing;

        layers.push({
          ddd: 0,
          ind: row * gridSize + col,
          ty: 4, // Shape layer
          nm: `LED_${row}_${col}`,
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [x + 200, y + 200, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [100, 100, 100] }
          },
          shapes: [{
            ty: "el",
            s: { a: 0, k: [6, 6] },
            p: { a: 0, k: [0, 0] }
          }]
        });
      }
    }

    return layers;
  };

  return (
    <div className="bg-surface p-4 rounded-lg mt-5">
      <h3 className="text-accent text-sm font-medium mb-4">Export Options</h3>

      <div className="grid grid-cols-2 gap-2.5">
        <Button
          className="col-span-2 text-xs px-3 py-2"
          onClick={() => setShowSettings(true)}
          disabled={isExporting}
        >
          🎬 Export PNG Sequence
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="text-xs"
          onClick={exportSingleFrame}
        >
          📷 Current Frame
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="text-xs"
          onClick={exportAnimationData}
        >
          📊 Export Data
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="col-span-2 text-xs"
          onClick={exportLottieJSON}
        >
          📦 Export Lottie JSON
        </Button>
      </div>

      {/* Export Progress */}
      {isExporting && (
        <div className="bg-muted p-4 rounded mt-2.5">
          <div className="text-accent mb-2.5 text-sm">Capturing frames...</div>
          <div className="bg-gray-800 h-5 rounded-full overflow-hidden">
            <div
              className="bg-accent h-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <div className="mt-2.5 text-muted-light text-xs">
            Progress: {Math.round(exportProgress)}%
          </div>
        </div>
      )}

      {/* Export Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg max-w-md w-full mx-4">
            <h4 className="text-accent font-medium mb-4">PNG Sequence Settings</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-muted-light text-sm mb-1">Frame Rate (FPS)</label>
                <Input
                  type="number"
                  value={exportSettings.fps}
                  min={12}
                  max={60}
                  onChange={(e) => setExportSettings({
                    ...exportSettings,
                    fps: Number(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-muted-light text-sm mb-1">Cycles to Export</label>
                <Input
                  type="number"
                  value={exportSettings.cycles}
                  min={1}
                  max={5}
                  onChange={(e) => setExportSettings({
                    ...exportSettings,
                    cycles: Number(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowSettings(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={startPNGSequenceExport}
                className="flex-1"
              >
                Start Export
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};