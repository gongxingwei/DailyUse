/**
 * Keyboard Shortcuts Composable
 * 
 * Provides a simple API for registering and managing keyboard shortcuts.
 * Handles platform differences (Cmd on Mac, Ctrl on Windows/Linux).
 * 
 * @module useKeyboardShortcuts
 */

import { onMounted, onUnmounted } from 'vue';

/**
 * Modifier keys
 */
export interface ShortcutModifiers {
  ctrl?: boolean;
  meta?: boolean; // Cmd on Mac
  alt?: boolean;
  shift?: boolean;
}

/**
 * Shortcut configuration
 */
export interface ShortcutConfig {
  key: string;
  modifiers?: ShortcutModifiers;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Registered shortcut
 */
interface RegisteredShortcut {
  config: ShortcutConfig;
  cleanup: () => void;
}

/**
 * Check if event matches shortcut config
 */
function matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
  const { key, modifiers = {} } = config;

  // Check key match (case insensitive)
  if (event.key.toLowerCase() !== key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  if (modifiers.ctrl !== undefined && event.ctrlKey !== modifiers.ctrl) {
    return false;
  }

  if (modifiers.meta !== undefined && event.metaKey !== modifiers.meta) {
    return false;
  }

  if (modifiers.alt !== undefined && event.altKey !== modifiers.alt) {
    return false;
  }

  if (modifiers.shift !== undefined && event.shiftKey !== modifiers.shift) {
    return false;
  }

  return true;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(config: ShortcutConfig): string {
  const parts: string[] = [];
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (config.modifiers?.ctrl) {
    parts.push(isMac ? '⌃' : 'Ctrl');
  }

  if (config.modifiers?.meta) {
    parts.push(isMac ? '⌘' : 'Win');
  }

  if (config.modifiers?.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  if (config.modifiers?.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  parts.push(config.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

/**
 * Keyboard shortcuts composable
 */
export function useKeyboardShortcuts() {
  const shortcuts = new Map<string, RegisteredShortcut>();

  /**
   * Register a keyboard shortcut
   * 
   * @param id Unique identifier for the shortcut
   * @param config Shortcut configuration
   * @returns Cleanup function
   */
  function register(id: string, config: ShortcutConfig): () => void {
    // Unregister existing shortcut with same ID
    if (shortcuts.has(id)) {
      unregister(id);
    }

    // Create event handler
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow shortcuts with modifiers even in input fields
      const hasModifiers =
        config.modifiers?.ctrl ||
        config.modifiers?.meta ||
        config.modifiers?.alt;

      if (isInput && !hasModifiers) {
        return;
      }

      // Check if event matches shortcut
      if (matchesShortcut(event, config)) {
        if (config.preventDefault !== false) {
          event.preventDefault();
        }

        if (config.stopPropagation) {
          event.stopPropagation();
        }

        config.handler(event);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Create cleanup function
    const cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown);
    };

    // Store registered shortcut
    shortcuts.set(id, { config, cleanup });

    return cleanup;
  }

  /**
   * Unregister a keyboard shortcut
   * 
   * @param id Shortcut identifier
   */
  function unregister(id: string): void {
    const shortcut = shortcuts.get(id);
    if (shortcut) {
      shortcut.cleanup();
      shortcuts.delete(id);
    }
  }

  /**
   * Unregister all shortcuts
   */
  function unregisterAll(): void {
    shortcuts.forEach((shortcut) => {
      shortcut.cleanup();
    });
    shortcuts.clear();
  }

  /**
   * Get all registered shortcuts
   */
  function getAll(): Array<{ id: string; config: ShortcutConfig }> {
    return Array.from(shortcuts.entries()).map(([id, shortcut]) => ({
      id,
      config: shortcut.config,
    }));
  }

  /**
   * Check if a shortcut is registered
   */
  function has(id: string): boolean {
    return shortcuts.has(id);
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unregisterAll();
  });

  return {
    register,
    unregister,
    unregisterAll,
    getAll,
    has,
    formatShortcut,
  };
}

/**
 * Global keyboard shortcut composable
 * 
 * Use this for shortcuts that should always be active,
 * regardless of which component is mounted.
 */
export function useGlobalKeyboardShortcuts() {
  const { register, unregister, unregisterAll, getAll, has } = useKeyboardShortcuts();

  /**
   * Register a global shortcut
   * 
   * Unlike regular shortcuts, these are not automatically cleaned up on unmount.
   * You must call unregister() or unregisterAll() manually.
   */
  function registerGlobal(id: string, config: ShortcutConfig): () => void {
    return register(id, config);
  }

  return {
    registerGlobal,
    unregister,
    unregisterAll,
    getAll,
    has,
    formatShortcut,
  };
}

/**
 * Common keyboard shortcuts
 */
export const CommonShortcuts = {
  COMMAND_PALETTE: {
    key: 'k',
    modifiers: { ctrl: true, meta: true },
    description: 'Open command palette',
  },
  ESCAPE: {
    key: 'Escape',
    description: 'Close dialog or cancel action',
  },
  SAVE: {
    key: 's',
    modifiers: { ctrl: true, meta: true },
    description: 'Save changes',
  },
  UNDO: {
    key: 'z',
    modifiers: { ctrl: true, meta: true },
    description: 'Undo last action',
  },
  REDO: {
    key: 'z',
    modifiers: { ctrl: true, meta: true, shift: true },
    description: 'Redo last action',
  },
  FIND: {
    key: 'f',
    modifiers: { ctrl: true, meta: true },
    description: 'Find in page',
  },
  NEW: {
    key: 'n',
    modifiers: { ctrl: true, meta: true },
    description: 'Create new item',
  },
  DELETE: {
    key: 'Delete',
    description: 'Delete selected item',
  },
  SELECT_ALL: {
    key: 'a',
    modifiers: { ctrl: true, meta: true },
    description: 'Select all items',
  },
  REFRESH: {
    key: 'r',
    modifiers: { ctrl: true, meta: true },
    description: 'Refresh page',
  },
} as const;
