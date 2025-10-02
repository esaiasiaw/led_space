import { create } from 'zustand';
import type { AnimationSettings, PlaybackState, ExportSettings } from '../types/animation';

interface AnimationStore {
  // Settings
  settings: AnimationSettings;
  updateSettings: (updates: Partial<AnimationSettings>) => void;
  resetSettings: () => void;

  // Playback state
  playbackState: PlaybackState;
  setPlaybackState: (updates: Partial<PlaybackState>) => void;

  // UI state
  isCodeEditorOpen: boolean;
  toggleCodeEditor: () => void;

  exportSettings: ExportSettings;
  setExportSettings: (settings: ExportSettings) => void;

  isExporting: boolean;
  exportProgress: number;
  setExporting: (isExporting: boolean, progress?: number) => void;
}

const defaultSettings: AnimationSettings = {
  // Basic settings
  gridSize: 25,
  ledSpacing: 12,
  innerRadius: 30,
  outerRadius: 80,
  animationDuration: 750,
  showGlow: false,
  showBackground: true,

  // Animation patterns
  enableBuildDebuild: true,
  enableSpiral: false,
  enableWave: false,
  enableRipple: false,
  enablePulse: false,
  enableScanner: false,
  enableSparkle: false,
  enableRadar: false,
  patternSpeed: 1.0,

  // Shape transformations
  enableRotation: false,
  rotationSpeed: 1.0,
  enableMorphing: false,
  morphIntensity: 0.5,

  // Color transitions
  enableColorTransition: false,
  colorSpeed: 1.0,
  ledColor: '#ffffff',
  ledColor2: '#7bb3ff',
  ledColor3: '#90ff7b',

  // 3D Effects & Modifiers
  enableSpiralModifier: false,
  enableYAxisRotate: false,
  enableFlicker: false,
  spiralIntensity: 0.5,
  yRotateSpeed: 1.0,
  flickerAmount: 0.2,

  // Post-processing
  bloomStrength: 0,
  bloomRadius: 0.4,
  bloomThreshold: 0.85,

  // Canvas background
  canvasBackgroundColor: '#000000',

  // Media & Dithering
  displayMode: 'led',
  enableMediaMode: false,
  mediaUrl: null,
  mediaType: null,
  ditherPreset: 'floyd-steinberg',
  ditherThreshold: 128,
  mediaContrast: 1.0,
  mediaBrightness: 1.0,

  // Shader Patterns
  enableShaderPattern: false,
  shaderShape: 'sphere',
  shaderType: '4x4',
  shaderSpeed: 1.0,
  shaderScale: 0.6,
  shaderColorFront: '#00b2ff',
  shaderColorBack: '#000000',
  shaderSize: 2,
};

const defaultPlaybackState: PlaybackState = {
  isPlaying: true,
  isReversed: false,
  currentTime: 0,
  startTime: Date.now(),
  rotationAngle: 0,
  yRotateAngle: 0,
  pulseScale: 0,
};

const defaultExportSettings: ExportSettings = {
  fps: 30,
  cycles: 1,
  format: 'png',
};

export const useAnimationStore = create<AnimationStore>((set) => ({
  // Settings
  settings: defaultSettings,
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates }
    })),
  resetSettings: () =>
    set({ settings: defaultSettings }),

  // Playback state
  playbackState: defaultPlaybackState,
  setPlaybackState: (updates) =>
    set((state) => ({
      playbackState: { ...state.playbackState, ...updates }
    })),

  // UI state
  isCodeEditorOpen: false,
  toggleCodeEditor: () =>
    set((state) => ({ isCodeEditorOpen: !state.isCodeEditorOpen })),

  exportSettings: defaultExportSettings,
  setExportSettings: (settings) =>
    set({ exportSettings: settings }),

  isExporting: false,
  exportProgress: 0,
  setExporting: (isExporting, progress = 0) =>
    set({ isExporting, exportProgress: progress }),
}));