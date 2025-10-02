# LED Animation Studio - Advanced

A modern, high-performance LED animation studio built with React, TypeScript, and Three.js. Create stunning LED grid animations with real-time parameter controls, 3D effects, and export capabilities.

![LED Animation Studio](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![Three.js](https://img.shields.io/badge/Three.js-0.180-green) ![Vite](https://img.shields.io/badge/Vite-7.1-orange)

## ✨ Features

### 🎨 Animation Patterns
- **Build-Debuild**: Pulse expansion and contraction effects
- **Spiral**: Rotating spiral arms with customizable trails
- **Wave**: Concentric wave ripples across the LED grid
- **Ripple**: Dynamic radius pulsing effects

### 🎯 3D Effects & Transformations
- **Z-Axis Rotation**: 2D planar rotation with adjustable speed
- **Y-Axis Rotation**: Full 3D rotation with perspective projection
- **Morphing**: Dynamic shape deformation with sine wave distortions
- **Spiral Distortion**: Additional wave-based brightness modulation
- **Flicker Effects**: Realistic LED flickering simulation

### 🌈 Visual Features
- **Color Cycling**: Smooth transitions between multiple colors
- **Glow Effects**: Optional LED glow simulation
- **Background Grid**: Toggle LED background visualization
- **Real-time Brightness Control**: Smooth brightness transitions

### ⚡ Performance
- **WebGL Rendering**: Hardware-accelerated graphics via Three.js
- **60fps Animation**: Smooth real-time animation
- **Optimized LED Grid**: Efficient rendering up to 40x40 grids
- **Memory Management**: Proper cleanup and disposal

### 🛠 Development Tools
- **Monaco Code Editor**: VS Code-like editing experience
- **Live Parameter Editing**: Real-time code compilation and execution
- **TypeScript Support**: Full type safety and IntelliSense
- **Hot Module Replacement**: Instant development feedback

### 📤 Export Options
- **PNG Sequence**: Export animation frames for video creation
- **Single Frame**: Export current animation state
- **Lottie JSON**: Export for web and mobile animations
- **Settings Data**: Export/import animation configurations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn package manager

### Installation

1. **Navigate to the project directory**
   ```bash
   cd led-animation-studio
   ```

2. **Install dependencies (already done)**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## 🎮 Controls

### Keyboard Shortcuts
- **Space**: Play/Pause animation
- **R**: Reset animation to beginning
- **G**: Toggle background LED grid
- **B**: Reverse animation direction
- **1-4**: Toggle animation patterns (Build-Debuild, Spiral, Wave, Ripple)
- **C**: Toggle color cycling
- **Y**: Toggle Y-axis 3D rotation

### Mouse Interaction
- **Click Canvas**: Reset animation

## 🏗 Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript
- **Rendering**: Three.js (WebGL)
- **State Management**: Zustand
- **UI Components**: Radix UI + Tailwind CSS
- **Code Editor**: Monaco Editor
- **Build Tool**: Vite

### Project Structure
```
src/
├── animation/
│   └── LEDAnimationEngine.ts    # Core Three.js animation engine
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── AnimationCanvas.tsx      # Main canvas component
│   ├── AnimationControls.tsx    # Parameter controls
│   ├── CodeEditor.tsx          # Monaco code editor
│   ├── ExportControls.tsx      # Export functionality
│   └── PlaybackControls.tsx    # Playback buttons
├── stores/
│   └── animationStore.ts       # Zustand state management
├── types/
│   └── animation.ts            # TypeScript interfaces
└── App.tsx                     # Main application
```

## 🎛 Parameters

### Basic Settings
- **Grid Size**: 10-40 LEDs per side
- **LED Spacing**: 8-20 pixels between LEDs
- **Inner/Outer Radius**: Animation boundary control
- **Animation Duration**: 100-5000ms cycle time

### Pattern Controls
- **Pattern Speed**: 0.1-3.0x speed multiplier
- **Individual Pattern Toggles**: Enable/disable each pattern
- **Pattern Blending**: Multiple patterns can run simultaneously

### 3D Effects
- **Rotation Speed**: Z and Y axis rotation rates
- **Morph Intensity**: Shape deformation strength
- **Spiral Intensity**: Distortion effect strength
- **Flicker Amount**: LED flicker simulation intensity

### Colors
- **Primary Color**: Base LED color
- **Secondary/Tertiary Colors**: Color cycling palette
- **Color Speed**: Transition rate between colors
- **Color Cycling**: Enable smooth color transitions

## 🔧 Development

### Adding New Animation Patterns
1. Extend the animation engine in `LEDAnimationEngine.ts`
2. Add pattern logic in `collectPatternPoints()` method
3. Update UI controls in `AnimationControls.tsx`
4. Add TypeScript types in `animation.ts`

### Adding New Effects
1. Create effect method in animation engine
2. Call in `applyModifiers()` pipeline
3. Add parameter controls to UI
4. Update state management in store

### Customizing UI
- Modify Tailwind classes in components
- Update theme colors in `tailwind.config.js`
- Add new UI components in `components/ui/`

## 📦 Export Formats

### PNG Sequences
- Customizable frame rate (12-60 FPS)
- Multiple animation cycles
- Individual frame downloads
- Video creation instructions included

### Lottie JSON
- Web-compatible animation format
- Supports basic LED grid animations
- Mobile app integration ready

### Settings Data
- JSON export of all parameters
- Version-tagged configurations
- Import/export for sharing setups

## 🐛 Troubleshooting

### Common Issues
1. **Blank Canvas**: Check browser WebGL support
2. **Poor Performance**: Reduce grid size or disable effects
3. **Export Issues**: Ensure pop-up blocker is disabled
4. **Build Errors**: Clear node_modules and reinstall

### Browser Support
- Chrome/Edge 90+
- Firefox 85+
- Safari 14+
- WebGL 2.0 required

## 📄 Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🙏 Acknowledgments

- Original P5.js LED animation concept
- Three.js community for WebGL excellence
- React and TypeScript ecosystems
- Open source contributors

---

**Ready to run! Everything is set up and optimized for development.**