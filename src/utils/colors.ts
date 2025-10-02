// Color constants for consistent theming
export const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  accent: '#ff6b6b',
  accentHover: '#ff5252',
  muted: '#666666',
  mutedLight: '#aaaaaa',
  white: '#ffffff',
  gray800: '#1f2937',
  gray600: '#4b5563',
  gray400: '#9ca3af',
  gray300: '#d1d5db',
} as const;

// Utility classes that can be used with clsx
export const colorClasses = {
  accent: 'bg-red-500 hover:bg-red-600',
  secondary: 'bg-gray-600 hover:bg-gray-500',
  surface: 'bg-gray-800',
  muted: 'text-gray-400',
  mutedLight: 'text-gray-300',
  background: 'bg-gray-900',
} as const;