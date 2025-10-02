import React, { useState } from 'react';
import { useAnimationStore } from '../stores/animationStore';
import { Clock, Trash2, Edit2, Check, X } from 'lucide-react';

export function VersionHistory() {
  const { versions, loadVersion, deleteVersion, renameVersion } = useAnimationStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameVersion(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <div className="p-3 border-b border-[var(--border-primary)]">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
          Version History
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {versions.length === 0 ? (
          <div className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)] opacity-50" />
            <p className="text-xs text-[var(--text-tertiary)]">
              No saved versions yet.
              <br />
              Save your first version!
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="group relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md p-3 hover:border-[var(--accent-primary)] transition-colors cursor-pointer"
                onClick={() => loadVersion(version.id)}
              >
                {/* Thumbnail */}
                {version.thumbnail && (
                  <div className="w-full h-20 mb-2 rounded bg-[var(--bg-tertiary)] overflow-hidden">
                    <img
                      src={version.thumbnail}
                      alt={version.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Version Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === version.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(version.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(version.id)}
                          className="p-1 hover:bg-[var(--bg-tertiary)] rounded"
                        >
                          <Check className="w-3 h-3 text-green-500" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 hover:bg-[var(--bg-tertiary)] rounded"
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {version.name}
                      </h4>
                    )}
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {formatTimestamp(version.timestamp)}
                    </p>
                    {version.notes && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {version.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => startEdit(version.id, version.name)}
                      className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete version "${version.name}"?`)) {
                          deleteVersion(version.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
