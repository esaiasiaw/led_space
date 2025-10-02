export type StateListener = (state: any) => void;

export class StateManager {
  private state: Map<string, any>;
  private listeners: Map<string, Set<StateListener>>;

  constructor() {
    this.state = new Map();
    this.listeners = new Map();
  }

  /**
   * Get a value from state
   */
  get<T>(key: string): T | undefined {
    return this.state.get(key);
  }

  /**
   * Set a value in state and notify listeners
   */
  set(key: string, value: any): void {
    const oldValue = this.state.get(key);
    this.state.set(key, value);

    // Notify listeners if value changed
    if (oldValue !== value) {
      this.notify(key, value);
    }
  }

  /**
   * Update multiple state values at once
   */
  update(updates: Record<string, any>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Subscribe to state changes for a specific key
   */
  subscribe(key: string, listener: StateListener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  /**
   * Notify all listeners for a specific key
   */
  private notify(key: string, value: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => listener(value));
    }
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.state.clear();
  }

  /**
   * Get entire state as object
   */
  getAll(): Record<string, any> {
    return Object.fromEntries(this.state);
  }

  /**
   * Check if key exists in state
   */
  has(key: string): boolean {
    return this.state.has(key);
  }

  /**
   * Delete a key from state
   */
  delete(key: string): boolean {
    const result = this.state.delete(key);
    if (result) {
      this.notify(key, undefined);
    }
    return result;
  }
}
