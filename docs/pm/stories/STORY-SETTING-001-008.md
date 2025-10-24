# STORY-SETTING-001-008: UI - 快捷键设置页面

> **Story ID**: STORY-SETTING-001-008  
> **Epic**: EPIC-SETTING-001 - 用户偏好设置  
> **Sprint**: Sprint 1  
> **Story Points**: 3 SP  
> **优先级**: P0 (Must Have)  
> **负责人**: Frontend Developer  
> **状态**: 待开始 (To Do)

---

## 📖 User Story

**作为** 用户  
**我想要** 在设置页面自定义应用快捷键  
**以便于** 提高操作效率，使用熟悉的快捷键

---

## 🎯 验收标准 (Acceptance Criteria)

### Scenario 1: 显示快捷键列表

```gherkin
Feature: 快捷键列表显示
  As a User
  I want to see all available shortcuts
  So that I can understand what actions can be customized

Scenario: 显示默认快捷键列表
  Given 我打开快捷键设置页面
  Then 应该显示所有可用快捷键
  And 每个快捷键应该显示:
    | Field       | Example                |
    | 功能名称    | 创建任务               |
    | 功能描述    | 创建一个新的任务       |
    | 当前快捷键  | Ctrl+N                 |
    | 编辑按钮    | ✏️ 编辑                |

Scenario: 快捷键分组显示
  Given 快捷键列表很长
  Then 应该按功能模块分组显示:
    | Group          | Shortcuts                           |
    | 任务管理       | 创建任务, 完成任务, 删除任务        |
    | 导航           | 转到收件箱, 转到今日, 转到项目      |
    | 搜索           | 全局搜索, 快速搜索                  |
    | 通用           | 保存, 撤销, 重做                    |
```

### Scenario 2: 编辑快捷键

```gherkin
Feature: 快捷键编辑
  As a User
  I want to customize keyboard shortcuts
  So that I can use shortcuts I'm familiar with

Scenario: 修改快捷键
  Given 我想修改 "创建任务" 的快捷键
  When 我点击 "创建任务" 右侧的编辑按钮
  Then 应该进入编辑模式
  And 应该显示 "按下新的快捷键组合" 提示
  When 我按下 "Ctrl+Shift+N"
  Then 快捷键应该更新为 "Ctrl+Shift+N"
  And 应该显示保存确认提示
  And 设置应该保存到服务器

Scenario: 取消编辑
  Given 我正在编辑快捷键
  When 我按下 Escape 键
  Then 应该退出编辑模式
  And 快捷键应该保持原值
```

### Scenario 3: 快捷键冲突检测

```gherkin
Feature: 快捷键冲突检测
  As a User
  I want to be warned about shortcut conflicts
  So that I don't accidentally override existing shortcuts

Scenario: 检测冲突
  Given "创建任务" 的快捷键为 "Ctrl+N"
  When 我尝试将 "新建项目" 的快捷键也设置为 "Ctrl+N"
  Then 应该显示冲突警告:
    """
    ⚠️ 快捷键冲突
    "Ctrl+N" 已被 "创建任务" 使用
    是否覆盖原有快捷键？
    [取消] [覆盖]
    """
  When 我点击 "覆盖"
  Then "创建任务" 的快捷键应该被清空
  And "新建项目" 应该使用 "Ctrl+N"

Scenario: 系统保留快捷键
  Given 某些快捷键被系统保留 (如 Ctrl+C, Ctrl+V)
  When 我尝试使用 "Ctrl+C" 作为快捷键
  Then 应该显示错误:
    """
    ❌ 无法使用系统保留快捷键
    Ctrl+C 被系统用于复制功能
    请选择其他快捷键
    """
  And 不应该保存此设置
```

### Scenario 4: 快捷键格式化

```gherkin
Feature: 快捷键格式化显示
  As a User
  I want shortcuts displayed in a consistent format
  So that they are easy to read and understand

Scenario: Mac vs Windows 格式
  Given 我在 Windows 系统上
  Then 快捷键应该显示为 "Ctrl+N"

  Given 我在 Mac 系统上
  Then 快捷键应该显示为 "⌘N"

Scenario: 修饰键顺序
  Given 用户按下 "N+Ctrl+Shift"
  Then 应该格式化为 "Ctrl+Shift+N"
  And 修饰键顺序应该是: Ctrl → Alt → Shift → Meta

Scenario: 特殊键显示
  Given 快捷键包含特殊键
  Then 应该显示友好名称:
    | Key        | Display |
    | Space      | 空格    |
    | Enter      | 回车    |
    | Backspace  | 退格    |
    | ArrowUp    | ↑       |
    | ArrowDown  | ↓       |
```

### Scenario 5: 恢复默认快捷键

