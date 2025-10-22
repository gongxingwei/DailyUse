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
        <h4 class="text-h6 mb-3">自定义快捷键</h4>

        <v-list lines="two" class="mb-4">
          <v-list-item
            v-for="shortcut in predefinedShortcuts"
            :key="shortcut.action"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" variant="tonal">
                <span>{{ shortcut.icon }}</span>
              </v-avatar>
            </template>

            <v-list-item-title>{{ shortcut.label }}</v-list-item-title>
            <v-list-item-subtitle>{{ shortcut.description }}</v-list-item-subtitle>

            <template v-slot:append>
              <div class="d-flex align-center ga-2">
                <v-text-field
                  :model-value="getShortcutValue(shortcut.action)"
                  :placeholder="shortcut.default"
                  density="compact"
                  variant="outlined"
                  readonly
                  style="max-width: 160px; font-family: monospace;"
                  hide-details
                  @keydown.prevent="(e: any) => handleKeyDown(e, shortcut.action)"
                  @blur="() => handleShortcutBlur(shortcut.action)"
                  :disabled="loading"
                >
                  <template v-slot:append-inner>
                    <v-btn
                      v-if="getShortcutValue(shortcut.action)"
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      @click="() => handleClearShortcut(shortcut.action)"
                      :disabled="loading"
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

// ===== 计算属性 =====
const hasChanges = computed(() => {
  return JSON.stringify(localShortcuts.value) !== JSON.stringify(originalShortcuts.value);
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
  
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');
  
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    parts.push(event.key.toUpperCase());
  }
  
  return parts.join('+');
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
  
  if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
    return;
  }
  
  tempKeyValue.value[action] = keyCombo;
  localShortcuts.value.custom[action] = keyCombo;
};

const handleShortcutBlur = async (action: string) => {
  const value = tempKeyValue.value[action];
  
  if (value && props.autoSave) {
    await setShortcut(action, value);
  }
  
  delete tempKeyValue.value[action];
};

const handleClearShortcut = async (action: string) => {
  delete localShortcuts.value.custom[action];
  
  if (props.autoSave) {
    await removeShortcut(action);
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
