<template>
  <v-container fluid class="pa-6">
    <!-- 页面头部 -->
    <div class="page-header mb-8">
      <div class="d-flex align-center mb-4">
        <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
          <v-icon size="24">mdi-cog</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-1">设置</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-0">自定义您的应用体验</p>
        </div>
      </div>
    </div>

    <!-- 通用设置 -->
    <v-card class="settings-card mb-6" elevation="2">
      <v-card-title class="settings-section-title">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-3">mdi-tune</v-icon>
          <span>通用设置</span>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-palette</v-icon>
                <span class="font-weight-medium">主题模式</span>
              </div>
              <v-select
                :model-value="currentThemeId"
                @update:model-value="handleThemeChange"
                :items="availableThemeOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                :loading="themeStore.loading.applying"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon" :color="item.raw.color"></v-icon>
                    </template>
                    <template #append>
                      <v-chip
                        v-if="item.raw.isBuiltIn"
                        size="x-small"
                        color="primary"
                        variant="outlined"
                      >
                        系统
                      </v-chip>
                      <v-chip
                        v-else-if="item.raw.isActive"
                        size="x-small"
                        color="success"
                        variant="flat"
                      >
                        当前
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon size="16" class="mr-2" :color="item.raw.color">{{
                      item.raw.icon
                    }}</v-icon>
                    {{ item.title }}
                  </div>
                </template>
              </v-select>

              <!-- 主题演示按钮 -->
              <div class="mt-3">
                <v-btn
                  variant="outlined"
                  color="primary"
                  size="small"
                  prepend-icon="mdi-eye"
                  @click="$router.push('/settings/themes')"
                >
                  主题预览与演示
                </v-btn>
              </div>
            </div>
          </v-col>

          <!-- 主题配置选项 -->
          <v-col cols="12">
            <v-divider class="my-4"></v-divider>
            <h4 class="text-subtitle-1 font-weight-medium mb-4 d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-cog-outline</v-icon>
              主题配置
            </h4>

            <v-row>
              <v-col cols="12" md="6" lg="4">
                <v-card variant="outlined" class="pa-4 switch-card">
                  <div class="d-flex align-center justify-space-between">
                    <div class="flex-grow-1">
                      <div class="d-flex align-center mb-1">
                        <v-icon
                          size="20"
                          class="mr-2"
                          :color="
                            themeStore.config?.followSystemTheme ? 'primary' : 'medium-emphasis'
                          "
                        >
                          mdi-monitor
                        </v-icon>
                        <span class="font-weight-medium">跟随系统</span>
                      </div>
                      <p class="text-caption text-medium-emphasis mb-0">自动根据系统主题切换</p>
                    </div>
                    <v-switch
                      :model-value="themeStore.config?.followSystemTheme"
                      @update:model-value="handleFollowSystemChange"
                      color="primary"
                      density="compact"
                      hide-details
                      :loading="themeStore.loading.config"
                    />
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6" lg="4">
                <v-card variant="outlined" class="pa-4 switch-card">
                  <div class="d-flex align-center justify-space-between">
                    <div class="flex-grow-1">
                      <div class="d-flex align-center mb-1">
                        <v-icon
                          size="20"
                          class="mr-2"
                          :color="
                            themeStore.config?.enableTransitions ? 'primary' : 'medium-emphasis'
                          "
                        >
                          mdi-transition
                        </v-icon>
                        <span class="font-weight-medium">动画过渡</span>
                      </div>
                      <p class="text-caption text-medium-emphasis mb-0">主题切换时的动画效果</p>
                    </div>
                    <v-switch
                      :model-value="themeStore.config?.enableTransitions"
                      @update:model-value="handleTransitionChange"
                      color="primary"
                      density="compact"
                      hide-details
                      :loading="themeStore.loading.config"
                    />
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6" lg="4">
                <v-card variant="outlined" class="pa-4 switch-card">
                  <div class="d-flex align-center justify-space-between">
                    <div class="flex-grow-1">
                      <div class="d-flex align-center mb-1">
                        <v-icon
                          size="20"
                          class="mr-2"
                          :color="
                            themeStore.config?.autoSwitchTheme ? 'primary' : 'medium-emphasis'
                          "
                        >
                          mdi-clock-outline
                        </v-icon>
                        <span class="font-weight-medium">定时切换</span>
                      </div>
                      <p class="text-caption text-medium-emphasis mb-0">根据时间自动切换主题</p>
                    </div>
                    <v-switch
                      :model-value="themeStore.config?.autoSwitchTheme"
                      @update:model-value="handleAutoSwitchChange"
                      color="primary"
                      density="compact"
                      hide-details
                      :loading="themeStore.loading.config"
                    />
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>

          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-translate</v-icon>
                <span class="font-weight-medium">语言</span>
              </div>
              <v-select
                v-model="language"
                :items="languageOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon"></v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 编辑器设置 -->
    <v-card class="settings-card mb-6" elevation="2">
      <v-card-title class="settings-section-title">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-3">mdi-code-braces</v-icon>
          <span>编辑器设置</span>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row>
          <!-- 字体大小 -->
          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-format-size</v-icon>
                <span class="font-weight-medium">字体大小</span>
              </div>
              <v-select
                v-model="editorSettings.fontSize"
                :items="[12, 14, 16, 18, 20]"
                variant="outlined"
                density="comfortable"
                hide-details
              >
                <template #selection="{ item }"> {{ item.value }}px </template>
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>{{ item.value }}px</v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>
            </div>
          </v-col>

          <!-- 字体系列 -->
          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-format-font</v-icon>
                <span class="font-weight-medium">字体</span>
              </div>
              <v-select
                v-model="editorSettings.fontFamily"
                :items="fontFamilyOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </div>
          </v-col>

          <!-- 行高 -->
          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-format-line-height</v-icon>
                <span class="font-weight-medium">行高</span>
              </div>
              <v-select
                v-model="editorSettings.lineHeight"
                :items="[16, 18, 20, 22, 24]"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </div>
          </v-col>

          <!-- Tab 大小 -->
          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-keyboard-tab</v-icon>
                <span class="font-weight-medium">Tab 大小</span>
              </div>
              <v-select
                v-model="editorSettings.tabSize"
                :items="[2, 4, 8]"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </div>
          </v-col>
        </v-row>

        <!-- 开关选项 -->
        <v-divider class="my-6"></v-divider>

        <div class="mb-4">
          <h3 class="text-h6 font-weight-medium mb-4 d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-toggle-switch</v-icon>
            功能开关
          </h3>

          <v-row>
            <v-col cols="12" md="6" lg="4" v-for="setting in booleanSettings" :key="setting.key">
              <v-card variant="outlined" class="pa-4 switch-card">
                <div class="d-flex align-center justify-space-between">
                  <div class="flex-grow-1">
                    <div class="d-flex align-center mb-1">
                      <v-icon
                        size="20"
                        class="mr-2"
                        :color="getSettingValue(setting.key) ? 'primary' : 'medium-emphasis'"
                      >
                        {{ setting.icon }}
                      </v-icon>
                      <span class="font-weight-medium">{{ setting.label }}</span>
                    </div>
                    <p class="text-caption text-medium-emphasis mb-0">{{ setting.description }}</p>
                  </div>
                  <v-switch
                    v-model="editorSettings[setting.key]"
                    color="primary"
                    density="compact"
                    hide-details
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 高级选项 -->
        <v-divider class="my-6"></v-divider>

        <div>
          <h3 class="text-h6 font-weight-medium mb-4 d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-cog-outline</v-icon>
            高级选项
          </h3>

          <v-row>
            <v-col cols="12" md="6">
              <div class="setting-item">
                <div class="setting-label mb-2">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-wrap</v-icon>
                  <span class="font-weight-medium">自动换行</span>
                </div>
                <v-select
                  v-model="editorSettings.wordWrap"
                  :items="[
                    { title: '开启', value: 'on' },
                    { title: '关闭', value: 'off' },
                  ]"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="setting-item">
                <div class="setting-label mb-2">
                  <v-icon size="20" class="mr-2 text-medium-emphasis"
                    >mdi-format-indent-increase</v-icon
                  >
                  <span class="font-weight-medium">自动缩进</span>
                </div>
                <v-select
                  v-model="editorSettings.autoIndent"
                  :items="autoIndentOptions"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="setting-item">
                <div class="setting-label mb-2">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-cursor-default</v-icon>
                  <span class="font-weight-medium">光标样式</span>
                </div>
                <v-select
                  v-model="editorSettings.cursorStyle"
                  :items="cursorStyleOptions"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="setting-item">
                <div class="setting-label mb-2">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-image-plus</v-icon>
                  <span class="font-weight-medium">插入图片方式</span>
                </div>
                <v-select
                  v-model="editorSettings.insertImage"
                  :items="[
                    { title: '嵌入图片', value: 'embed' },
                    { title: '链接图片', value: 'link' },
                  ]"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <!-- 文件设置 -->
    <v-card class="settings-card mb-6" elevation="2">
      <v-card-title class="settings-section-title">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-3">mdi-file</v-icon>
          <span>文件设置</span>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <div class="setting-item">
          <v-card variant="outlined" class="pa-4 switch-card">
            <div class="d-flex align-center justify-space-between">
              <div class="flex-grow-1">
                <div class="d-flex align-center mb-1">
                  <v-icon
                    size="20"
                    class="mr-2"
                    :color="settingStore.showHiddenFiles ? 'primary' : 'medium-emphasis'"
                  >
                    mdi-eye
                  </v-icon>
                  <span class="font-weight-medium">显示隐藏文件</span>
                </div>
                <p class="text-caption text-medium-emphasis mb-0">显示以点开头的隐藏文件和文件夹</p>
              </div>
              <v-switch
                v-model="settingStore.showHiddenFiles"
                color="primary"
                density="compact"
                hide-details
              />
            </div>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useSettingStore } from '../stores/settingStore';
