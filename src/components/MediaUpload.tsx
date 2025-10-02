import React, { useCallback, useRef } from 'react';
import { useAnimationStore } from '../stores/animationStore';
import { Upload, X } from 'lucide-react';

export const MediaUpload: React.FC = () => {
  const { settings, updateSettings } = useAnimationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image or video
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please upload an image or video file');
      return;
    }

    // Determine media type
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

    // Create object URL for the file
    const url = URL.createObjectURL(file);

    updateSettings({
      mediaUrl: url,
      mediaType,
      displayMode: 'media',
      enableMediaMode: true,
    });
  }, [updateSettings]);

  const handleClearMedia = useCallback(() => {
    if (settings.mediaUrl) {
      URL.revokeObjectURL(settings.mediaUrl);
    }

    updateSettings({
      mediaUrl: null,
      mediaType: null,
      displayMode: 'led',
      enableMediaMode: false,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [settings.mediaUrl, updateSettings]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!settings.mediaUrl ? (
        <button
          onClick={handleUploadClick}
          className="w-full px-3 py-8 border-2 border-dashed border-[var(--border-primary)] rounded-lg hover:border-[var(--border-secondary)] transition-all duration-[var(--duration-normal)] flex flex-col items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover-lift"
        >
          <Upload size={20} />
          <span className="text-sm font-medium">Upload Image or Video</span>
          <span className="text-xs">PNG, JPG, GIF, MP4, WebM</span>
        </button>
      ) : (
        <div className="relative group">
          <div className="aspect-square bg-[var(--bg-tertiary)] rounded-lg overflow-hidden border border-[var(--border-primary)]">
            {settings.mediaType === 'video' ? (
              <video
                src={settings.mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={settings.mediaUrl}
                alt="Uploaded media"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <button
            onClick={handleClearMedia}
            className="absolute top-2 right-2 p-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-[var(--duration-fast)] opacity-0 group-hover:opacity-100"
            title="Remove media"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dither Algorithm Selector */}
      {settings.mediaUrl && (
        <div className="space-y-2 mt-3">
          <label className="parameter-name">Dither Algorithm</label>
          <select
            value={settings.ditherPreset}
            onChange={(e) => updateSettings({ ditherPreset: e.target.value as any })}
            className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all duration-[var(--duration-fast)]"
          >
            <option value="none">None</option>
            <option value="floyd-steinberg">Floyd-Steinberg</option>
            <option value="bayer">Bayer Matrix</option>
            <option value="atkinson">Atkinson</option>
            <option value="halftone">Halftone</option>
          </select>
        </div>
      )}
    </div>
  );
};
