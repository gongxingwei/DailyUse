<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h3 class="text-h5 mb-4">
          <v-icon class="mr-2">mdi-keyboard</v-icon>
          快捷键设置
        </h3>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-list lines="two">
          <!-- 启用快捷键 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-keyboard-settings</v-icon>
            </template>
            <v-list-item-title>启用快捷键</v-list-item-title>
            <v-list-item-subtitle>使用键盘快捷键快速执行操作</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localShortcuts.enabled"
                color="primary"
                hide-details
                @update:model-value="handleShortcutChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <!-- 快捷键列表 -->
    <v-row v-if="localShortcuts.enabled">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-3">
          <h4 class="text-h6">自定义快捷键</h4>
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            placeholder="搜索快捷键..."
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            style="max-width: 300px;"
          />
        </div>

        <v-list lines="two" class="mb-4">
          <v-list-item
            v-for="shortcut in filteredShortcuts"
            :key="shortcut.action"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" variant="tonal">
                <span>{{ shortcut.icon }}</span>
              </v-avatar>
            </template>

            <v-list-item-title>
              {{ shortcut.label }}
              <v-chip 
                v-if="hasConflict(shortcut.action)"
                color="error" 
                size="x-small" 
                class="ml-2"
              >
                冲突
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ shortcut.description }}
              <span v-if="hasConflict(shortcut.action)" class="text-error">
                - 与 "{{ getConflictingShortcut(shortcut.action)?.label }}" 冲突
              </span>
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="d-flex align-center ga-2">
                <v-text-field
                  :model-value="formatShortcutForPlatform(getShortcutValue(shortcut.action) || shortcut.default)"
                  :placeholder="formatShortcutForPlatform(shortcut.default)"
                  density="compact"
                  variant="outlined"
                  readonly
                  :error="hasConflict(shortcut.action)"
                  style="max-width: 180px; font-family: monospace;"
                  hide-details
                  @keydown.prevent="(e: any) => handleKeyDown(e, shortcut.action)"
                  @blur="() => handleShortcutBlur(shortcut.action)"
                  @focus="recordingAction = shortcut.action"
                  :disabled="loading"
                >
                  <template v-slot:prepend-inner v-if="recordingAction === shortcut.action">
                    <v-progress-circular
                      indeterminate
                      size="16"
                      width="2"
                      color="primary"
                    />
                  </template>
                  <template v-slot:append-inner>
                    <v-btn
                      v-if="getShortcutValue(shortcut.action) && getShortcutValue(shortcut.action) !== shortcut.default"
                      icon="mdi-restore"
                      size="x-small"
                      variant="text"
                      @click="() => handleRestoreDefault(shortcut.action, shortcut.default)"
                      :disabled="loading"
                      title="恢复默认"
                    />
                    <v-btn
                      v-if="getShortcutValue(shortcut.action)"
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      @click="() => handleClearShortcut(shortcut.action)"
                      :disabled="loading"
                      title="清除"
                    />
                  </template>
                </v-text-field>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <!-- 提示信息 -->
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <v-alert-title class="text-body-2">💡 提示</v-alert-title>
          <ul class="text-body-2 pl-4 mb-0">
            <li>点击输入框并按下您想要的快捷键组合</li>
            <li>支持组合键：Ctrl, Alt, Shift, Meta(⌘)</li>
            <li>示例：Ctrl+N, Alt+Shift+T, Ctrl+Alt+D</li>
            <li>点击 ✕ 按钮可以清除快捷键</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>

    <!-- 操作按钮 -->
    <v-row>
      <v-col cols="12" class="d-flex justify-end ga-2">
        <v-btn
          color="primary"
          @click="handleSaveAll"
          :disabled="loading || !hasChanges"
          :loading="loading"
        >
          保存更改
        </v-btn>
        <v-btn
          variant="outlined"
          @click="handleReset"
          :disabled="loading"
        >
          重置
        </v-btn>
        <v-btn
          variant="outlined"
          @click="handleResetToDefaults"
          :disabled="loading"
        >
          恢复默认
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserSetting } from '../composables/useUserSetting';

