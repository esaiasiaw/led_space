export interface LEDState {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  row: number;
  col: number;
  isOn: boolean;
  brightness: number;
  targetBrightness: number;
  currentColor: string;
  animationOffset: number;
}

export interface AnimationPoint3D {
  x: number;
  y: number;
  z: number;
  brightness: number;
  source: 'buildDebuild' | 'spiral' | 'wave' | 'ripple' | 'pulse' | 'scanner' | 'sparkle' | 'radar' | 'static';
}

export interface AnimationSettings {
  // Basic settings
  gridSize: number;
  ledSpacing: number;
  innerRadius: number;
  outerRadius: number;
  animationDuration: number;
  showGlow: boolean;
  showBackground: boolean;

  // Animation patterns
  enableBuildDebuild: boolean;
  enableSpiral: boolean;
  enableWave: boolean;
  enableRipple: boolean;
  enablePulse: boolean;
  enableScanner: boolean;
  enableSparkle: boolean;
  enableRadar: boolean;
  patternSpeed: number;

  // Shape transformations
  enableRotation: boolean;
  rotationSpeed: number;
  enableMorphing: boolean;
  morphIntensity: number;

  // Color transitions
  enableColorTransition: boolean;
  colorSpeed: number;
  ledColor: string;
  ledColor2: string;
  ledColor3: string;

  // 3D Effects & Modifiers
  enableSpiralModifier: boolean;
  enableYAxisRotate: boolean;
  enableFlicker: boolean;
  spiralIntensity: number;
  yRotateSpeed: number;
  flickerAmount: number;

  // Post-processing
  enableBloom: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;

  // Canvas background
  canvasBackgroundColor: string;

  // Media & Dithering
  displayMode: 'led' | 'media' | 'combined';
  enableMediaMode: boolean;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  ditherPreset: 'none' | 'floyd-steinberg' | 'bayer' | 'atkinson' | 'halftone';
  ditherThreshold: number;
  mediaContrast: number;
  mediaBrightness: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  isReversed: boolean;
  currentTime: number;
  startTime: number;
  rotationAngle: number;
  yRotateAngle: number;
  pulseScale: number;
}

export interface ExportSettings {
  fps: number;
  cycles: number;
  format: 'png' | 'lottie' | 'data' | 'svg';
  transparentBackground: boolean;
}

export interface AnimationEngine {
  ledGrid: LEDState[][];
  animatedPoints: AnimationPoint3D[];
  settings: AnimationSettings;
  playbackState: PlaybackState;

  // Core methods
  createLEDGrid(): void;
  updateAnimation(): void;
  render(): void;

  // Control methods
  play(): void;
  pause(): void;
  reset(): void;
  reverse(): void;

  // Export methods
  exportFrame(): string;
  exportSequence(settings: ExportSettings): Promise<string[]>;
}

export interface AnimationVersion {
  id: string;
  name: string;
  timestamp: number;
  settings: AnimationSettings;
  thumbnail?: string;
  notes?: string;
}