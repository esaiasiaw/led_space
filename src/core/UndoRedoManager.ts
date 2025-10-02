export interface Command {
  execute(): void;
  undo(): void;
  redo?(): void;
}

export class UndoRedoManager {
  private undoStack: Command[];
  private redoStack: Command[];
  private maxStackSize: number;

  constructor(maxStackSize: number = 100) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = maxStackSize;
  }

  /**
   * Execute a command and add it to the undo stack
   */
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    // Clear redo stack when new command is executed
    this.redoStack = [];
  }

  /**
   * Undo the last command
   */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) {
      return false;
    }

    command.undo();
    this.redoStack.push(command);
    return true;
  }

  /**
   * Redo the last undone command
   */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) {
      return false;
    }

    if (command.redo) {
      command.redo();
    } else {
      command.execute();
    }

    this.undoStack.push(command);
    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get the size of the undo stack
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get the size of the redo stack
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }
}
