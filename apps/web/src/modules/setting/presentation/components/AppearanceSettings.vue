<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h3 class="text-h5 mb-4">
          <v-icon class="mr-2">mdi-palette</v-icon>
          外观设置
        </h3>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-list lines="two">
          <!-- 主题设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-theme-light-dark</v-icon>
            </template>
            <v-list-item-title>主题模式</v-list-item-title>
            <v-list-item-subtitle>选择您偏好的主题模式</v-list-item-subtitle>
            <template v-slot:append>
              <v-select
                v-model="localAppearance.theme"
                :items="themeOptions"
                item-title="text"
                item-value="value"
                density="compact"
                style="max-width: 150px"
                hide-details
                @update:model-value="handleThemeChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 强调色设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-palette-swatch</v-icon>
            </template>
            <v-list-item-title>强调色</v-list-item-title>
            <v-list-item-subtitle>自定义界面的强调色</v-list-item-subtitle>
            <template v-slot:append>
              <div class="d-flex align-center ga-2">
                <input
                  v-model="localAppearance.accentColor"
                  type="color"
                  class="color-picker"
                  @change="handleAccentColorChange"
                  :disabled="loading"
                />
                <v-chip size="small" variant="outlined">
                  {{ localAppearance.accentColor }}
                </v-chip>
              </div>
            </template>
          </v-list-item>

          <v-divider />

          <!-- 字体大小设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-format-size</v-icon>
            </template>
            <v-list-item-title>字体大小</v-list-item-title>
            <v-list-item-subtitle>调整界面文字大小</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn-toggle
                v-model="localAppearance.fontSize"
                mandatory
                density="compact"
                @update:model-value="handleFontSizeChange"
                :disabled="loading"
              >
                <v-btn value="SMALL" size="small">小</v-btn>
                <v-btn value="MEDIUM" size="small">中</v-btn>
                <v-btn value="LARGE" size="small">大</v-btn>
              </v-btn-toggle>
            </template>
          </v-list-item>

          <v-divider />

          <!-- 字体家族设置 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-format-font</v-icon>
            </template>
            <v-list-item-title>字体</v-list-item-title>
            <v-list-item-subtitle>选择显示字体（可选）</v-list-item-subtitle>
            <template v-slot:append>
              <v-text-field
                v-model="localAppearance.fontFamily"
                placeholder="系统默认"
                density="compact"
                style="max-width: 200px"
                hide-details
                @blur="handleFontFamilyChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>

          <v-divider />

          <!-- 紧凑模式 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-arrow-collapse-vertical</v-icon>
            </template>
            <v-list-item-title>紧凑模式</v-list-item-title>
            <v-list-item-subtitle>减少界面元素间距</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localAppearance.compactMode"
                color="primary"
                hide-details
                @update:model-value="handleCompactModeChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>
        </v-list>
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
        <v-btn variant="outlined" @click="handleReset" :disabled="loading"> 重置 </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserSetting } from '../composables/useUserSetting';
import { type SettingContracts } from '@dailyuse/contracts';

// ===== Props =====
const props = defineProps<{
  autoSave?: boolean; // 是否自动保存
}>();

// ===== Composables =====
const { userSetting, loading, updateAppearance, switchTheme } = useUserSetting();

// ===== 本地状态 =====
const localAppearance = ref<SettingContracts.UpdateAppearanceRequest>({
  theme: 'LIGHT',
  accentColor: '#1976d2',
  fontSize: 'MEDIUM',
  fontFamily: null,
  compactMode: false,
});

const originalAppearance = ref<SettingContracts.UpdateAppearanceRequest>({});

// ===== 选项配置 =====
const themeOptions = [
  { value: 'LIGHT', text: '浅色' },
  { value: 'DARK', text: '深色' },
  { value: 'AUTO', text: '自动' },
];

const fontSizes = [
  { value: 'SMALL', label: '小' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LARGE', label: '大' },
];

// ===== 计算属性 =====
const hasChanges = computed(() => {
  return JSON.stringify(localAppearance.value) !== JSON.stringify(originalAppearance.value);
});

// ===== 监听用户设置变化 =====
watch(
  () => userSetting.value?.appearance,
  (appearance) => {
    if (appearance) {
      localAppearance.value = {
        theme: appearance.theme as 'LIGHT' | 'DARK' | 'AUTO',
        accentColor: appearance.accentColor,
        fontSize: appearance.fontSize as 'SMALL' | 'MEDIUM' | 'LARGE',
        fontFamily: appearance.fontFamily,
        compactMode: appearance.compactMode,
      };
      originalAppearance.value = {
        theme: appearance.theme as 'LIGHT' | 'DARK' | 'AUTO',
        accentColor: appearance.accentColor,
        fontSize: appearance.fontSize as 'SMALL' | 'MEDIUM' | 'LARGE',
        fontFamily: appearance.fontFamily,
        compactMode: appearance.compactMode,
      };
    }
  },
  { immediate: true, deep: true },
);

// ===== 事件处理 =====

/**
 * 主题变化处理
 */
const handleThemeChange = async () => {
  if (props.autoSave && localAppearance.value.theme) {
    await switchTheme(localAppearance.value.theme);
  }
};

/**
 * 强调色变化处理
 */
const handleAccentColorChange = async () => {
  if (props.autoSave) {
    await updateAppearance({ accentColor: localAppearance.value.accentColor });
  }
};

/**
 * 字体大小变化处理
 */
const handleFontSizeChange = async () => {
  if (props.autoSave && localAppearance.value.fontSize) {
    await updateAppearance({ fontSize: localAppearance.value.fontSize });
  }
};

/**
 * 字体家族变化处理
 */
const handleFontFamilyChange = async () => {
  if (props.autoSave) {
    await updateAppearance({ fontFamily: localAppearance.value.fontFamily || null });
  }
};

/**
 * 紧凑模式变化处理
 */
const handleCompactModeChange = async () => {
  if (props.autoSave) {
    await updateAppearance({ compactMode: localAppearance.value.compactMode });
  }
};

/**
 * 保存所有更改
 */
const handleSaveAll = async () => {
  await updateAppearance(localAppearance.value);
  originalAppearance.value = { ...localAppearance.value };
};

/**
 * 重置为原始值
 */
const handleReset = () => {
  localAppearance.value = { ...originalAppearance.value };
};
</script>

<style scoped>
.color-picker {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  cursor: pointer;
}

.color-picker:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
