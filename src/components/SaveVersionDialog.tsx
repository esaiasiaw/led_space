import React, { useState, useRef } from 'react';
import { useAnimationStore } from '../stores/animationStore';
import { Save, X } from 'lucide-react';

interface SaveVersionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function SaveVersionDialog({ isOpen, onClose, canvasRef }: SaveVersionDialogProps) {
  const { saveVersion } = useAnimationStore();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isCapturingThumbnail, setIsCapturingThumbnail] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a name for this version');
      return;
    }

    setIsCapturingThumbnail(true);

    // Capture thumbnail from canvas
    let thumbnail: string | undefined;
    if (canvasRef?.current) {
      try {
        thumbnail = canvasRef.current.toDataURL('image/png');
      } catch (error) {
        console.error('Failed to capture thumbnail:', error);
      }
    }

    saveVersion(name.trim(), thumbnail, notes.trim() || undefined);

    // Reset form
    setName('');
    setNotes('');
    setIsCapturingThumbnail(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Save Version</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Version Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Blue Spiral v1, Final Animation..."
              className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add any notes about this version..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
            />
          </div>

          <div className="text-xs text-[var(--text-tertiary)]">
            <p>💡 A thumbnail will be captured from the current canvas view</p>
            <p className="mt-1">⌘/Ctrl + Enter to save quickly</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isCapturingThumbnail}
            className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isCapturingThumbnail ? 'Saving...' : 'Save Version'}
          </button>
        </div>
      </div>
    </div>
  );
}
