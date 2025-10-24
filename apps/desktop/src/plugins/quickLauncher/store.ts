import { defineStore } from 'pinia';
import { ShortcutItem, ShortcutCategory, QuickLauncherState } from './types';

export const useQuickLauncherStore = defineStore('quickLauncher', {
  state: (): QuickLauncherState => ({
    categories: [],
    recentItems: [],
    favorites: [],
    settings: {
      maxRecentItems: 10,
      maxSearchResults: 20,
      showIcons: true,
      shortcutKey: 'Alt+Space',
      theme: 'system',
    },
    state: {
      selectedCategoryId: '',
      selectedItemId: '',
    },
  }),

  getters: {
    getItemById:
      (state) =>
      (uuid: string): ShortcutItem | undefined => {
        for (const category of state.categories) {
          const item = category.items.find((item) => item.uuid === uuid);
          if (item) return item;
        }
        return undefined;
      },

    recentlyUsedItems: (state): ShortcutItem[] => {
      return state.recentItems
        .map((id) => {
          for (const category of state.categories) {
            const item = category.items.find((item) => item.uuid === id);
            if (item) return item;
          }
          return null;
        })
        .filter((item): item is ShortcutItem => item !== null);
    },

    favoriteItems: (state): ShortcutItem[] => {
      return state.favorites
        .map((id) => {
          for (const category of state.categories) {
            const item = category.items.find((item) => item.uuid === id);
            if (item) return item;
          }
          return null;
        })
        .filter((item): item is ShortcutItem => item !== null);
    },
    getCategoryById:
      (state) =>
      (uuid: string): ShortcutCategory | undefined => {
        return state.categories.find((c) => c.uuid === uuid);
      },
    sortedCategories: (state) => {
      return [...state.categories].sort((a, b) => {
        // 首先按照 order 排序
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // 如果没有 order，按照名称排序
        return a.name.localeCompare(b.name);
      });
    },
  },

  actions: {
    addCategory(category: Omit<ShortcutCategory, 'items'>) {
      this.categories.push({
        ...category,
        items: [],
      });
    },

    updateCategory(categoryId: string, updates: Partial<ShortcutCategory>) {
      const index = this.categories.findIndex((c) => c.uuid === categoryId);
      if (index !== -1) {
        this.categories[index] = { ...this.categories[index], ...updates };
      }
    },

    removeCategory(categoryId: string) {
      this.categories = this.categories.filter((c) => c.uuid !== categoryId);
    },

    addShortcut(categoryId: string, shortcut: ShortcutItem) {
      const category = this.categories.find((c) => c.uuid === categoryId);
      if (category) {
        if (!category.items) {
          category.items = [];
        }
        if (!category.items.find((item) => item.uuid === shortcut.uuid)) {
          shortcut.lastUsed = new Date();
          shortcut.useCount = 0;
          category.items.push(shortcut);
        }
      }
    },

    updateShortcut(categoryId: string, shortcutId: string, updates: Partial<ShortcutItem>) {
      const category = this.categories.find((c) => c.uuid === categoryId);
      if (category) {
        const index = category.items.findIndex((item) => item.uuid === shortcutId);
        if (index !== -1) {
          category.items[index] = { ...category.items[index], ...updates };
        }
      }
    },

    removeShortcut(categoryId: string, shortcutId: string) {
      const category = this.categories.find((c) => c.uuid === categoryId);
      if (category) {
        category.items = category.items.filter((item) => item.uuid !== shortcutId);
        // 同时从最近使用和收藏中移除
        this.recentItems = this.recentItems.filter((id) => id !== shortcutId);
        this.favorites = this.favorites.filter((id) => id !== shortcutId);
      }
    },

    recordItemUsage(itemId: string) {
      const item = this.categories.flatMap((c) => c.items).find((item) => item.uuid === itemId);
      if (item) {
        // 更新使用次数和最后使用时间
        item.useCount = (item.useCount || 0) + 1;
        item.lastUsed = new Date();

        // 更新最近使用列表
        this.recentItems = [itemId, ...this.recentItems.filter((id) => id !== itemId)].slice(
          0,
          this.settings.maxRecentItems,
        );
      }
    },

    toggleFavorite(itemId: string) {
      const index = this.favorites.indexOf(itemId);
      if (index === -1) {
        this.favorites.push(itemId);
      } else {
        this.favorites.splice(index, 1);
      }
    },

    updateSettings(updates: Partial<QuickLauncherState['settings']>) {
      this.settings = { ...this.settings, ...updates };
    },

    moveShortcut(itemId: string, fromCategoryId: string, toCategoryId: string) {
      const fromCategory = this.categories.find((c) => c.uuid === fromCategoryId);
      const toCategory = this.categories.find((c) => c.uuid === toCategoryId);

      if (fromCategory && toCategory) {
        const itemIndex = fromCategory.items.findIndex((item) => item.uuid === itemId);
        if (itemIndex !== -1) {
          const [item] = fromCategory.items.splice(itemIndex, 1);
          toCategory.items.push({ ...item, category: toCategoryId });
        }
      }
    },

    setSelectedCategory(categoryId: string) {
      this.state.selectedCategoryId = categoryId;
    },
    setSelectedItem(itemId: string) {
      this.state.selectedItemId = itemId;
    },
  },

  persist: [
    {
      key: 'quickLauncher',
      storage: localStorage,
    },
  ],
});

declare module 'pinia' {
  export interface PiniaCustomProperties {
    addCategory: (category: Omit<ShortcutCategory, 'items'>) => void;
    updateCategory: (categoryId: string, updates: Partial<ShortcutCategory>) => void;
    removeCategory: (categoryId: string) => void;
    addShortcut: (categoryId: string, shortcut: ShortcutItem) => void;
    updateShortcut: (
      categoryId: string,
      shortcutId: string,
      updates: Partial<ShortcutItem>,
    ) => void;
    removeShortcut: (categoryId: string, shortcutId: string) => void;
    recordItemUsage: (itemId: string) => void;
    toggleFavorite: (itemId: string) => void;
    updateSettings: (updates: Partial<QuickLauncherState['settings']>) => void;
    moveShortcut: (itemId: string, fromCategoryId: string, toCategoryId: string) => void;
    setSelectedCategory: (categoryId: string) => void;
    setSelectedItem: (itemId: string) => void;
  }
}
