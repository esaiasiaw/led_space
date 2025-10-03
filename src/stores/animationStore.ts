import { create } from 'zustand';
import type { AnimationSettings, PlaybackState, ExportSettings, AnimationVersion } from '../types/animation';

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

  // Version management
  versions: AnimationVersion[];
  saveVersion: (name: string, thumbnail?: string, notes?: string) => void;
  loadVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  renameVersion: (id: string, newName: string) => void;

  // Performance mode
  isPerformanceMode: boolean;
  togglePerformanceMode: () => void;
  inactivityTimeout: number;
  setInactivityTimeout: (minutes: number) => void;
  lastActivityTime: number;
  updateActivity: () => void;
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
  enableBloom: false,
  bloomStrength: 1.5,
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
  fps: 60,
  cycles: 1,
  format: 'png',
  transparentBackground: false,
};

// Load versions from localStorage
const loadVersionsFromStorage = (): AnimationVersion[] => {
  try {
    const stored = localStorage.getItem('animation-versions');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load versions from localStorage:', error);
    return [];
  }
};

// Save versions to localStorage
const saveVersionsToStorage = (versions: AnimationVersion[]) => {
  try {
    localStorage.setItem('animation-versions', JSON.stringify(versions));
  } catch (error) {
    console.error('Failed to save versions to localStorage:', error);
  }
};

export const useAnimationStore = create<AnimationStore>((set, get) => ({
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

  // Version management
  versions: loadVersionsFromStorage(),

  saveVersion: (name, thumbnail, notes) => {
    const newVersion: AnimationVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      settings: { ...get().settings },
      thumbnail,
      notes,
    };

    const updatedVersions = [newVersion, ...get().versions];
    saveVersionsToStorage(updatedVersions);
    set({ versions: updatedVersions });
  },

  loadVersion: (id) => {
    const version = get().versions.find(v => v.id === id);
    if (version) {
      set({ settings: { ...version.settings } });
    }
  },

  deleteVersion: (id) => {
    const updatedVersions = get().versions.filter(v => v.id !== id);
    saveVersionsToStorage(updatedVersions);
    set({ versions: updatedVersions });
  },

  renameVersion: (id, newName) => {
    const updatedVersions = get().versions.map(v =>
      v.id === id ? { ...v, name: newName } : v
    );
    saveVersionsToStorage(updatedVersions);
    set({ versions: updatedVersions });
  },

  // Performance mode
  isPerformanceMode: false,
  togglePerformanceMode: () => {
    set((state) => ({ isPerformanceMode: !state.isPerformanceMode }));
  },

  inactivityTimeout: 5, // minutes
  setInactivityTimeout: (minutes) => {
    set({ inactivityTimeout: minutes });
  },

  lastActivityTime: Date.now(),
  updateActivity: () => {
    set({ lastActivityTime: Date.now() });
  },
}));