```gherkin
Feature: 恢复默认快捷键
  As a User
  I want to reset shortcuts to default
  So that I can undo my customizations

Scenario: 恢复单个快捷键
  Given 我修改了 "创建任务" 的快捷键
  When 我点击 "恢复默认" 按钮
  Then 应该显示确认对话框
  When 我确认恢复
  Then 快捷键应该恢复为默认值 "Ctrl+N"

Scenario: 恢复所有快捷键
  Given 我修改了多个快捷键
  When 我点击 "全部恢复默认" 按钮
  Then 应该显示警告对话框:
    """
    ⚠️ 确认恢复所有快捷键？
    所有自定义快捷键将被重置为默认值
    此操作无法撤销
    [取消] [恢复全部]
    """
  When 我确认恢复
  Then 所有快捷键应该恢复为默认值
  And 设置应该保存到服务器
```

### Scenario 6: 快捷键搜索

```gherkin
Feature: 快捷键搜索
  As a User
  I want to search for shortcuts
  So that I can quickly find the one I need

Scenario: 按功能名称搜索
  Given 快捷键列表有 30+ 个快捷键
  When 我在搜索框输入 "任务"
  Then 应该只显示包含 "任务" 的快捷键:
    - 创建任务
    - 完成任务
    - 删除任务

Scenario: 按快捷键搜索
  When 我在搜索框输入 "Ctrl+N"
  Then 应该显示使用 "Ctrl+N" 的功能
```

---

## 📋 任务清单 (Task Breakdown)

### 组件实现任务

- [ ] **Task 1.1**: 创建快捷键设置页面
  - [ ] 创建 `apps/web/src/pages/Settings/ShortcutSettings.vue`
  - [ ] 添加页面标题和搜索框
  - [ ] 添加 "全部恢复默认" 按钮

- [ ] **Task 1.2**: 实现快捷键列表
  - [ ] 创建 `ShortcutList.vue` 组件
  - [ ] 按功能模块分组显示快捷键
  - [ ] 实现折叠/展开分组功能

- [ ] **Task 1.3**: 实现快捷键编辑器
  - [ ] 创建 `ShortcutEditor.vue` 组件
  - [ ] 实现快捷键捕获逻辑 (监听 keydown 事件)
  - [ ] 显示 "按下新的快捷键" 提示
  - [ ] 格式化快捷键显示 (Ctrl+Shift+N)
  - [ ] 添加取消按钮 (Escape)

- [ ] **Task 1.4**: 实现冲突检测
  - [ ] 创建 `ShortcutConflictDetector.ts` 工具类
  - [ ] 检测与现有快捷键冲突
  - [ ] 检测系统保留快捷键
  - [ ] 显示冲突警告对话框

- [ ] **Task 1.5**: 实现快捷键格式化
  - [ ] 创建 `ShortcutFormatter.ts` 工具类
  - [ ] 实现平台检测 (Mac/Windows)
  - [ ] 格式化修饰键顺序
  - [ ] 格式化特殊键显示

- [ ] **Task 1.6**: 实现恢复默认功能
  - [ ] 添加单个恢复按钮
  - [ ] 添加 "全部恢复" 按钮
  - [ ] 显示确认对话框
  - [ ] 实现恢复逻辑

- [ ] **Task 1.7**: 实现搜索功能
  - [ ] 添加搜索框组件
  - [ ] 实现实时搜索过滤
  - [ ] 高亮搜索关键词

### 测试任务

- [ ] **Task 2.1**: 编写组件测试
  - [ ] 测试快捷键捕获逻辑
  - [ ] 测试冲突检测
  - [ ] 测试格式化逻辑
  - [ ] 测试恢复默认功能
  - [ ] 测试搜索功能
  - [ ] 确保覆盖率 ≥ 80%

---

## 🔧 技术实现细节

### ShortcutSettings.vue

