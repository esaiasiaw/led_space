import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Repeat, SkipBack, SkipForward } from 'lucide-react';
import { useAnimationStore } from '../stores/animationStore';

export const Transport: React.FC = () => {
  const { playbackState, setPlaybackState, settings } = useAnimationStore();
  const [timecode, setTimecode] = useState('00:00.000');
  const [isLooping, setIsLooping] = useState(true);

  // Calculate timecode
  useEffect(() => {
    const interval = setInterval(() => {
      if (playbackState.isPlaying) {
        const elapsed = Date.now() - playbackState.startTime;
        const totalMs = elapsed % (settings.animationDuration * 1000);

        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const milliseconds = totalMs % 1000;

        setTimecode(
          `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
        );
      }
    }, 16);

    return () => clearInterval(interval);
  }, [playbackState.isPlaying, playbackState.startTime, settings.animationDuration]);

  const handlePlay = () => {
    setPlaybackState({ isPlaying: true, isReversed: false, startTime: Date.now() });
  };

  const handlePause = () => {
    setPlaybackState({ isPlaying: false });
  };

  const handleReset = () => {
    setPlaybackState({
      startTime: Date.now(),
      currentTime: 0,
      isPlaying: false,
      rotationAngle: 0,
      yRotateAngle: 0,
      pulseScale: 0.2,
    });
  };

  const handleStepBack = () => {
    // Step back 1 frame (60fps)
    const currentTime = playbackState.currentTime - (1000 / 60);
    setPlaybackState({ currentTime: Math.max(0, currentTime), isPlaying: false });
  };

  const handleStepForward = () => {
    // Step forward 1 frame (60fps)
    const currentTime = playbackState.currentTime + (1000 / 60);
    setPlaybackState({ currentTime, isPlaying: false });
  };

  return (
    <div className="h-14 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] flex items-center justify-between px-4">
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-1">
        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-fast)]"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>

        {/* Step Back */}
        <button
          onClick={handleStepBack}
          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-fast)]"
          title="Step Back"
        >
          <SkipBack size={16} />
        </button>

        {/* Play/Pause */}
        {!playbackState.isPlaying ? (
          <button
            onClick={handlePlay}
            className="w-10 h-10 rounded-md flex items-center justify-center bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-all duration-[var(--duration-normal)] mx-1"
            title="Play"
          >
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="w-10 h-10 rounded-md flex items-center justify-center bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-all duration-[var(--duration-normal)] mx-1"
            title="Pause"
          >
            <Pause size={18} fill="currentColor" />
          </button>
        )}

        {/* Step Forward */}
        <button
          onClick={handleStepForward}
          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-fast)]"
          title="Step Forward"
        >
          <SkipForward size={16} />
        </button>

        {/* Loop Toggle */}
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-[var(--duration-fast)] ml-2 ${
            isLooping
              ? 'bg-[var(--accent-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
          }`}
          title={isLooping ? 'Loop On' : 'Loop Off'}
        >
          <Repeat size={16} />
        </button>
      </div>

      {/* Center: Animation Info */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
        <span>Duration: {(settings.animationDuration / 1000).toFixed(2)}s</span>
        <span className="w-px h-4 bg-[var(--border-primary)]"></span>
        <span>60 FPS</span>
      </div>

      {/* Right: Timecode */}
      <div className="flex items-center gap-3">
        <div className="font-mono text-sm text-[var(--text-primary)] font-medium tabular-nums">
          {timecode}
        </div>
      </div>
    </div>
  );
};