import { useThemeStore } from '../../../theme/themeStroe';
import type { IThemeDefinition } from '@dailyuse/contracts';

const settingStore = useSettingStore();
const themeStore = useThemeStore();

// 主题相关计算属性
const currentThemeId = computed(() => themeStore.activeTheme?.id || '');

const availableThemeOptions = computed(() => {
  return themeStore.themes.map((theme) => ({
    title: theme.name,
    value: theme.id,
    icon: getThemeIconByType(theme.type),
    color: getThemeColorByType(theme.type),
    isBuiltIn: theme.isBuiltIn,
    isActive: theme.id === themeStore.activeTheme?.id,
  }));
});

// 主题相关方法
function getThemeIconByType(type: string): string {
  switch (type) {
    case 'light':
      return 'mdi-weather-sunny';
    case 'dark':
      return 'mdi-weather-night';
    case 'auto':
      return 'mdi-monitor';
    case 'custom':
      return 'mdi-palette';
    default:
      return 'mdi-help-circle';
  }
}

function getThemeColorByType(type: string): string {
  switch (type) {
    case 'light':
      return 'orange';
    case 'dark':
      return 'blue-grey';
    case 'auto':
      return 'primary';
    case 'custom':
      return 'purple';
    default:
      return 'grey';
  }
}

