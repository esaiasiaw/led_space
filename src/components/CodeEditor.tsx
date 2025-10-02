import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from './ui/Button';
import { useAnimationStore } from '../stores/animationStore';

export const CodeEditor: React.FC = () => {
  const { settings, updateSettings, isCodeEditorOpen, toggleCodeEditor } = useAnimationStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastWorkingCode, setLastWorkingCode] = useState('');
  const editorRef = useRef<any>(null);

  // Generate editable code from current settings
  const generateEditableCode = () => {
    return `// Advanced LED Animation Studio - React/TypeScript Edition
// Edit this code and click Apply to see changes

// Basic settings
const settings = {
  gridSize: ${settings.gridSize},
  ledSpacing: ${settings.ledSpacing},
  innerRadius: ${settings.innerRadius},
  outerRadius: ${settings.outerRadius},
  animationDuration: ${settings.animationDuration},
  showGlow: ${settings.showGlow},
  showBackground: ${settings.showBackground},

  // Animation patterns
  enableBuildDebuild: ${settings.enableBuildDebuild},
  enableSpiral: ${settings.enableSpiral},
  enableWave: ${settings.enableWave},
  enableRipple: ${settings.enableRipple},
  patternSpeed: ${settings.patternSpeed},

  // Shape transformations
  enableRotation: ${settings.enableRotation}, // Z-axis rotation
  rotationSpeed: ${settings.rotationSpeed},
  enableMorphing: ${settings.enableMorphing},
  morphIntensity: ${settings.morphIntensity},

  // 3D Y-axis rotation
  enableYAxisRotate: ${settings.enableYAxisRotate}, // 3D rotation
  yRotateSpeed: ${settings.yRotateSpeed},

  // Color transitions
  enableColorTransition: ${settings.enableColorTransition},
  colorSpeed: ${settings.colorSpeed},
  ledColor: '${settings.ledColor}',
  ledColor2: '${settings.ledColor2}',
  ledColor3: '${settings.ledColor3}',

  // Effect modifiers
  enableSpiralModifier: ${settings.enableSpiralModifier},
  enableFlicker: ${settings.enableFlicker},
  spiralIntensity: ${settings.spiralIntensity},
  flickerAmount: ${settings.flickerAmount},
};

// Return the settings object to apply changes
settings;`;
  };

  React.useEffect(() => {
    if (isCodeEditorOpen && !code) {
      const generatedCode = generateEditableCode();
      setCode(generatedCode);
      setLastWorkingCode(generatedCode);
    }
  }, [isCodeEditorOpen, settings]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const applyCode = () => {
    try {
      // Create a safe evaluation environment
      const evalCode = `
        (function() {
          ${code}
        })()
      `;

      const result = eval(evalCode);

      if (result && typeof result === 'object') {
        // Validate the result has required properties
        const validKeys = [
          'gridSize', 'ledSpacing', 'innerRadius', 'outerRadius', 'animationDuration',
          'showGlow', 'showBackground', 'enableBuildDebuild', 'enableSpiral',
          'enableWave', 'enableRipple', 'patternSpeed', 'enableRotation',
          'rotationSpeed', 'enableMorphing', 'morphIntensity', 'enableYAxisRotate',
          'yRotateSpeed', 'enableColorTransition', 'colorSpeed', 'ledColor',
          'ledColor2', 'ledColor3', 'enableSpiralModifier', 'enableFlicker',
          'spiralIntensity', 'flickerAmount'
        ];

        const validSettings: any = {};
        validKeys.forEach(key => {
          if (key in result) {
            validSettings[key] = result[key];
          }
        });

        updateSettings(validSettings);
        setLastWorkingCode(code);
        setError(null);
      } else {
        setError('Code must return a settings object');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }
  };

  const cancelEdit = () => {
    setCode(lastWorkingCode);
    setError(null);
    toggleCodeEditor();
  };

  const resetCode = () => {
    const defaultCode = generateEditableCode();
    setCode(defaultCode);
    applyCode();
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#1a1d23] border-b-half border-[#2a2d35]">
        <h3 className="text-red-400 text-base font-medium m-0">Code Editor</h3>
        <div className="flex gap-2.5">
          <Button variant="secondary" size="sm" onClick={cancelEdit}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={resetCode}>
            Reset
          </Button>
          <Button size="sm" onClick={applyCode}>
            Apply
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 text-white p-2.5 m-5 rounded">
          {error}
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>
    </div>
  );
};