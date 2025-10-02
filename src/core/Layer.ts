import * as THREE from 'three';

export type LayerType = 'pattern' | 'media' | 'shader' | 'shape' | 'text' | 'group';

export interface LayerProperties {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  parentId?: string;
  order: number;
}

export class Layer {
  public id: string;
  public name: string;
  public type: LayerType;
  public visible: boolean;
  public locked: boolean;
  public opacity: number;
  public blendMode: string;
  public transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  public parentId?: string;
  public order: number;
  public children: Layer[];
  public object3D?: THREE.Object3D;
  public data: any;

  constructor(properties: Partial<LayerProperties> = {}) {
    this.id = properties.id || this.generateId();
    this.name = properties.name || 'Untitled Layer';
    this.type = properties.type || 'pattern';
    this.visible = properties.visible !== undefined ? properties.visible : true;
    this.locked = properties.locked !== undefined ? properties.locked : false;
    this.opacity = properties.opacity !== undefined ? properties.opacity : 1;
    this.blendMode = properties.blendMode || 'normal';
    this.transform = properties.transform || {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
    this.parentId = properties.parentId;
    this.order = properties.order !== undefined ? properties.order : 0;
    this.children = [];
    this.data = {};
  }

  private generateId(): string {
    return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clone the layer
   */
  clone(): Layer {
    const clonedLayer = new Layer({
      name: `${this.name} Copy`,
      type: this.type,
      visible: this.visible,
      locked: this.locked,
      opacity: this.opacity,
      blendMode: this.blendMode,
      transform: JSON.parse(JSON.stringify(this.transform)),
      order: this.order
    });

    clonedLayer.data = JSON.parse(JSON.stringify(this.data));

    // Clone children
    this.children.forEach(child => {
      const clonedChild = child.clone();
      clonedChild.parentId = clonedLayer.id;
      clonedLayer.children.push(clonedChild);
    });

    return clonedLayer;
  }

  /**
   * Add a child layer
   */
  addChild(layer: Layer): void {
    layer.parentId = this.id;
    this.children.push(layer);
  }

  /**
   * Remove a child layer
   */
  removeChild(layerId: string): boolean {
    const index = this.children.findIndex(child => child.id === layerId);
    if (index !== -1) {
      this.children.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get layer as plain object
   */
  toJSON(): LayerProperties {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      visible: this.visible,
      locked: this.locked,
      opacity: this.opacity,
      blendMode: this.blendMode,
      transform: this.transform,
      parentId: this.parentId,
      order: this.order
    };
  }

  /**
   * Update layer properties
   */
  update(properties: Partial<LayerProperties>): void {
    Object.assign(this, properties);
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (this.object3D) {
      this.object3D.visible = visible;
    }
  }

  /**
   * Set locked state
   */
  setLocked(locked: boolean): void {
    this.locked = locked;
  }

  /**
   * Set opacity
   */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }
}

export class LayerManager {
  private layers: Map<string, Layer>;
  private rootLayers: Layer[];

  constructor() {
    this.layers = new Map();
    this.rootLayers = [];
  }

  /**
   * Add a layer
   */
  addLayer(layer: Layer, parentId?: string): void {
    this.layers.set(layer.id, layer);

    if (parentId) {
      const parent = this.layers.get(parentId);
      if (parent) {
        parent.addChild(layer);
      }
    } else {
      this.rootLayers.push(layer);
    }
  }

  /**
   * Remove a layer
   */
  removeLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    // Remove from parent or root
    if (layer.parentId) {
      const parent = this.layers.get(layer.parentId);
      parent?.removeChild(layerId);
    } else {
      const index = this.rootLayers.findIndex(l => l.id === layerId);
      if (index !== -1) {
        this.rootLayers.splice(index, 1);
      }
    }

    // Remove from map
    this.layers.delete(layerId);

    // Remove all children
    layer.children.forEach(child => {
      this.removeLayer(child.id);
    });

    return true;
  }

  /**
   * Get a layer by ID
   */
  getLayer(layerId: string): Layer | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Get all root layers
   */
  getRootLayers(): Layer[] {
    return this.rootLayers;
  }

  /**
   * Get all layers as flat array
   */
  getAllLayers(): Layer[] {
    return Array.from(this.layers.values());
  }

  /**
   * Reorder layers
   */
  reorderLayers(layerIds: string[]): void {
    layerIds.forEach((id, index) => {
      const layer = this.layers.get(id);
      if (layer) {
        layer.order = index;
      }
    });

    this.rootLayers.sort((a, b) => a.order - b.order);
  }

  /**
   * Clear all layers
   */
  clear(): void {
    this.layers.clear();
    this.rootLayers = [];
  }
}