async function handleThemeChange(themeId: string) {
  try {
    await themeStore.applyTheme(themeId);
  } catch (error) {
    console.error('切换主题失败:', error);
  }
}

async function handleFollowSystemChange(enabled: boolean) {
  try {
    await themeStore.updateConfig({ followSystemTheme: enabled });

    if (enabled) {
      await themeStore.switchToSystemTheme();
    }
  } catch (error) {
    console.error('更新系统跟随设置失败:', error);
  }
}

async function handleTransitionChange(enabled: boolean) {
  try {
    await themeStore.updateConfig({ enableTransitions: enabled });
  } catch (error) {
    console.error('更新动画设置失败:', error);
  }
}

async function handleAutoSwitchChange(enabled: boolean) {
  try {
    await themeStore.updateConfig({ autoSwitchTheme: enabled });
  } catch (error) {
    console.error('更新定时切换设置失败:', error);
  }
}

// 语言选项
const languageOptions = [
  { title: '中文', value: 'zh-CN', icon: 'mdi-flag' },
  { title: 'English', value: 'en-US', icon: 'mdi-flag-outline' },
];

// 字体选项
const fontFamilyOptions = [
  { title: 'Consolas', value: 'Consolas, monospace' },
  { title: 'Source Code Pro', value: 'Source Code Pro, monospace' },
  { title: 'Fira Code', value: 'Fira Code, monospace' },
  { title: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
];

// 自动缩进选项
const autoIndentOptions = [
  { title: '无', value: 'none' },
  { title: '保持', value: 'keep' },
  { title: '括号', value: 'brackets' },
  { title: '高级', value: 'advanced' },
];

// 光标样式选项
const cursorStyleOptions = [
  { title: '线条', value: 'line' },
  { title: '块状', value: 'block' },
  { title: '下划线', value: 'underline' },
  { title: '细线', value: 'line-thin' },
  { title: '块状轮廓', value: 'block-outline' },
  { title: '细下划线', value: 'underline-thin' },
];

// 布尔设置项配置
const booleanSettings = [
  {
    key: 'lineNumbers',
    icon: 'mdi-format-list-numbered',
    label: '行号',
    description: '在编辑器左侧显示行号',
  },
  {
    key: 'minimap',
    icon: 'mdi-map',
    label: '缩略图',
    description: '显示代码缩略图',
  },
  {
    key: 'autoSave',
    icon: 'mdi-content-save-auto',
    label: '自动保存',
    description: '自动保存文件更改',
  },
  {
    key: 'smoothScrolling',
    icon: 'mdi-arrow-up-down',
    label: '平滑滚动',
    description: '启用平滑滚动效果',
  },
  {
    key: 'mouseWheelZoom',
    icon: 'mdi-magnify',
    label: '鼠标滚轮缩放',
    description: 'Ctrl + 滚轮缩放',
  },
];

// 保持原有设置Store的功能
const editorSettings = computed({
  get: () => settingStore.editor,
  set: (value) => settingStore.updateEditorSettings(value),
});

const language = computed({
  get: () => settingStore.language,
  set: (locale: 'en-US' | 'zh-CN') => {
    settingStore.setLanguage(locale);
  },
});

// 保持兼容的方法
const getSettingValue = (key: string) => {
  return settingStore.editor[key as keyof typeof settingStore.editor];
};

// 初始化
onMounted(async () => {
  // 初始化原有设置
  await settingStore.initializeSettings();

  // 初始化新的主题系统
  try {
    await themeStore.initialize();
  } catch (error) {
    console.error('主题系统初始化失败:', error);
  }
});
</script>

<style scoped>
.page-header {
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-secondary), 0.05) 100%
  );
  padding: 2rem;
  margin-bottom: 2rem;
}

.settings-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}

.settings-section-title {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-primary), 0.02) 100%
  );
  font-size: 1.25rem;
  font-weight: 600;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-label {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface));
}

.switch-card {
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.switch-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  background-color: rgba(var(--v-theme-primary), 0.02);
}

/* 深色主题适配 */
.v-theme--dark .page-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.1) 0%,
    rgba(var(--v-theme-secondary), 0.1) 100%
  );
}

.v-theme--dark .settings-section-title {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.12) 0%,
    rgba(var(--v-theme-primary), 0.04) 100%
  );
}

.v-theme--dark .switch-card:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .settings-section-title {
    padding: 1rem;
  }
}
</style>
