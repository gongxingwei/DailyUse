import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    quickLauncher: {
      title: 'Quick Launcher',
      search: 'Search...',
      category: {
        new: 'New Category',
        rename: 'Rename Category',
        delete: 'Delete Category',
        defaultName: 'General'
      },
      shortcut: {
        new: 'New Shortcut',
        edit: 'Edit Shortcut',
        delete: 'Delete Shortcut',
        openShortcutLocation: 'Reveal in Explorer',
        newTitle: 'New Title',
        emptyState: 'Drag files here or click Add Shortcut'
      },
      dialog: {
        rename: {
          title: 'Rename Category',
          label: 'Category Name'
        },
        edit: {
          title: 'Edit Shortcut'
        }
      },
      button: {
        cancel: 'Cancel',
        rename: 'Rename'
      }
    }
  },
  zh: {
    quickLauncher: {
      title: '快速启动器',
      search: '搜索...',
      category: {
        new: '新建分类',
        rename: '重命名分类',
        delete: '删除分类',
        defaultName: '常规'
      },
      shortcut: {
        new: '新建快捷方式',
        edit: '编辑快捷方式',
        delete: '删除快捷方式',
        openShortcutLocation: '资源管理器中打开',
        newTitle: '新建标题',
        emptyState: '拖拽文件到此处或点击添加快捷方式'
      },
      dialog: {
        rename: {
          title: '重命名分类',
          label: '分类名称'
        },
        edit: {
          title: '编辑快捷方式'
        }
      },
      button: {
        cancel: '取消',
        rename: '重命名'
      }
    }
  }
};

export function createQuickLauncherI18n() {
  return createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'en',
    messages
  });
}