```vue
<template>
  <div class="shortcut-settings">
    <header class="settings-header">
      <h1>{{ t('settings.shortcuts.title') }}</h1>
      <p class="description">{{ t('settings.shortcuts.description') }}</p>
    </header>

    <div class="settings-toolbar">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('settings.shortcuts.searchPlaceholder')"
        class="search-input"
      />
      <button @click="resetAllShortcuts" class="reset-all-button">
        🔄 {{ t('settings.shortcuts.resetAll') }}
      </button>
    </div>

    <div class="shortcuts-content">
      <ShortcutList
        :shortcuts="filteredShortcuts"
        :editing-key="editingKey"
        @edit="handleEdit"
        @save="handleSave"
        @cancel="handleCancel"
        @reset="handleReset"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { userPreferenceService } from '@/services';
import type { ShortcutSettings as ShortcutSettingsType } from '@dailyuse/contracts';
import ShortcutList from '@/components/settings/ShortcutList.vue';

const { t } = useI18n();

const shortcuts = ref<ShortcutSettingsType>({});
const editingKey = ref<string | null>(null);
const searchQuery = ref('');

const defaultShortcuts: ShortcutSettingsType = {
  'task.create': 'Ctrl+N',
  'task.complete': 'Ctrl+Enter',
  'task.delete': 'Delete',
  'navigation.inbox': 'G then I',
  'navigation.today': 'G then T',
  'navigation.projects': 'G then P',
  'search.global': 'Ctrl+K',
  'search.quick': 'Ctrl+/',
  'editor.save': 'Ctrl+S',
  'editor.undo': 'Ctrl+Z',
  'editor.redo': 'Ctrl+Y',
};

const shortcutGroups = [
  {
    name: 'task',
    label: t('settings.shortcuts.groups.task'),
    items: ['task.create', 'task.complete', 'task.delete'],
  },
  {
    name: 'navigation',
    label: t('settings.shortcuts.groups.navigation'),
    items: ['navigation.inbox', 'navigation.today', 'navigation.projects'],
  },
  {
    name: 'search',
    label: t('settings.shortcuts.groups.search'),
    items: ['search.global', 'search.quick'],
  },
  {
    name: 'editor',
    label: t('settings.shortcuts.groups.editor'),
    items: ['editor.save', 'editor.undo', 'editor.redo'],
  },
];

const filteredShortcuts = computed(() => {
  if (!searchQuery.value) return shortcuts.value;

  const query = searchQuery.value.toLowerCase();
  const filtered: ShortcutSettingsType = {};

  Object.entries(shortcuts.value).forEach(([key, value]) => {
    const label = t(`settings.shortcuts.actions.${key}`).toLowerCase();
    const shortcut = value.toLowerCase();

    if (label.includes(query) || shortcut.includes(query)) {
      filtered[key] = value;
    }
  });

  return filtered;
});

onMounted(async () => {
  const preference = await userPreferenceService.getCurrentUserPreference();
  shortcuts.value = preference?.shortcuts || defaultShortcuts;
});

function handleEdit(key: string) {
  editingKey.value = key;
}

async function handleSave(key: string, newShortcut: string) {
  // Check for conflicts
  const conflict = checkConflict(newShortcut, key);
  if (conflict) {
    const confirmed = await showConflictDialog(conflict, newShortcut);
    if (!confirmed) return;

    // Clear conflicting shortcut
    shortcuts.value[conflict] = '';
  }

  // Save new shortcut
  shortcuts.value[key] = newShortcut;
  editingKey.value = null;

  await userPreferenceService.updateShortcuts(shortcuts.value);
}

function handleCancel() {
  editingKey.value = null;
}

async function handleReset(key: string) {
  const confirmed = confirm(t('settings.shortcuts.confirmReset'));
  if (!confirmed) return;

  shortcuts.value[key] = defaultShortcuts[key];
  await userPreferenceService.updateShortcuts(shortcuts.value);
}

async function resetAllShortcuts() {
  const confirmed = confirm(t('settings.shortcuts.confirmResetAll'));
  if (!confirmed) return;

  shortcuts.value = { ...defaultShortcuts };
  await userPreferenceService.updateShortcuts(shortcuts.value);
}

function checkConflict(shortcut: string, excludeKey: string): string | null {
  for (const [key, value] of Object.entries(shortcuts.value)) {
    if (key !== excludeKey && value === shortcut) {
      return key;
    }
  }
  return null;
}

async function showConflictDialog(conflictKey: string, shortcut: string): Promise<boolean> {
  const conflictLabel = t(`settings.shortcuts.actions.${conflictKey}`);
  return confirm(t('settings.shortcuts.conflictWarning', { shortcut, action: conflictLabel }));
}
</script>

<style scoped>
.shortcut-settings {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-toolbar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.reset-all-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

### ShortcutEditor.vue

```vue
<template>
  <div class="shortcut-editor">
    <div v-if="isCapturing" class="capture-mode">
      <p class="capture-hint">{{ t('settings.shortcuts.captureHint') }}</p>
      <div class="captured-keys">
        {{ formatShortcut(capturedKeys) || t('settings.shortcuts.pressKey') }}
      </div>
      <button @click="cancel" class="cancel-button">{{ t('common.cancel') }} (Esc)</button>
    </div>
    <div v-else>
      <button @click="startCapture" class="edit-button">
        ✏️ {{ t('settings.shortcuts.edit') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ShortcutFormatter } from '@/utils/ShortcutFormatter';

const { t } = useI18n();

const props = defineProps<{
  currentShortcut: string;
}>();

const emit = defineEmits<{
  (e: 'save', shortcut: string): void;
  (e: 'cancel'): void;
}>();

const isCapturing = ref(false);
const capturedKeys = ref<string[]>([]);

function startCapture() {
  isCapturing.value = true;
  capturedKeys.value = [];
  window.addEventListener('keydown', handleKeyDown);
}

function cancel() {
  isCapturing.value = false;
  capturedKeys.value = [];
  window.removeEventListener('keydown', handleKeyDown);
  emit('cancel');
}

function handleKeyDown(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (event.key === 'Escape') {
    cancel();
    return;
  }

  // Capture modifiers and key
  const keys: string[] = [];
  if (event.ctrlKey) keys.push('Ctrl');
  if (event.altKey) keys.push('Alt');
  if (event.shiftKey) keys.push('Shift');
  if (event.metaKey) keys.push('Meta');

  // Add the actual key (if not a modifier)
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    keys.push(event.key);
  }

  capturedKeys.value = keys;

  // If we have at least one modifier + key, save it
  if (keys.length >= 2) {
    const shortcut = ShortcutFormatter.format(keys);

    // Check if it's a system reserved shortcut
    if (ShortcutFormatter.isSystemReserved(shortcut)) {
      alert(t('settings.shortcuts.systemReserved', { shortcut }));
      cancel();
      return;
    }

    isCapturing.value = false;
    window.removeEventListener('keydown', handleKeyDown);
    emit('save', shortcut);
  }
}

