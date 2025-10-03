import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Switch } from './ui/Switch';
import { useAnimationStore } from '../stores/animationStore';
import JSZip from 'jszip';

interface ExportControlsProps {
  animationEngineRef: React.RefObject<any>;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ animationEngineRef }) => {
  const { settings, exportSettings, setExportSettings, isExporting, exportProgress, setExporting } = useAnimationStore();
  const [showSettings, setShowSettings] = useState(false);

  const downloadFrames = async (frames: string[], fps: number) => {
    try {
      // Create a new ZIP file
      const zip = new JSZip();

      // Add each frame to the ZIP
      for (let i = 0; i < frames.length; i++) {
        const frameData = frames[i];
        // Convert base64 to blob
        const base64Data = frameData.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Add to ZIP with padded filename
        const filename = `led-animation-${String(i).padStart(4, '0')}.png`;
        zip.file(filename, byteArray);
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download ZIP file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `led-animation-${fps}fps-${frames.length}frames.zip`;
      link.click();
      URL.revokeObjectURL(link.href);

      // Show completion message
      alert(`
PNG Sequence Export Complete!
${frames.length} frames exported at ${fps} FPS

📦 All frames packaged in a ZIP file

To create a video:
1. Extract the ZIP file
2. Use video editing software (Premiere, After Effects, DaVinci Resolve, etc.)
3. Import the PNG sequence
4. Set frame rate to ${fps} FPS
5. Export as MP4, MOV, or GIF

For quick GIF creation:
- Use online tools like ezgif.com
- Or ffmpeg: ffmpeg -framerate ${fps} -pattern_type glob -i 'led-animation-*.png' output.gif
      `);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP file. Please try again.');
    }
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

  const exportAfterEffectsScript = async () => {
    if (!animationEngineRef.current) return;

    setExporting(true, 0);

    try {
      const engine = animationEngineRef.current;
      const fps = 30;
      const duration = settings.animationDuration * 2;
      const totalFrames = Math.floor((duration / 1000) * fps);

      // Capture LED states for each frame
      const frameData: any[] = [];

      const originalPlaying = engine.playbackState.isPlaying;
      const originalTime = engine.playbackState.currentTime;
      const originalStartTime = engine.playbackState.startTime;

      // Keep isPlaying TRUE so animation logic runs, but control time manually
      engine.playbackState.isPlaying = true;

      for (let i = 0; i < totalFrames; i++) {
        // Manually set the time by adjusting startTime
        const targetTime = (i / fps) * 1000;
        engine.playbackState.startTime = Date.now() - targetTime;
        engine.playbackState.currentTime = targetTime;

        engine.updateAnimation();

        const ledStates = engine.ledGrid.map((row: any[]) =>
          row.map((led: any) => ({
            x: led.x,
            y: led.y,
            brightness: led.brightness,
            color: led.currentColor
          }))
        );

        frameData.push(ledStates);
        setExporting(true, (i / totalFrames) * 100);

        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Restore state
      engine.playbackState.isPlaying = originalPlaying;
      engine.playbackState.currentTime = originalTime;
      engine.playbackState.startTime = originalStartTime;

      // Generate After Effects JSX script
      const script = generateAfterEffectsScript(frameData, fps);

      const blob = new Blob([script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'led-animation.jsx';
      link.click();
      URL.revokeObjectURL(url);

      alert('After Effects script exported!\n\nTo use:\n1. Open After Effects\n2. File → Scripts → Run Script File...\n3. Select led-animation.jsx\n4. A new composition will be created with your animation');
    } catch (error) {
      console.error('After Effects export failed:', error);
      alert('After Effects export failed. Please try again.');
    } finally {
      setExporting(false, 0);
    }
  };

  const generateAfterEffectsScript = (frameData: any[], fps: number): string => {
    const gridSize = settings.gridSize;
    const compWidth = 600;
    const compHeight = 600;
    const centerOffset = 300;

    let script = `// LED Animation - After Effects Script
// Generated: ${new Date().toISOString()}

app.beginUndoGroup("Create LED Animation");

// Create composition
var comp = app.project.items.addComp("LED Animation", ${compWidth}, ${compHeight}, 1, ${frameData.length / fps}, ${fps});

// Create background solid
var bgLayer = comp.layers.addSolid(hexToRGB("${settings.canvasBackgroundColor}"), "Background", ${compWidth}, ${compHeight}, 1);

`;

    // Generate LED layers
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const firstLED = frameData[0][row][col];
        const x = firstLED.x + centerOffset;
        const y = -firstLED.y + centerOffset;
        const color = firstLED.color || settings.ledColor;

        script += `
// LED ${row}_${col}
var led_${row}_${col} = comp.layers.addShape();
led_${row}_${col}.name = "LED_${row}_${col}";
var ledGroup = led_${row}_${col}.property("Contents").addProperty("ADBE Vector Group");
ledGroup.name = "Circle";
var ellipse = ledGroup.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
ellipse.property("Size").setValue([8, 8]);
var fill = ledGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
fill.property("Color").setValue(hexToRGB("${color}"));
led_${row}_${col}.property("Position").setValue([${x.toFixed(2)}, ${y.toFixed(2)}]);

// Animate opacity
var opacityProp = led_${row}_${col}.property("Opacity");
opacityProp.setValueAtTime(0, ${((frameData[0][row][col].brightness / 255) * 100).toFixed(2)});
`;

        // Add keyframes for ALL frames to ensure smooth animation
        for (let frameIndex = 1; frameIndex < frameData.length; frameIndex++) {
          const led = frameData[frameIndex][row][col];
          const opacity = led.brightness;
          const time = frameIndex / fps;
          const opacityPercent = (opacity / 255) * 100;
          script += `opacityProp.setValueAtTime(${time.toFixed(4)}, ${opacityPercent.toFixed(2)});\n`;
        }
      }
    }

    script += `
// Helper function to convert hex to RGB
function hexToRGB(hex) {
    var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
}

app.endUndoGroup();
alert("LED Animation created successfully!");
`;

    return script;
  };

  const exportLottieJSON = async (isPreview: boolean = false) => {
    if (!animationEngineRef.current) return;

    setExporting(true, 0);

    try {
      const engine = animationEngineRef.current;

      // DEBUG: Log current settings before export
      console.log('=== EXPORT DEBUG: Current Settings ===');
      console.log('Grid Size:', settings.gridSize);
      console.log('LED Spacing:', settings.ledSpacing);
      console.log('Inner Radius:', settings.innerRadius);
      console.log('Outer Radius:', settings.outerRadius);
      console.log('LED Color:', settings.ledColor);
      console.log('LED Color 2:', settings.ledColor2);
      console.log('LED Color 3:', settings.ledColor3);
      console.log('Color Cycle Speed:', settings.colorSpeed);
      console.log('Enable Color Transition:', settings.enableColorTransition);
      console.log('Y-Axis Rotation Enabled:', settings.enableYAxisRotate);
      console.log('Y-Rotation Speed:', settings.yRotateSpeed);
      console.log('Animation Duration:', settings.animationDuration);
      console.log('Canvas Background:', settings.canvasBackgroundColor);
      console.log('Active Patterns:', {
        buildDebuild: settings.enableBuildDebuild,
        spiral: settings.enableSpiral,
        pulse: settings.enablePulse,
        wave: settings.enableWave,
        scanner: settings.enableScanner,
        sparkle: settings.enableSparkle,
        radar: settings.enableRadar
      });

      const fps = isPreview ? 15 : 30; // Lower FPS for preview
      const duration = settings.animationDuration * 2; // Full cycle
      const totalFrames = Math.floor((duration / 1000) * fps);

      console.log('Export Mode:', isPreview ? 'PREVIEW' : 'PRODUCTION');
      console.log('FPS:', fps);
      console.log('Duration (ms):', duration);
      console.log('Total Frames:', totalFrames);

      // Capture LED states for each frame
      const frameData: any[] = [];

      const originalPlaying = engine.playbackState.isPlaying;
      const originalTime = engine.playbackState.currentTime;
      const originalStartTime = engine.playbackState.startTime;

      // Keep isPlaying TRUE so animation logic runs, but control time manually
      engine.playbackState.isPlaying = true;

      for (let i = 0; i < totalFrames; i++) {
        // Manually set the time by adjusting startTime
        const targetTime = (i / fps) * 1000;
        engine.playbackState.startTime = Date.now() - targetTime;
        engine.playbackState.currentTime = targetTime;

        engine.updateAnimation();

        // Capture LED grid state
        const ledStates = engine.ledGrid.map((row: any[]) =>
          row.map((led: any) => ({
            x: led.x,
            y: led.y,
            brightness: led.brightness,
            color: led.currentColor
          }))
        );

        frameData.push(ledStates);

        // Debug: Log first, middle, and last frames
        if (i === 0 || i === Math.floor(totalFrames / 2) || i === totalFrames - 1) {
          const frameLabel = i === 0 ? 'FIRST' : i === totalFrames - 1 ? 'LAST' : 'MIDDLE';
          console.log(`\n=== ${frameLabel} FRAME (${i}/${totalFrames}) ===`);
          console.log('Sample LED [0][0]:', ledStates[0][0]);
          console.log('Sample LED [center]:', ledStates[Math.floor(settings.gridSize/2)][Math.floor(settings.gridSize/2)]);

          const allBrightness = ledStates.flat().map((l: any) => l.brightness);
          const maxBrightness = Math.max(...allBrightness);
          const minBrightness = Math.min(...allBrightness);
          const avgBrightness = allBrightness.reduce((a: number, b: number) => a + b, 0) / allBrightness.length;
          const litLEDs = allBrightness.filter((b: number) => b > 10).length;

          console.log('Brightness Stats:', {
            max: maxBrightness,
            min: minBrightness,
            avg: avgBrightness.toFixed(2),
            litLEDs: `${litLEDs}/${allBrightness.length}`,
            percentageLit: `${((litLEDs / allBrightness.length) * 100).toFixed(1)}%`
          });
        }

        setExporting(true, (i / totalFrames) * 100);

        await new Promise(resolve => setTimeout(resolve, 1));
      }

      console.log('\n=== FRAME CAPTURE COMPLETE ===');
      console.log('Total frames captured:', frameData.length);

      // Restore state
      engine.playbackState.isPlaying = originalPlaying;
      engine.playbackState.currentTime = originalTime;
      engine.playbackState.startTime = originalStartTime;

      // Generate Lottie JSON with animated layers
      console.log('\n=== GENERATING LOTTIE JSON ===');
      const layers = generateAnimatedLottieLayers(frameData, fps, isPreview);
      console.log('Total layers generated:', layers.length);
      console.log('First layer sample:', layers[0]);
      if (layers.length > 1) {
        console.log('Second layer (first LED) sample:', layers[1]);
      }

      const lottieData = {
        v: "5.9.0",
        fr: fps,
        ip: 0,
        op: totalFrames,
        w: 600,
        h: 600,
        nm: isPreview ? "LED Animation (Preview)" : "LED Animation",
        ddd: 0,
        assets: [],
        layers: layers,
        markers: []
      };

      console.log('Lottie JSON structure:', {
        version: lottieData.v,
        frameRate: lottieData.fr,
        inPoint: lottieData.ip,
        outPoint: lottieData.op,
        width: lottieData.w,
        height: lottieData.h,
        totalLayers: lottieData.layers.length,
        name: lottieData.nm
      });

      // Validate Lottie JSON structure
      const validation = validateLottieJSON(lottieData);

      const dataStr = JSON.stringify(lottieData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      console.log('JSON size:', (dataStr.length / 1024).toFixed(2), 'KB');

      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', isPreview ? 'led-animation-preview.json' : 'led-animation-production.json');
      link.click();

      console.log('=== EXPORT COMPLETE ===\n');

      const message = isPreview
        ? 'Preview Lottie exported! (15 FPS, optimized for quick preview)\n\nUse this for:\n• LottieFiles.com preview\n• Quick testing\n• Sharing drafts'
        : 'Production Lottie exported! (30 FPS, high quality)\n\nUse this for:\n• Final apps/websites\n• Client delivery\n• Production environments';

      alert(message);
    } catch (error) {
      console.error('Lottie export failed:', error);
      alert('Lottie export failed. Please try again.');
    } finally {
      setExporting(false, 0);
    }
  };

  const generateAnimatedLottieLayers = (frameData: any[], fps: number, isPreview: boolean = false) => {
    console.log('\n=== LAYER GENERATION START ===');
    console.log('Frame data length:', frameData.length);
    console.log('Grid size:', settings.gridSize);
    console.log('Is preview mode:', isPreview);

    const layers = [];
    const gridSize = settings.gridSize;
    const centerOffset = 300; // Center in 600x600 canvas

    // Background layer first (higher ind means renders behind in Lottie)
    // Using a very high ind so it renders behind all LEDs
    layers.push({
      ddd: 0,
      ind: 999999,
      ty: 1,
      nm: "Background",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [300, 300, 0] },
        a: { a: 0, k: [300, 300, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      sw: 600,
      sh: 600,
      sc: settings.canvasBackgroundColor,
      ip: 0,
      op: frameData.length,
      st: 0,
      bm: 0
    });

    console.log('Background layer added');

    // Adjust threshold based on export type
    const changeThreshold = isPreview ? 10 : 5; // More aggressive optimization for preview
    console.log('Opacity change threshold:', changeThreshold);

    let skippedLEDs = 0;
    let includedLEDs = 0;
    let sampleLEDLogged = false;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const ledIndex = row * gridSize + col + 1;

        // Get position from first frame
        const firstLED = frameData[0][row][col];
        const x = firstLED.x + centerOffset;
        const y = -firstLED.y + centerOffset; // Flip Y for Lottie

        // Check if this LED ever lights up
        const maxBrightness = Math.max(...frameData.map(f => f[row][col].brightness));

        // Skip LEDs that never light up to reduce file size
        if (maxBrightness < 10) {
          skippedLEDs++;
          continue;
        }

        includedLEDs++;

        // Log first included LED as sample
        if (!sampleLEDLogged) {
          console.log(`\nSample LED [${row}][${col}]:`, {
            position: { x, y },
            maxBrightness,
            color: firstLED.color || settings.ledColor
          });
          sampleLEDLogged = true;
        }

        // Build opacity keyframes - only include frames where brightness changes significantly
        const opacityKeyframes = [];
        let lastOpacity = -1;

        for (let frameIndex = 0; frameIndex < frameData.length; frameIndex++) {
          const led = frameData[frameIndex][row][col];
          const opacity = (led.brightness / 255) * 100;

          // Add keyframe if significant change or first/last frame
          if (frameIndex === 0 || frameIndex === frameData.length - 1 || Math.abs(opacity - lastOpacity) > changeThreshold) {
            opacityKeyframes.push({
              i: { x: [0.833], y: [0.833] },
              o: { x: [0.167], y: [0.167] },
              t: frameIndex,
              s: [opacity],
              e: [opacity]
            });
            lastOpacity = opacity;
          }
        }

        // Set end values for proper animation
        for (let i = 0; i < opacityKeyframes.length - 1; i++) {
          opacityKeyframes[i].e = opacityKeyframes[i + 1].s;
        }

        // Log keyframes for first included LED
        if (includedLEDs === 1) {
          console.log('Opacity keyframes for sample LED:', {
            count: opacityKeyframes.length,
            first: opacityKeyframes[0],
            last: opacityKeyframes[opacityKeyframes.length - 1]
          });
        }

        // Simplify: Use a basic shape layer structure
        layers.push({
          ddd: 0,
          ind: ledIndex,
          ty: 4,
          nm: `LED_${row}_${col}`,
          sr: 1,
          ks: {
            o: opacityKeyframes.length > 1
              ? { a: 1, k: opacityKeyframes }
              : { a: 0, k: opacityKeyframes[0].s[0] },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [x, y] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] }
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              it: [
                {
                  ty: "el",
                  s: { a: 0, k: [16, 16] },
                  p: { a: 0, k: [0, 0] }
                },
                {
                  ty: "fl",
                  c: { a: 0, k: hexToRGB(firstLED.color || settings.ledColor) },
                  o: { a: 0, k: 100 }
                },
                {
                  ty: "tr",
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: frameData.length,
          st: 0
        });
      }
    }

    console.log('\n=== LAYER GENERATION SUMMARY ===');
    console.log('Total LEDs processed:', gridSize * gridSize);
    console.log('LEDs skipped (never lit):', skippedLEDs);
    console.log('LEDs included in export:', includedLEDs);
    console.log('Total layers (with background):', layers.length);
    console.log('=== LAYER GENERATION COMPLETE ===\n');

    return layers;
  };

  const validateLottieJSON = (lottieData: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check required top-level properties
    if (!lottieData.v) errors.push('Missing version (v)');
    if (!lottieData.fr) errors.push('Missing frame rate (fr)');
    if (lottieData.op === undefined) errors.push('Missing out point (op)');
    if (!lottieData.w) errors.push('Missing width (w)');
    if (!lottieData.h) errors.push('Missing height (h)');
    if (!lottieData.layers) errors.push('Missing layers array');

    // Check layers
    if (lottieData.layers && lottieData.layers.length === 0) {
      errors.push('No layers found - animation will be empty');
    }

    // Check if any layers have animated properties
    if (lottieData.layers && lottieData.layers.length > 1) {
      const hasAnimation = lottieData.layers.some((layer: any) =>
        layer.ks && layer.ks.o && layer.ks.o.a === 1
      );
      if (!hasAnimation) {
        errors.push('WARNING: No animated opacity found - animation may appear static');
      }
    }

    // Check layer structure for first LED layer (skip background)
    if (lottieData.layers && lottieData.layers.length > 1) {
      const firstLED = lottieData.layers[1];
      if (!firstLED.shapes || firstLED.shapes.length === 0) {
        errors.push('LED layer missing shapes');
      }
      if (!firstLED.ks || !firstLED.ks.o) {
        errors.push('LED layer missing opacity property');
      }
    }

    console.log('\n=== LOTTIE VALIDATION ===');
    console.log('Valid:', errors.length === 0);
    if (errors.length > 0) {
      console.log('Errors/Warnings:', errors);
    }
    console.log('=== VALIDATION COMPLETE ===\n');

    return { valid: errors.length === 0, errors };
  };

  const hexToRGB = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
      1
    ] : [1, 1, 1, 1];
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
          className="text-xs"
          onClick={() => exportLottieJSON(true)}
          disabled={isExporting}
        >
          👀 Lottie Preview
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="text-xs"
          onClick={() => exportLottieJSON(false)}
          disabled={isExporting}
        >
          📦 Lottie Production
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="col-span-2 text-xs"
          onClick={exportAfterEffectsScript}
          disabled={isExporting}
        >
          🎬 After Effects Script
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-[#1a1d23] border border-[#2a2d35] p-8 rounded-lg max-w-md w-full mx-4 shadow-2xl">
            <h4 className="text-white font-semibold text-lg mb-6">PNG Sequence Settings</h4>

            <div className="space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Frame Rate (FPS)</label>
                <Input
                  type="number"
                  value={exportSettings.fps}
                  min={12}
                  max={120}
                  onChange={(e) => setExportSettings({
                    ...exportSettings,
                    fps: Number(e.target.value)
                  })}
                  className="w-full text-base"
                />
                <p className="text-xs text-gray-500 mt-1">Higher FPS = smoother animation, more frames</p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Cycles to Export</label>
                <Input
                  type="number"
                  value={exportSettings.cycles}
                  min={1}
                  max={5}
                  onChange={(e) => setExportSettings({
                    ...exportSettings,
                    cycles: Number(e.target.value)
                  })}
                  className="w-full text-base"
                />
                <p className="text-xs text-gray-500 mt-1">Number of animation loops to export</p>
              </div>

              <div className="border-t border-[#2a2d35] pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Transparent Background</label>
                    <p className="text-xs text-gray-500">Export with alpha channel (no background)</p>
                  </div>
                  <Switch
                    checked={exportSettings.transparentBackground}
                    onCheckedChange={(checked) => setExportSettings({
                      ...exportSettings,
                      transparentBackground: checked
                    })}
                  />
                </div>
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