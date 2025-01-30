export interface ShortcutItem {
  id: string;
  name: string;
  path: string;
  category: string;
  icon?: string;
  description?: string;
  keywords?: string[];
  lastUsed?: Date;
  useCount?: number;
}

export interface ShortcutCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  items: ShortcutItem[];
  order?: number;
}

export interface QuickLauncherState {
  categories: ShortcutCategory[];
  recentItems: string[]; // 存储最近使用的项目ID
  favorites: string[]; // 存储收藏的项目ID
  settings: {
    maxRecentItems: number;
    maxSearchResults: number;
    showIcons: boolean;
    shortcutKey: string;
    theme: 'light' | 'dark' | 'system';
  };
}
