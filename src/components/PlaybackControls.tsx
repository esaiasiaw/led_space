import React from 'react';
import { motion } from 'framer-motion';
import { useAnimationStore } from '../stores/animationStore';
import { Play, Pause, RotateCcw, Undo2 } from 'lucide-react';

export const PlaybackControls: React.FC = () => {
  const { playbackState, setPlaybackState } = useAnimationStore();

  const handlePlay = () => {
    setPlaybackState({ isPlaying: true, isReversed: false });
  };

  const handlePause = () => {
    setPlaybackState({ isPlaying: false });
  };

  const handleReverse = () => {
    setPlaybackState({ isPlaying: true, isReversed: true });
  };

  const handleReset = () => {
    setPlaybackState({
      startTime: Date.now(),
      rotationAngle: 0,
      yRotateAngle: 0,
      pulseScale: 0.2,
      isReversed: false,
    });
  };

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <button
        onClick={handlePlay}
        disabled={playbackState.isPlaying && !playbackState.isReversed}
        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
          playbackState.isPlaying && !playbackState.isReversed
            ? 'bg-[#2a2d35] border-[#3a3d45] text-white cursor-not-allowed'
            : 'bg-[#1a1d23] border-[#2a2d35] text-gray-300 hover:bg-[#2a2d35]'
        }`}
        title="Play"
      >
        <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
      </button>

      <button
        onClick={handlePause}
        disabled={!playbackState.isPlaying}
        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
          !playbackState.isPlaying
            ? 'bg-[#2a2d35] border-[#3a3d45] text-white'
            : 'bg-[#1a1d23] border-[#2a2d35] text-gray-300 hover:bg-[#2a2d35]'
        }`}
        title="Pause"
      >
        <Pause className="w-4 h-4" fill="currentColor" />
      </button>

      <button
        onClick={handleReverse}
        disabled={playbackState.isPlaying && playbackState.isReversed}
        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
          playbackState.isPlaying && playbackState.isReversed
            ? 'bg-[#2a2d35] border-[#3a3d45] text-white cursor-not-allowed'
            : 'bg-[#1a1d23] border-[#2a2d35] text-gray-300 hover:bg-[#2a2d35]'
        }`}
        title="Reverse"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      <button
        onClick={handleReset}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1a1d23] border border-[#2a2d35] text-gray-300 hover:bg-[#2a2d35] transition-colors"
        title="Reset"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </motion.div>
  );
};