// ===== 预定义快捷键 =====
interface PredefinedShortcut {
  action: string;
  label: string;
  icon: string;
  description: string;
  default: string;
}

const predefinedShortcuts: PredefinedShortcut[] = [
  { action: 'NEW_TASK', label: '新建任务', icon: '📝', description: '快速创建新任务', default: 'Ctrl+N' },
  { action: 'NEW_GOAL', label: '新建目标', icon: '🎯', description: '快速创建新目标', default: 'Ctrl+G' },
  { action: 'NEW_SCHEDULE', label: '新建日程', icon: '📅', description: '快速创建新日程', default: 'Ctrl+E' },
  { action: 'SEARCH', label: '全局搜索', icon: '🔍', description: '打开搜索面板', default: 'Ctrl+K' },
  { action: 'COMMAND_PALETTE', label: '命令面板', icon: '⌘', description: '打开命令面板', default: 'Ctrl+P' },
  { action: 'TOGGLE_SIDEBAR', label: '切换侧边栏', icon: '📋', description: '显示/隐藏侧边栏', default: 'Ctrl+B' },
  { action: 'SAVE', label: '保存', icon: '💾', description: '保存当前更改', default: 'Ctrl+S' },
  { action: 'UNDO', label: '撤销', icon: '↩️', description: '撤销上一步操作', default: 'Ctrl+Z' },
  { action: 'REDO', label: '重做', icon: '↪️', description: '重做上一步操作', default: 'Ctrl+Y' },
  { action: 'SETTINGS', label: '打开设置', icon: '⚙️', description: '打开设置页面', default: 'Ctrl+,' },
];

// ===== Props =====
const props = defineProps<{
  autoSave?: boolean;
}>();

// ===== Composables =====
const { userSetting, loading, setShortcut, removeShortcut, getShortcut } = useUserSetting();

// ===== 本地状态 =====
const localShortcuts = ref<{
  enabled: boolean;
  custom: Record<string, string>;
}>({
  enabled: true,
  custom: {},
});

const originalShortcuts = ref<{
  enabled: boolean;
  custom: Record<string, string>;
}>({
  enabled: true,
  custom: {},
});

const tempKeyValue = ref<Record<string, string>>({});
const searchQuery = ref('');
const recordingAction = ref<string | null>(null);

// 检测平台（Mac 或其他）
const isMac = ref(
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
);

// ===== 计算属性 =====
const hasChanges = computed(() => {
  return JSON.stringify(localShortcuts.value) !== JSON.stringify(originalShortcuts.value);
});

// 过滤后的快捷键列表
const filteredShortcuts = computed(() => {
  if (!searchQuery.value) return predefinedShortcuts;
  
  const query = searchQuery.value.toLowerCase();
  return predefinedShortcuts.filter(
    (s) =>
      s.label.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.action.toLowerCase().includes(query)
  );
});

// 冲突检测
const conflicts = computed(() => {
  const conflictMap: Record<string, string[]> = {};
  
  Object.entries(localShortcuts.value.custom).forEach(([action, shortcut]) => {
    if (!shortcut) return;
    
    if (!conflictMap[shortcut]) {
      conflictMap[shortcut] = [];
    }
    conflictMap[shortcut].push(action);
  });
  
  // 只保留有冲突的（同一个快捷键被多个动作使用）
  return Object.fromEntries(
    Object.entries(conflictMap).filter(([, actions]) => actions.length > 1)
  );
});

// ===== 监听用户设置变化 =====
watch(
  () => userSetting.value?.shortcuts,
  (shortcuts) => {
    if (shortcuts) {
      localShortcuts.value = {
        enabled: shortcuts.enabled,
        custom: { ...(shortcuts.custom || {}) },
      };
      originalShortcuts.value = {
        enabled: shortcuts.enabled,
        custom: { ...(shortcuts.custom || {}) },
      };
    }
  },
  { immediate: true, deep: true }
);

