import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Layers, Image, Sparkles, GripVertical } from 'lucide-react';
import { useAnimationStore } from '../stores/animationStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Layer {
  id: string;
  name: string;
  type: 'pattern' | 'media' | 'shader';
  icon: React.ReactNode;
  color: string;
  visible: boolean;
}

interface SortableLayerItemProps {
  layer: Layer;
  onToggleVisibility: (layerId: string) => void;
}

const SortableLayerItem: React.FC<SortableLayerItemProps> = ({ layer, onToggleVisibility }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layer-card ${layer.visible ? 'active' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-[var(--text-tertiary)] cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </div>

      {/* Color Chip */}
      <div
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: layer.color }}
      />

      {/* Icon */}
      <div className="text-[var(--text-secondary)]">
        {layer.icon}
      </div>

      {/* Layer Name */}
      <span className="flex-1 text-sm text-[var(--text-primary)] font-medium truncate">
        {layer.name}
      </span>

      {/* Visibility Toggle */}
      <button
        onClick={() => onToggleVisibility(layer.id)}
        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)]"
        title={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </div>
  );
};

export const LayersPanel: React.FC = () => {
  const { settings, updateSettings } = useAnimationStore();
  const [layerOrder, setLayerOrder] = useState<string[]>([]);

  // Build layers from current settings
  const baseLayers: Layer[] = useMemo(() => {
    const layers: Layer[] = [];

    // Add media layer if present
    if (settings.mediaUrl) {
      layers.push({
        id: 'media',
        name: settings.mediaType === 'video' ? 'Video Layer' : 'Image Layer',
        type: 'media',
        icon: <Image size={14} />,
        color: '#8B5CF6',
        visible: settings.enableMediaMode && (settings.displayMode === 'media' || settings.displayMode === 'combined'),
      });
    }

    // Add shader layer if enabled
    if (settings.enableShaderPattern) {
      layers.push({
        id: 'shader',
        name: `Shader: ${settings.shaderShape}`,
        type: 'shader',
        icon: <Sparkles size={14} />,
        color: '#3B82F6',
        visible: true,
      });
    }

    // Add active pattern layer
    const activePattern = settings.enableBuildDebuild ? 'buildDebuild' :
      settings.enableSpiral ? 'spiral' :
      settings.enableWave ? 'wave' :
      settings.enableRipple ? 'ripple' :
      settings.enablePulse ? 'pulse' :
      settings.enableScanner ? 'scanner' :
      settings.enableSparkle ? 'sparkle' :
      settings.enableRadar ? 'radar' : null;

    if (activePattern) {
      const patternNames: Record<string, string> = {
        buildDebuild: 'Build-Debuild',
        spiral: 'Spiral',
        wave: 'Wave',
        ripple: 'Ripple',
        pulse: 'Pulse',
        scanner: 'Scanner',
        sparkle: 'Sparkle',
        radar: 'Radar',
      };

      layers.push({
        id: 'pattern',
        name: patternNames[activePattern],
        type: 'pattern',
        icon: <Layers size={14} />,
        color: '#10B981',
        visible: settings.displayMode === 'led' || settings.displayMode === 'combined',
      });
    }

    return layers;
  }, [settings.mediaUrl, settings.mediaType, settings.enableMediaMode, settings.displayMode,
      settings.enableShaderPattern, settings.shaderShape, settings.enableBuildDebuild,
      settings.enableSpiral, settings.enableWave, settings.enableRipple, settings.enablePulse,
      settings.enableScanner, settings.enableSparkle, settings.enableRadar]);

  // Update layer order when base layers change
  useMemo(() => {
    const currentIds = baseLayers.map(l => l.id);
    const orderedIds = layerOrder.filter(id => currentIds.includes(id));
    const newIds = currentIds.filter(id => !layerOrder.includes(id));
    const finalOrder = [...orderedIds, ...newIds];

    if (JSON.stringify(finalOrder) !== JSON.stringify(layerOrder)) {
      setLayerOrder(finalOrder);
    }
  }, [baseLayers, layerOrder]);

  // Sort layers based on layerOrder
  const layers = useMemo(() => {
    if (layerOrder.length === 0) return baseLayers;

    return layerOrder
      .map(id => baseLayers.find(l => l.id === id))
      .filter((l): l is Layer => l !== undefined);
  }, [baseLayers, layerOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLayerOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    if (layerId === 'media') {
      if (settings.displayMode === 'media') {
        updateSettings({ displayMode: 'led' });
      } else if (settings.displayMode === 'led') {
        updateSettings({ displayMode: 'media' });
      } else {
        updateSettings({ displayMode: 'led' });
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-primary)]">
        <h3 className="section-title">Layers</h3>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--text-tertiary)] text-sm">
            <Layers size={24} className="mb-2 opacity-50" />
            <p>No active layers</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={layers.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {layers.map((layer) => (
                  <SortableLayerItem
                    key={layer.id}
                    layer={layer}
                    onToggleVisibility={toggleLayerVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