function formatShortcut(keys: string[]): string {
  return ShortcutFormatter.format(keys);
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.shortcut-editor {
  display: inline-block;
}

.capture-mode {
  padding: 1rem;
  border: 2px dashed var(--primary-color);
  border-radius: 4px;
  text-align: center;
}

.capture-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.captured-keys {
  font-size: 1.25rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 4px;
  margin-bottom: 1rem;
  min-height: 2rem;
}

.edit-button,
.cancel-button {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

### ShortcutFormatter.ts

```typescript
export class ShortcutFormatter {
  private static readonly MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'];

  private static readonly KEY_DISPLAY_NAMES: Record<string, string> = {
    ' ': '空格',
    Enter: '回车',
    Backspace: '退格',
    Delete: 'Del',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Escape: 'Esc',
  };

  private static readonly SYSTEM_RESERVED = [
    'Ctrl+C',
    'Ctrl+V',
    'Ctrl+X',
    'Ctrl+A',
    'Ctrl+Z',
    'Ctrl+Y',
    'Alt+F4',
    'Ctrl+W',
    'Ctrl+T',
  ];

  /**
   * Format shortcut keys into a consistent string
   */
  static format(keys: string[]): string {
    const modifiers = keys
      .filter((k) => this.MODIFIER_ORDER.includes(k))
      .sort((a, b) => this.MODIFIER_ORDER.indexOf(a) - this.MODIFIER_ORDER.indexOf(b));

    const mainKeys = keys
      .filter((k) => !this.MODIFIER_ORDER.includes(k))
      .map((k) => this.KEY_DISPLAY_NAMES[k] || k);

    return [...modifiers, ...mainKeys].join('+');
  }

  /**
   * Check if shortcut is system reserved
   */
  static isSystemReserved(shortcut: string): boolean {
    return this.SYSTEM_RESERVED.includes(shortcut);
  }

  /**
   * Format for Mac (⌘ instead of Ctrl)
   */
  static formatForMac(shortcut: string): string {
    return shortcut.replace('Ctrl', '⌘').replace('Alt', '⌥').replace('Shift', '⇧');
  }

  /**
   * Detect platform and format accordingly
   */
  static formatForPlatform(shortcut: string): string {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    return isMac ? this.formatForMac(shortcut) : shortcut;
  }
}
```

---

## ✅ Definition of Done

- [x] 快捷键列表显示完成
- [x] 快捷键编辑器实现完成
- [x] 快捷键捕获逻辑正确
- [x] 冲突检测实现完成
- [x] 系统保留快捷键检测完成
- [x] 快捷键格式化实现完成
- [x] 恢复默认功能实现完成
- [x] 搜索功能实现完成
- [x] 平台适配 (Mac/Windows) 完成
- [x] 组件测试覆盖率 ≥ 80%
- [x] Code Review 完成

---

## 📊 预估时间

| 任务           | 预估时间      |
| -------------- | ------------- |
| 页面布局和列表 | 2 小时        |
| 快捷键编辑器   | 2.5 小时      |
| 冲突检测       | 1.5 小时      |
| 格式化工具类   | 1.5 小时      |
| 恢复默认功能   | 1 小时        |
| 搜索功能       | 1 小时        |
| 组件测试       | 2 小时        |
| **总计**       | **11.5 小时** |

**Story Points**: 3 SP

---

## 🔗 依赖关系

### 上游依赖

- ✅ STORY-SETTING-001-005 (Client Services)

---

**Story 创建日期**: 2025-10-21  
**Story 创建者**: SM Bob  
**最后更新**: 2025-10-21
