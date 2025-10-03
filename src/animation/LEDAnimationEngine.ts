import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { AnimationSettings, LEDState, AnimationPoint3D, PlaybackState, AnimationEngine, ExportSettings } from '../types/animation';
import { imageToLEDGrid, getImageData } from '../utils/dither';

export class LEDAnimationEngine implements AnimationEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private ledMeshes: THREE.Mesh[][] = [];
  private bgMeshes: THREE.Mesh[][] = [];

  // Shared geometries and materials pool for better performance
  private sharedLEDGeometry: THREE.CircleGeometry | null = null;
  private sharedBGGeometry: THREE.CircleGeometry | null = null;
  private sharedBGMaterial: THREE.MeshBasicMaterial | null = null;
  private animationId: number | null = null;

  public ledGrid: LEDState[][] = [];
  public animatedPoints: AnimationPoint3D[] = [];
  public settings: AnimationSettings;
  public playbackState: PlaybackState;

  private shape: Array<{ x: number; y: number; z: number; originalRadius: number; angle: number }> = [];

  // Media processing
  private mediaElement: HTMLImageElement | HTMLVideoElement | null = null;
  private ditheredGrid: number[][] = [];
  private mediaFrameCount: number = 0;

  constructor(canvas: HTMLCanvasElement, settings: AnimationSettings) {
    this.settings = { ...settings };
    this.playbackState = {
      isPlaying: true,
      isReversed: false,
      currentTime: 0,
      startTime: Date.now(),
      rotationAngle: 0,
      yRotateAngle: 0,
      pulseScale: 0,
    };

    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'default', // Use integrated GPU to reduce heat/battery usage
      preserveDrawingBuffer: false, // Disable for better performance (enable only during export)
      stencil: false, // Not needed for this use case
      depth: true
    });

    // Set pixel ratio for high-DPI displays (capped at 2 for performance)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(canvas.width, canvas.height, false);
    this.renderer.setClearColor(new THREE.Color(settings.canvasBackgroundColor), 1);

    // Enable high-quality rendering with performance optimizations
    this.renderer.shadowMap.enabled = false; // LEDs don't need shadows
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.sortObjects = false; // Skip sorting for performance (LEDs are all at similar depths)
    this.renderer.info.autoReset = false; // Manual reset for performance monitoring

    // Set camera position
    this.camera.position.z = 300;

    // Setup post-processing with bloom
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom pass for LED glow effect
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.width, canvas.height),
      settings.bloomStrength,
      settings.bloomRadius,
      settings.bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    // Initialize LED grid and shapes
    this.createLEDGrid();
    this.createPulsingShape();
    this.createLEDMeshes();

    // Start animation loop
    this.animate();
  }

  public createLEDGrid(): void {
    this.ledGrid = [];
    const startX = -(this.settings.gridSize * this.settings.ledSpacing) / 2;
    const startY = -(this.settings.gridSize * this.settings.ledSpacing) / 2;

    for (let row = 0; row < this.settings.gridSize; row++) {
      this.ledGrid[row] = [];
      for (let col = 0; col < this.settings.gridSize; col++) {
        this.ledGrid[row][col] = {
          x: startX + col * this.settings.ledSpacing,
          y: startY + row * this.settings.ledSpacing,
          originalX: startX + col * this.settings.ledSpacing,
          originalY: startY + row * this.settings.ledSpacing,
          row,
          col,
          isOn: false,
          brightness: 0,
          targetBrightness: 0,
          currentColor: this.settings.ledColor,
          animationOffset: (row + col) * 1.5,
        };
      }
    }
  }

  private createPulsingShape(): void {
    this.shape = [];

    // Create default mixed shape (spokes + rings)
    this.createSpokes();
    this.createRings();
  }

  private createSpokes(): void {
    const numSpokes = 16;
    const step = 3;

    for (let i = 0; i < numSpokes; i++) {
      const angle = (Math.PI * 2 / numSpokes) * i;

      for (let r = this.settings.innerRadius; r < this.settings.outerRadius; r += step) {
        this.shape.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          z: 0,
          originalRadius: r,
          angle: angle,
        });
      }
    }
  }

  private createRings(): void {
    const numRings = 5;
    const radiusStep = (this.settings.outerRadius - this.settings.innerRadius) / numRings;
    const angleStep = 0.3;

    for (let i = 0; i < numRings; i++) {
      const radius = this.settings.innerRadius + radiusStep * i;

      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        this.shape.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0,
          originalRadius: radius,
          angle: angle,
        });
      }
    }
  }

  private createLEDMeshes(): void {
    // Clear existing LED meshes (only dispose if materials are unique)
    this.ledMeshes.forEach(row => {
      row.forEach(mesh => {
        this.scene.remove(mesh);
        (mesh.material as THREE.Material).dispose();
      });
    });
    this.ledMeshes = [];

    // Clear existing background meshes
    this.bgMeshes.forEach(row => {
      row.forEach(mesh => {
        this.scene.remove(mesh);
      });
    });
    this.bgMeshes = [];

    // Create or reuse shared geometries
    if (!this.sharedLEDGeometry) {
      this.sharedLEDGeometry = new THREE.CircleGeometry(3, 12);
    }
    if (!this.sharedBGGeometry) {
      this.sharedBGGeometry = new THREE.CircleGeometry(1.5, 12);
    }
    if (!this.sharedBGMaterial) {
      this.sharedBGMaterial = new THREE.MeshBasicMaterial({
        color: 0x191919,
        transparent: true,
        opacity: 0.3,
      });
    }

    // Fast mesh creation using pooled resources
    for (let row = 0; row < this.settings.gridSize; row++) {
      this.ledMeshes[row] = [];
      this.bgMeshes[row] = [];
      for (let col = 0; col < this.settings.gridSize; col++) {
        const led = this.ledGrid[row][col];

        // Create individual LED material (needed for individual colors)
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(this.settings.ledColor),
          transparent: true,
          opacity: 0,
        });

        // Create LED mesh with shared geometry
        const mesh = new THREE.Mesh(this.sharedLEDGeometry, material);
        mesh.position.set(led.x, -led.y, 0);
        this.scene.add(mesh);
        this.ledMeshes[row][col] = mesh;

        // Create background LED if enabled (share geometry AND material)
        if (this.settings.showBackground) {
          const bgMesh = new THREE.Mesh(this.sharedBGGeometry, this.sharedBGMaterial);
          bgMesh.position.set(led.x, -led.y, -0.1);
          this.scene.add(bgMesh);
          this.bgMeshes[row][col] = bgMesh;
        }
      }
    }
  }

  private lastFrameTime = 0;
  private targetFPS = 60;
  private frameInterval = 1000 / this.targetFPS;

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Throttle to 60fps to reduce CPU/GPU load
    const now = performance.now();
    const delta = now - this.lastFrameTime;

    if (delta >= this.frameInterval) {
      this.lastFrameTime = now - (delta % this.frameInterval);
      this.updateAnimation();
      this.render();
    }
  };

  public updateAnimation(): void {
    if (this.playbackState.isPlaying) {
      this.playbackState.currentTime = Date.now() - this.playbackState.startTime;
      let cycleTime = this.playbackState.currentTime % (this.settings.animationDuration * 2);

      if (this.playbackState.isReversed) {
        cycleTime = (this.settings.animationDuration * 2) - cycleTime;
      }

      // Update rotation angles
      if (this.settings.enableRotation) {
        this.playbackState.rotationAngle += this.settings.rotationSpeed * 0.02;
      }

      if (this.settings.enableYAxisRotate) {
        this.playbackState.yRotateAngle += this.settings.yRotateSpeed * 0.02;
      }

      // Calculate base pulse scale for build-debuild cycle
      if (this.settings.enableBuildDebuild) {
        let t;
        if (cycleTime < this.settings.animationDuration) {
          t = cycleTime / this.settings.animationDuration;
          if (t < 0.8) {
            const growthT = t / 0.8;
            this.playbackState.pulseScale = 0.2 + (1 - Math.pow(1 - growthT, 3)) * 0.8;
          } else {
            this.playbackState.pulseScale = 1.0;
          }
        } else {
          t = (cycleTime - this.settings.animationDuration) / this.settings.animationDuration;
          if (t < 0.2) {
            this.playbackState.pulseScale = 1.0;
          } else {
            const shrinkT = (t - 0.2) / 0.8;
            this.playbackState.pulseScale = 1.0 - (1 - Math.pow(1 - shrinkT, 3)) * 0.8;
          }
        }
      } else {
        this.playbackState.pulseScale = 1.0;
      }
    }

    this.updateAnimatedPoints();
    this.updateLEDStates();
    this.applyModifiers();
  }

  private updateAnimatedPoints(): void {
    this.animatedPoints = [];

    if (this.settings.enableBuildDebuild) this.collectBuildDebildPoints();
    if (this.settings.enableSpiral) this.collectSpiralPoints();
    if (this.settings.enableWave) this.collectWavePoints();
    if (this.settings.enableRipple) this.collectRipplePoints();
    if (this.settings.enablePulse) this.collectPulsePoints();
    if (this.settings.enableScanner) this.collectScannerPoints();
    if (this.settings.enableSparkle) this.collectSparklePoints();
    if (this.settings.enableRadar) this.collectRadarPoints();

    if (!this.settings.enableBuildDebuild && !this.settings.enableSpiral &&
        !this.settings.enableWave && !this.settings.enableRipple &&
        !this.settings.enablePulse && !this.settings.enableScanner &&
        !this.settings.enableSparkle && !this.settings.enableRadar) {
      this.collectStaticPoints();
    }
  }

  private collectBuildDebildPoints(): void {
    for (const point of this.shape) {
      let x = point.x;
      let y = point.y;
      let z = point.z;

      // Apply morphing if enabled
      if (this.settings.enableMorphing) {
        const morphOffset = Math.sin(this.playbackState.currentTime * 0.003 + point.angle * 3) *
                          this.settings.morphIntensity * 10;
        const radius = Math.sqrt(x * x + y * y);
        const angle = Math.atan2(y, x);
        const newRadius = radius + morphOffset;
        x = Math.cos(angle) * newRadius;
        y = Math.sin(angle) * newRadius;
      }

      // Apply pulse scale
      x *= this.playbackState.pulseScale;
      y *= this.playbackState.pulseScale;
      z *= this.playbackState.pulseScale;

      this.animatedPoints.push({
        x, y, z,
        brightness: 255,
        source: 'buildDebuild',
      });
    }
  }

  private collectSpiralPoints(): void {
    const spiralTime = this.playbackState.currentTime * 0.005 * this.settings.patternSpeed;
    for (let r = this.settings.innerRadius; r <= this.settings.outerRadius; r += 5) {
      const angle = spiralTime + (r * 0.1);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = 0;

      this.animatedPoints.push({
        x, y, z,
        brightness: 200,
        source: 'spiral',
      });
    }
  }

  private collectWavePoints(): void {
    // Wave pattern implementation
    const waveTime = this.playbackState.currentTime * 0.01 * this.settings.patternSpeed;

    for (let radius = this.settings.innerRadius; radius <= this.settings.outerRadius; radius += 5) {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const wave = Math.sin(waveTime + radius * 0.1) * 0.5 + 0.5;
        if (wave > 0.3) {
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const z = 0;

          this.animatedPoints.push({
            x, y, z,
            brightness: wave * 255 * 0.6,
            source: 'wave',
          });
        }
      }
    }
  }

  private collectRipplePoints(): void {
    const rippleTime = this.playbackState.currentTime * 0.008 * this.settings.patternSpeed;
    const numRipples = 3;

    for (let i = 0; i < numRipples; i++) {
      const rippleOffset = (i / numRipples) * Math.PI * 2;
      const rippleRadius = (Math.sin(rippleTime + rippleOffset) * 0.5 + 0.5) *
                         (this.settings.outerRadius - this.settings.innerRadius) +
                         this.settings.innerRadius;

      for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
        const x = Math.cos(angle) * rippleRadius;
        const y = Math.sin(angle) * rippleRadius;
        const z = 0;

        this.animatedPoints.push({
          x, y, z,
          brightness: 200,
          source: 'ripple',
        });
      }
    }
  }

  private collectPulsePoints(): void {
    // Concentric pulse rings expanding from center - continuous loop
    const pulseTime = (Date.now() * 0.001 * this.settings.patternSpeed) / 2; // Independent of animation duration
    const numPulses = 5; // More pulses for smoother effect

    for (let i = 0; i < numPulses; i++) {
      const pulseOffset = (i / numPulses);
      const pulseProgress = ((pulseTime + pulseOffset) % 1); // Loop 0 to 1 continuously
      const radius = this.settings.innerRadius +
                     pulseProgress * (this.settings.outerRadius - this.settings.innerRadius);

      // Smoother brightness fade
      const brightness = Math.pow(1 - pulseProgress, 2) * 255;

      if (brightness > 10) {
        for (let angle = 0; angle < Math.PI * 2; angle += 0.12) {
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const z = Math.sin(pulseProgress * Math.PI) * 5; // Add slight z movement

          this.animatedPoints.push({
            x, y, z,
            brightness,
            source: 'pulse',
          });
        }
      }
    }
  }

  private collectScannerPoints(): void {
    // Knight Rider style scanning line
    const scanTime = this.playbackState.currentTime * 0.003 * this.settings.patternSpeed;
    const scanAngle = (Math.sin(scanTime) * 0.5 + 0.5) * Math.PI * 2;

    // Main scan line
    for (let radius = this.settings.innerRadius; radius <= this.settings.outerRadius; radius += 3) {
      const x = Math.cos(scanAngle) * radius;
      const y = Math.sin(scanAngle) * radius;
      const z = 0;

      this.animatedPoints.push({
        x, y, z,
        brightness: 255,
        source: 'scanner',
      });
    }

    // Trail effect - shortened for more dynamic feel
    for (let i = 1; i <= 2; i++) {
      const trailAngle = scanAngle - (i * 0.15);
      const trailBrightness = 255 - (i * 90);

      for (let radius = this.settings.innerRadius; radius <= this.settings.outerRadius; radius += 4) {
        const x = Math.cos(trailAngle) * radius;
        const y = Math.sin(trailAngle) * radius;
        const z = 0;

        this.animatedPoints.push({
          x, y, z,
          brightness: trailBrightness,
          source: 'scanner',
        });
      }
    }
  }

  private collectSparklePoints(): void {
    const sparkleTime = this.playbackState.currentTime * 0.01 * this.settings.patternSpeed;
    const numSparkles = 50; // More sparkles

    for (let i = 0; i < numSparkles; i++) {
      // Use deterministic random based on time and index
      const seed = i * 123.456 + Math.floor(sparkleTime / 300) * 789.012; // Faster changes
      const pseudoRandom = Math.abs((Math.sin(seed) * 10000) % 1);
      const pseudoRandom2 = Math.abs((Math.cos(seed * 1.234) * 10000) % 1);
      const pseudoRandom3 = Math.abs((Math.sin(seed * 2.345) * 10000) % 1);

      // Animated angle - rotate slowly over time
      const baseAngle = pseudoRandom * Math.PI * 2;
      const angleSpeed = (pseudoRandom3 - 0.5) * 0.3; // Some rotate clockwise, some counter-clockwise
      const angle = baseAngle + sparkleTime * angleSpeed;

      // Animated radius - pulse in and out
      const baseRadius = this.settings.innerRadius +
                         pseudoRandom2 * (this.settings.outerRadius - this.settings.innerRadius);
      const radiusPulse = Math.sin(sparkleTime * 0.8 + i * 0.3) * 8; // Pulse +/- 8 units
      const radius = baseRadius + radiusPulse;

      // More dynamic brightness with sharp peaks
      const flickerSpeed = 3 + pseudoRandom3 * 5; // Variable speed per sparkle
      const flicker = Math.pow(Math.abs(Math.sin(sparkleTime * flickerSpeed + i * 0.8)), 3); // Sharp peaks
      const brightness = flicker * 255;

      // Lower threshold for more visible sparkles
      if (brightness > 20) {
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Add slight z variation for depth with animation
        const z = Math.sin(sparkleTime * 0.5 + i) * 8;

        this.animatedPoints.push({
          x, y, z,
          brightness,
          source: 'sparkle',
        });
      }
    }

    // Add occasional shooting stars
    const numShootingStars = 3;
    for (let i = 0; i < numShootingStars; i++) {
      const starSeed = i * 456.789 + Math.floor(sparkleTime / 800) * 234.567;
      const starRandom = Math.abs((Math.sin(starSeed) * 10000) % 1);
      const starPhase = (sparkleTime / 800) % 1;

      if (starRandom > 0.7) { // Only sometimes visible
        const startAngle = starRandom * Math.PI * 2;
        const startRadius = this.settings.innerRadius;
        const endRadius = this.settings.outerRadius;

        // Trail of points - shorter and sharper
        for (let t = 0; t < 5; t++) {
          const progress = starPhase + (t * 0.12);
          if (progress < 1) {
            const currentRadius = startRadius + progress * (endRadius - startRadius);
            const x = Math.cos(startAngle) * currentRadius;
            const y = Math.sin(startAngle) * currentRadius;
            const trailBrightness = (1 - progress) * (255 - t * 50); // Faster fade

            if (trailBrightness > 0) {
              this.animatedPoints.push({
                x, y, z: 0,
                brightness: trailBrightness,
                source: 'sparkle',
              });
            }
          }
        }
      }
    }
  }

  private collectRadarPoints(): void {
    // Real radar effect: rotating sweep arm + expanding pulse rings
    const radarTime = this.playbackState.currentTime * 0.002 * this.settings.patternSpeed;
    const radarAngle = (radarTime % 1) * Math.PI * 2;

    // Main radar sweep arm (thin bright line)
    for (let radius = this.settings.innerRadius; radius <= this.settings.outerRadius; radius += 3) {
      const x = Math.cos(radarAngle) * radius;
      const y = Math.sin(radarAngle) * radius;
      const z = 0;

      this.animatedPoints.push({
        x, y, z,
        brightness: 255,
        source: 'radar',
      });
    }

    // Expanding pulse rings that emanate from the sweep
    const numPulses = 3;
    for (let i = 0; i < numPulses; i++) {
      const pulseAge = (radarTime * 2 + i * 0.33) % 1; // Each pulse triggers at different times
      const pulseRadius = this.settings.innerRadius + pulseAge * (this.settings.outerRadius - this.settings.innerRadius);
      const pulseBrightness = Math.pow(1 - pulseAge, 2) * 200; // Fade out as it expands

      if (pulseBrightness > 10) {
        // Draw the pulse ring
        const numPoints = 40;
        for (let j = 0; j < numPoints; j++) {
          const angle = (j / numPoints) * Math.PI * 2;
          const x = Math.cos(angle) * pulseRadius;
          const y = Math.sin(angle) * pulseRadius;
          const z = 0;

          this.animatedPoints.push({
            x, y, z,
            brightness: pulseBrightness,
            source: 'radar',
          });
        }
      }
    }

    // Fading trail behind the sweep arm - shorter and snappier
    const trailLength = 6;
    for (let i = 1; i < trailLength; i++) {
      const trailAngle = radarAngle - (i * 0.15);
      const fadeBrightness = 200 * Math.pow(1 - i / trailLength, 2.5);

      if (fadeBrightness > 15) {
        for (let radius = this.settings.innerRadius; radius <= this.settings.outerRadius; radius += 6) {
          const x = Math.cos(trailAngle) * radius;
          const y = Math.sin(trailAngle) * radius;
          const z = 0;

          this.animatedPoints.push({
            x, y, z,
            brightness: fadeBrightness,
            source: 'radar',
          });
        }
      }
    }
  }

  private collectStaticPoints(): void {
    for (const point of this.shape) {
      this.animatedPoints.push({
        x: point.x,
        y: point.y,
        z: point.z,
        brightness: 150,
        source: 'static',
      });
    }
  }

  /**
   * Load and process media (image/video) for LED display
   */
  public async loadMedia(url: string, mediaType: 'image' | 'video' | null): Promise<void> {
    return new Promise((resolve, reject) => {
      const isVideo = mediaType === 'video';

      if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;

        video.addEventListener('loadeddata', () => {
          this.mediaElement = video;
          video.play().catch(err => {
            console.error('Failed to play video:', err);
          });
          this.processMediaFrame();
          resolve();
        });

        video.addEventListener('error', (e) => {
          console.error('Video loading error:', e);
          reject(e);
        });
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;

        img.addEventListener('load', () => {
          this.mediaElement = img;
          this.processMediaFrame();
          resolve();
        });

        img.addEventListener('error', (e) => {
          console.error('Image loading error:', e);
          reject(e);
        });
      }
    });
  }

  /**
   * Process current frame of media and generate dithered LED grid
   */
  private processMediaFrame(): void {
    if (!this.mediaElement) return;

    const imageData = getImageData(this.mediaElement, this.settings.gridSize);
    if (!imageData) return;

    this.ditheredGrid = imageToLEDGrid(
      imageData,
      this.settings.gridSize,
      this.settings.ditherPreset,
      this.settings.ditherThreshold,
      this.settings.mediaContrast,
      this.settings.mediaBrightness
    );

    this.mediaFrameCount++;
  }

  /**
   * Clear loaded media
   */
  public clearMedia(): void {
    if (this.mediaElement && this.mediaElement instanceof HTMLVideoElement) {
      this.mediaElement.pause();
      this.mediaElement.src = '';
    }
    this.mediaElement = null;
    this.ditheredGrid = [];
    this.mediaFrameCount = 0;
  }

  private updateLEDStates(): void {
    // Reset all LEDs
    for (let row = 0; row < this.settings.gridSize; row++) {
      for (let col = 0; col < this.settings.gridSize; col++) {
        this.ledGrid[row][col].targetBrightness = 0;
        this.ledGrid[row][col].currentColor = this.settings.ledColor;
      }
    }

    // Process video frame if needed
    if (this.settings.enableMediaMode && this.mediaElement instanceof HTMLVideoElement && this.mediaFrameCount % 2 === 0) {
      this.processMediaFrame();
    }

    // Media-only mode: just display the dithered media
    if (this.settings.displayMode === 'media' && this.ditheredGrid.length > 0) {
      for (let row = 0; row < this.settings.gridSize; row++) {
        for (let col = 0; col < this.settings.gridSize; col++) {
          if (this.ditheredGrid[row] && this.ditheredGrid[row][col] !== undefined) {
            this.ledGrid[row][col].targetBrightness = this.ditheredGrid[row][col];
          }
        }
      }
      return; // Skip animation patterns when in media-only mode
    }

    // LED-only mode or combined mode: process animation patterns
    // Apply 3D transformations and activate LEDs
    for (const point of this.animatedPoints) {
      let x = point.x;
      let y = point.y;
      let z = point.z;

      // Apply Z-axis rotation
      if (this.settings.enableRotation) {
        const cos = Math.cos(this.playbackState.rotationAngle);
        const sin = Math.sin(this.playbackState.rotationAngle);
        const rotatedX = x * cos - y * sin;
        const rotatedY = x * sin + y * cos;
        x = rotatedX;
        y = rotatedY;
      }

      // Apply Y-axis rotation (3D)
      if (this.settings.enableYAxisRotate) {
        const cosY = Math.cos(this.playbackState.yRotateAngle);
        const sinY = Math.sin(this.playbackState.yRotateAngle);
        const rotatedX = x * cosY - z * sinY;
        const rotatedZ = x * sinY + z * cosY;
        x = rotatedX;
        z = rotatedZ;
      }

      // Apply perspective projection
      let perspectiveScale = 1;
      if (this.settings.enableYAxisRotate) {
        const perspectiveDistance = 400;
        perspectiveScale = perspectiveDistance / (perspectiveDistance + z);
        x *= perspectiveScale;
        y *= perspectiveScale;
      }

      // Adjust brightness based on depth
      let depthBrightness = point.brightness;
      if (this.settings.enableYAxisRotate && z < 50) {
        depthBrightness *= this.mapRange(z, -100, 100, 1.2, 0.3);
        depthBrightness = Math.max(0, Math.min(255, depthBrightness));
        this.activateLEDsNearPoint(x, y, depthBrightness);
      } else if (!this.settings.enableYAxisRotate) {
        this.activateLEDsNearPoint(x, y, depthBrightness);
      }
    }

    // Combined mode: blend LED patterns with media
    if (this.settings.displayMode === 'combined' && this.ditheredGrid.length > 0) {
      for (let row = 0; row < this.settings.gridSize; row++) {
        for (let col = 0; col < this.settings.gridSize; col++) {
          if (this.ditheredGrid[row] && this.ditheredGrid[row][col] !== undefined) {
            const mediaBrightness = this.ditheredGrid[row][col];
            const ledBrightness = this.ledGrid[row][col].targetBrightness;

            // Blend: take the maximum of both, or multiply them for masking effect
            // Using max blend for better visibility
            this.ledGrid[row][col].targetBrightness = Math.max(mediaBrightness, ledBrightness);
          }
        }
      }
    }
  }

  private activateLEDsNearPoint(screenX: number, screenY: number, brightness: number): void {
    for (let row = 0; row < this.settings.gridSize; row++) {
      for (let col = 0; col < this.settings.gridSize; col++) {
        const led = this.ledGrid[row][col];
        const distance = Math.sqrt(
          Math.pow(screenX - led.originalX, 2) + Math.pow(screenY - led.originalY, 2)
        );

        if (distance < this.settings.ledSpacing * 0.7) {
          if (brightness > led.targetBrightness) {
            led.targetBrightness = brightness;

            // Apply color transitions if enabled
            if (this.settings.enableColorTransition) {
              const colorTime = this.playbackState.currentTime * 0.003 * this.settings.colorSpeed;
              const colorPhase = (colorTime + led.row * 0.1 + led.col * 0.1) % 3;

              if (colorPhase < 1) {
                led.currentColor = this.lerpColor(this.settings.ledColor, this.settings.ledColor2, colorPhase);
              } else if (colorPhase < 2) {
                led.currentColor = this.lerpColor(this.settings.ledColor2, this.settings.ledColor3, colorPhase - 1);
              } else {
                led.currentColor = this.lerpColor(this.settings.ledColor3, this.settings.ledColor, colorPhase - 2);
              }
            }
          }
        }
      }
    }
  }

  private applyModifiers(): void {
    if (this.settings.enableSpiralModifier) {
      this.applySpiralDistortion();
    }

    if (this.settings.enableFlicker) {
      this.applyFlickerEffect();
    }
  }

  private applySpiralDistortion(): void {
    const spiralTime = this.playbackState.currentTime * 0.003;

    for (let row = 0; row < this.settings.gridSize; row++) {
      for (let col = 0; col < this.settings.gridSize; col++) {
        const led = this.ledGrid[row][col];
        if (led.targetBrightness > 30) {
          const distFromCenter = Math.sqrt(
            Math.pow(led.originalX, 2) + Math.pow(led.originalY, 2)
          );

          const spiralWave = Math.sin(spiralTime * 3 + distFromCenter * 0.1);
          const brightnessModifier = 0.5 + (spiralWave * this.settings.spiralIntensity * 0.5);

          led.targetBrightness *= brightnessModifier;
          led.targetBrightness = Math.max(0, Math.min(255, led.targetBrightness));
        }
      }
    }
  }

  private applyFlickerEffect(): void {
    for (let row = 0; row < this.settings.gridSize; row++) {
      for (let col = 0; col < this.settings.gridSize; col++) {
        const led = this.ledGrid[row][col];
        if (led.targetBrightness > 30) {
          let flickerValue = Math.sin(this.playbackState.currentTime * 0.05 + led.row * 13.7 + led.col * 7.3) * 0.5 + 0.5;
          flickerValue += Math.sin(this.playbackState.currentTime * 0.1 + led.row * 5.1 + led.col * 11.9) * 0.3;
          flickerValue = Math.max(0, Math.min(1, flickerValue));

          const flickerMultiplier = 1 - (this.settings.flickerAmount * (1 - flickerValue));
          led.targetBrightness *= flickerMultiplier;
          led.targetBrightness = Math.max(0, Math.min(255, led.targetBrightness));
        }
      }
    }
  }

  public render(): void {
    // Update LED mesh colors and opacity based on current state
    // Optimized loop with early exits
    for (let row = 0; row < this.settings.gridSize; row++) {
      for (let col = 0; col < this.settings.gridSize; col++) {
        const led = this.ledGrid[row][col];
        const mesh = this.ledMeshes[row][col];

        if (!mesh) continue;

        // Smoother brightness transition with temporal easing (optimized cubic)
        const easeFactor = 0.15; // Slightly higher for better responsiveness
        const diff = led.targetBrightness - led.brightness;

        // Skip update if difference is negligible (performance optimization)
        if (Math.abs(diff) > 0.1) {
          // Cubic easing for more natural motion
          const eased = diff * easeFactor * easeFactor * easeFactor;
          led.brightness += eased + (diff * easeFactor * 0.5);
        } else {
          led.brightness = led.targetBrightness; // Snap to target
        }

        const material = mesh.material as THREE.MeshBasicMaterial;

        if (led.brightness > 30) {
          // Reuse color object to avoid allocations
          material.color.set(led.currentColor);

          // Smooth opacity curve for more natural fade (exponential)
          const normalizedBrightness = led.brightness / 255;
          material.opacity = Math.pow(normalizedBrightness, 0.7); // Expo curve

          // Subtle scale animation based on brightness (only if significant)
          if (normalizedBrightness > 0.5) {
            const scale = 1 + (normalizedBrightness * 0.15); // 15% max scale
            mesh.scale.set(scale, scale, 1);
          } else {
            mesh.scale.set(1, 1, 1);
          }
        } else {
          material.opacity = 0;
          if (mesh.scale.x !== 1) {
            mesh.scale.set(1, 1, 1);
          }
        }
      }
    }

    // Render with or without bloom post-processing
    if (this.settings.enableBloom) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Control methods
  public play(): void {
    this.playbackState.isPlaying = true;
    this.playbackState.isReversed = false;
  }

  public pause(): void {
    this.playbackState.isPlaying = false;
  }

  public reset(): void {
    this.playbackState.startTime = Date.now();
    this.playbackState.pulseScale = 0.2;
    this.playbackState.isReversed = false;
    this.playbackState.rotationAngle = 0;
    this.playbackState.yRotateAngle = 0;
  }

  public reverse(): void {
    this.playbackState.isPlaying = true;
    this.playbackState.isReversed = true;
  }

  // Export methods
  public exportFrame(): string {
    return this.renderer.domElement.toDataURL('image/png');
  }

  public async exportSequence(settings: ExportSettings): Promise<string[]> {
    const frames: string[] = [];
    const totalDuration = this.settings.animationDuration * 2 * settings.cycles;
    const totalFrames = Math.floor((totalDuration / 1000) * settings.fps);

    const originalPlaying = this.playbackState.isPlaying;
    const originalTime = this.playbackState.currentTime;
    const originalStartTime = this.playbackState.startTime;
    const originalClearAlpha = this.renderer.getClearAlpha();

    // If transparent background is requested, set alpha to 0
    if (settings.transparentBackground) {
      this.renderer.setClearColor(0x000000, 0);
    }

    this.playbackState.isPlaying = false;
    this.playbackState.startTime = Date.now();
    this.playbackState.currentTime = 0;

    for (let i = 0; i < totalFrames; i++) {
      this.playbackState.currentTime = (i / settings.fps) * 1000;
      this.updateAnimation();
      this.render();

      frames.push(this.exportFrame());

      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    // Restore original state
    this.playbackState.isPlaying = originalPlaying;
    this.playbackState.startTime = originalStartTime;
    this.playbackState.currentTime = originalTime;

    // Restore original clear color
    if (settings.transparentBackground) {
      this.renderer.setClearColor(new THREE.Color(this.settings.canvasBackgroundColor), originalClearAlpha);
    }

    return frames;
  }

  // Utility methods
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  private mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  private lerpColor(color1: string, color2: string, factor: number): string {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const result = c1.lerp(c2, factor);
    return `#${result.getHexString()}`;
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
  }

  public updateSettings(newSettings: Partial<AnimationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Update background color if changed
    if (newSettings.canvasBackgroundColor !== undefined) {
      this.renderer.setClearColor(new THREE.Color(newSettings.canvasBackgroundColor), 1);
    }

    // Update bloom pass settings if changed
    if (newSettings.bloomStrength !== undefined) {
      this.bloomPass.strength = newSettings.bloomStrength;
    }
    if (newSettings.bloomRadius !== undefined) {
      this.bloomPass.radius = newSettings.bloomRadius;
    }
    if (newSettings.bloomThreshold !== undefined) {
      this.bloomPass.threshold = newSettings.bloomThreshold;
    }

    // Handle media URL or mediaType changes
    if (newSettings.mediaUrl !== undefined || newSettings.mediaType !== undefined) {
      const mediaType = newSettings.mediaType || this.settings.mediaType;
      const mediaUrl = newSettings.mediaUrl !== undefined ? newSettings.mediaUrl : this.settings.mediaUrl;

      if (mediaUrl && mediaType) {
        this.loadMedia(mediaUrl, mediaType).catch(err => {
          console.error('Failed to load media:', err);
        });
      } else {
        this.clearMedia();
      }
    }

    // Re-process media if dither settings changed
    if (this.settings.enableMediaMode && this.mediaElement && (
      newSettings.ditherPreset !== undefined ||
      newSettings.ditherThreshold !== undefined ||
      newSettings.mediaContrast !== undefined ||
      newSettings.mediaBrightness !== undefined
    )) {
      this.processMediaFrame();
    }

    // Live grid recreation (optimized with pooled geometries)
    if (newSettings.gridSize !== undefined || newSettings.ledSpacing !== undefined || newSettings.showBackground !== undefined) {
      this.createLEDGrid();
      this.createLEDMeshes();
      // Reprocess media with new grid size
      if (this.settings.enableMediaMode && this.mediaElement) {
        this.processMediaFrame();
      }
    }

    // Live shape recreation
    if (newSettings.innerRadius !== undefined || newSettings.outerRadius !== undefined) {
      this.createPulsingShape();
    }
  }

  public resize(width: number, height: number): void {
    // Update renderer size (false prevents updating canvas style)
    this.renderer.setSize(width, height, false);

    // Update composer size for post-processing
    this.composer.setSize(width, height);

    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}