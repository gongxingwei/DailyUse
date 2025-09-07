export interface ShortcutItem {
  uuid: string;
  name: string;
  path: string;  // 标题项不需要路径
  description?: string;
  icon: string;
  lastUsed?: Date;
  useCount?: number;
  category?: string;
  isTitle?: boolean;  // 添加标识是否为标题的字段
}

export interface ShortcutCategory {
  uuid: string;
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
  state: {
    selectedCategoryId: string;
    selectedItemId: string;
  };
}

export interface ShortcutAreaTitle {
  title: string;
}