// ===== 工具方法 =====
const getShortcutValue = (action: string): string => {
  return localShortcuts.value.custom[action] || '';
};

const formatKeyCombo = (event: KeyboardEvent): string => {
  const parts: string[] = [];
  
  // 使用平台相关的修饰键名称
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push(isMac.value ? 'Cmd' : 'Meta');
  
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    parts.push(event.key.toUpperCase());
  }
  
  return parts.join('+');
};

// 为不同平台格式化快捷键显示
const formatShortcutForPlatform = (shortcut: string): string => {
  if (!shortcut) return '';
  
  let formatted = shortcut;
  
  if (isMac.value) {
    // Mac 平台使用符号
    formatted = formatted
      .replace(/Ctrl/g, '⌃')
      .replace(/Alt/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/Meta/g, '⌘')
      .replace(/Cmd/g, '⌘');
  }
  
  return formatted;
};

// 检查某个动作是否有冲突
const hasConflict = (action: string): boolean => {
  const shortcut = getShortcutValue(action);
  if (!shortcut) return false;
  
  const conflictingActions = conflicts.value[shortcut];
  return conflictingActions && conflictingActions.length > 1;
};

// 获取冲突的快捷键信息
const getConflictingShortcut = (action: string): PredefinedShortcut | undefined => {
  const shortcut = getShortcutValue(action);
  if (!shortcut) return undefined;
  
  const conflictingActions = conflicts.value[shortcut];
  if (!conflictingActions || conflictingActions.length <= 1) return undefined;
  
  // 返回第一个不是当前 action 的冲突项
  const conflictAction = conflictingActions.find((a) => a !== action);
  return predefinedShortcuts.find((s) => s.action === conflictAction);
};

// ===== 事件处理 =====
const handleShortcutChange = async () => {
  if (props.autoSave) {
    // 可以后续添加 updateShortcuts 方法
  }
};

const handleKeyDown = (event: KeyboardEvent, action: string) => {
  event.preventDefault();
  
  const keyCombo = formatKeyCombo(event);
  
  // 至少需要一个修饰键
  if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
    return;
  }
  
  tempKeyValue.value[action] = keyCombo;
  localShortcuts.value.custom[action] = keyCombo;
  recordingAction.value = action;
};

const handleShortcutBlur = async (action: string) => {
  const value = tempKeyValue.value[action];
  
  if (value && props.autoSave) {
    await setShortcut(action, value);
  }
  
  delete tempKeyValue.value[action];
  recordingAction.value = null;
};

const handleClearShortcut = async (action: string) => {
  delete localShortcuts.value.custom[action];
  
  if (props.autoSave) {
    await removeShortcut(action);
  }
};

const handleRestoreDefault = async (action: string, defaultValue: string) => {
  localShortcuts.value.custom[action] = defaultValue;
  
  if (props.autoSave) {
    await setShortcut(action, defaultValue);
  }
};

const handleSaveAll = async () => {
  const promises = Object.entries(localShortcuts.value.custom).map(([action, shortcut]) =>
    setShortcut(action, shortcut)
  );
  
  await Promise.all(promises);
  
  originalShortcuts.value = {
    enabled: localShortcuts.value.enabled,
    custom: { ...localShortcuts.value.custom },
  };
};

const handleReset = () => {
  localShortcuts.value = {
    enabled: originalShortcuts.value.enabled,
    custom: { ...originalShortcuts.value.custom },
  };
};

const handleResetToDefaults = async () => {
  const defaultShortcuts: Record<string, string> = {};
  predefinedShortcuts.forEach(shortcut => {
    defaultShortcuts[shortcut.action] = shortcut.default;
  });
  
  localShortcuts.value.custom = defaultShortcuts;
  
  if (props.autoSave) {
    await handleSaveAll();
  }
};
</script>

<style scoped>
/* Vuetify 组件自带样式，无需额外 CSS */
</style>
