import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { LEDAnimationEngine } from '../animation/LEDAnimationEngine';
import { useAnimationStore } from '../stores/animationStore';

interface AnimationCanvasProps {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export const AnimationCanvas = forwardRef<LEDAnimationEngine | undefined, AnimationCanvasProps>((props, ref) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = props.canvasRef || internalCanvasRef;
  const engineRef = useRef<LEDAnimationEngine | null>(null);
  const { settings, playbackState, setPlaybackState } = useAnimationStore();

  // Expose the engine ref to parent components
  useImperativeHandle(ref, () => engineRef.current || undefined);

  // Initialize the animation engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    // Canvas size will be handled by the parent's useCanvasResizer hook
    if (!canvas.width) {
      canvas.width = 400;
      canvas.height = 400;
    }

    engineRef.current = new LEDAnimationEngine(canvas, settings);

    // Trigger initial resize if external canvas ref is provided
    if (props.canvasRef) {
      setTimeout(() => {
        if (engineRef.current && canvas.width && canvas.height) {
          engineRef.current.resize(canvas.width, canvas.height);
        }
      }, 200);
    }

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  // Update engine settings when store changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSettings(settings);
    }
  }, [settings]);

  // Sync playback state
  useEffect(() => {
    if (engineRef.current) {
      const engine = engineRef.current;

      if (playbackState.isPlaying !== engine.playbackState.isPlaying) {
        if (playbackState.isPlaying) {
          if (playbackState.isReversed) {
            engine.reverse();
          } else {
            engine.play();
          }
        } else {
          engine.pause();
        }
      }

      // Sync other playback state changes
      engine.playbackState = { ...engine.playbackState, ...playbackState };
    }
  }, [playbackState]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!engineRef.current) return;

      const { key } = event;
      const engine = engineRef.current;

      switch (key) {
        case ' ':
          event.preventDefault();
          setPlaybackState({ isPlaying: !playbackState.isPlaying });
          break;
        case 'r':
        case 'R':
          engine.reset();
          break;
        case 'g':
        case 'G':
          engine.updateSettings({ showBackground: !settings.showBackground });
          break;
        case 'b':
        case 'B':
          setPlaybackState({ isReversed: !playbackState.isReversed });
          break;
        case '1':
          engine.updateSettings({ enableBuildDebuild: !settings.enableBuildDebuild });
          break;
        case '2':
          engine.updateSettings({ enableSpiral: !settings.enableSpiral });
          break;
        case '3':
          engine.updateSettings({ enableWave: !settings.enableWave });
          break;
        case '4':
          engine.updateSettings({ enableRipple: !settings.enableRipple });
          break;
        case 'c':
        case 'C':
          engine.updateSettings({ enableColorTransition: !settings.enableColorTransition });
          break;
        case 'y':
        case 'Y':
          engine.updateSettings({ enableYAxisRotate: !settings.enableYAxisRotate });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackState, settings, setPlaybackState]);

  const handleCanvasClick = () => {
    if (engineRef.current) {
      engineRef.current.reset();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="border border-[#1f2430] rounded-lg shadow-lg cursor-pointer"
      id="stage"
    />
  );
});