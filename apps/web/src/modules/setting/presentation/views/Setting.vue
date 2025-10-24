<template>
  <v-container fluid class="pa-6">
    <!-- 页面头部 -->
    <div class="page-header mb-8">
      <div class="d-flex align-center mb-4">
        <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
          <v-icon size="24">mdi-cog</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold text-primary mb-1">{{ t('settings.title') }}</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-0">自定义您的应用体验</p>
        </div>
      </div>
    </div>

    <!-- 通用设置 -->
    <v-card class="settings-card mb-6" elevation="2">
      <v-card-title class="settings-section-title">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-3">mdi-tune</v-icon>
          <span>{{ t('settings.general.title') }}</span>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-palette</v-icon>
                <span class="font-weight-medium">{{ t('settings.general.theme.label') }}</span>
              </div>
              <v-select
                v-model="themeMode"
                :items="[
                  {
                    title: t('settings.general.theme.system'),
                    value: 'system',
                    icon: 'mdi-monitor',
                  },
                  {
                    title: t('settings.general.theme.dark'),
                    value: 'dark',
                    icon: 'mdi-weather-night',
                  },
                  {
                    title: t('settings.general.theme.light'),
                    value: 'light',
                    icon: 'mdi-weather-sunny',
                  },
                  {
                    title: t('settings.general.theme.blueGreen'),
                    value: 'blueGreen',
                    icon: 'mdi-water',
                  },
                ]"
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
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon size="16" class="mr-2">{{ getThemeIcon(item.value) }}</v-icon>
                    {{ item.title }}
                  </div>
                </template>
              </v-select>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-translate</v-icon>
                <span class="font-weight-medium">{{ t('settings.general.language.label') }}</span>
              </div>
              <v-select
                v-model="language"
                :items="[
                  { title: t('settings.general.language.zhCN'), value: 'zh-CN', icon: 'mdi-flag' },
                  {
                    title: t('settings.general.language.enUS'),
                    value: 'en-US',
                    icon: 'mdi-flag-outline',
                  },
                ]"
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

          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-rocket-launch</v-icon>
                <span class="font-weight-medium">{{ t('settings.general.autoLaunch.label') }}</span>
              </div>
              <v-switch
                v-model="autoLaunch"
                color="primary"
                density="comfortable"
                hide-details
                :true-value="true"
                :false-value="false"
              >
                <template #label>
                  <span class="text-body-2">{{
                    autoLaunch
                      ? t('settings.general.autoLaunch.on')
                      : t('settings.general.autoLaunch.off')
                  }}</span>
                </template>
              </v-switch>
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
          <span>{{ t('settings.editor.title') }}</span>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row>
          <!-- 字体大小 -->
          <v-col cols="12" md="6">
            <div class="setting-item">
              <div class="setting-label mb-2">
                <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-format-size</v-icon>
                <span class="font-weight-medium">{{ t('settings.editor.fontSize') }}</span>
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
                <span class="font-weight-medium">{{ t('settings.editor.fontFamily.label') }}</span>
              </div>
              <v-select
                v-model="editorSettings.fontFamily"
                :items="[
                  { title: t('settings.editor.fontFamily.consolas'), value: 'Consolas, monospace' },
                  {
                    title: t('settings.editor.fontFamily.sourceCodePro'),
                    value: 'Source Code Pro, monospace',
                  },
                  {
                    title: t('settings.editor.fontFamily.firaCode'),
                    value: 'Fira Code, monospace',
                  },
                  {
                    title: t('settings.editor.fontFamily.jetbrainsMono'),
                    value: 'JetBrains Mono, monospace',
                  },
                ]"
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
                <span class="font-weight-medium">{{ t('settings.editor.lineHeight.label') }}</span>
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
                <span class="font-weight-medium">{{ t('settings.editor.tabSize.label') }}</span>
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
                        :color="
                          editorSettings[setting.key as keyof typeof editorSettings]
                            ? 'primary'
                            : 'medium-emphasis'
                        "
                      >
                        {{ setting.icon }}
                      </v-icon>
                      <span class="font-weight-medium">{{ setting.label }}</span>
                    </div>
                    <p class="text-caption text-medium-emphasis mb-0">{{ setting.description }}</p>
                  </div>
                  <v-switch
                    v-model="editorSettings[setting.key as keyof typeof editorSettings]"
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
                  <span class="font-weight-medium">{{ t('settings.editor.wordWrap.label') }}</span>
                </div>
                <v-select
                  v-model="editorSettings.wordWrap"
                  :items="[
                    { title: t('settings.editor.wordWrap.on'), value: 'on' },
                    { title: t('settings.editor.wordWrap.off'), value: 'off' },
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
                  <span class="font-weight-medium">{{
                    t('settings.editor.autoIndent.label')
                  }}</span>
                </div>
                <v-select
                  v-model="editorSettings.autoIndent"
                  :items="[
                    { title: t('settings.editor.autoIndent.none'), value: 'none' },
                    { title: t('settings.editor.autoIndent.keep'), value: 'keep' },
                    { title: t('settings.editor.autoIndent.brackets'), value: 'brackets' },
                    { title: t('settings.editor.autoIndent.advanced'), value: 'advanced' },
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
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-cursor-default</v-icon>
                  <span class="font-weight-medium">{{
                    t('settings.editor.cursorStyle.label')
                  }}</span>
                </div>
                <v-select
                  v-model="editorSettings.cursorStyle"
                  :items="[
                    { title: t('settings.editor.cursorStyle.line'), value: 'line' },
                    { title: t('settings.editor.cursorStyle.block'), value: 'block' },
                    { title: t('settings.editor.cursorStyle.underline'), value: 'underline' },
                    { title: t('settings.editor.cursorStyle.lineThin'), value: 'line-thin' },
                    {
                      title: t('settings.editor.cursorStyle.blockOutline'),
                      value: 'block-outline',
                    },
                    {
                      title: t('settings.editor.cursorStyle.underlineThin'),
                      value: 'underline-thin',
                    },
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
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-image-plus</v-icon>
                  <span class="font-weight-medium">{{
                    t('settings.editor.insertImage.label')
                  }}</span>
                </div>
                <v-select
                  v-model="editorSettings.insertImage"
                  :items="[
                    { title: t('settings.editor.insertImage.embed'), value: 'embed' },
                    { title: t('settings.editor.insertImage.link'), value: 'link' },
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
          <span>{{ t('settings.file.title') }}</span>
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
                  <span class="font-weight-medium">{{
                    t('settings.file.showHiddenFiles.label')
                  }}</span>
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
import { computed, onMounted } from 'vue';
import { useSettingStore } from '../stores/settingStore';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const settingStore = useSettingStore();

// 布尔设置项配置
const booleanSettings = [
  {
    key: 'lineNumbers',
    icon: 'mdi-format-list-numbered',
    label: t('settings.editor.lineNumbers.label'),
    description: '在编辑器左侧显示行号',
  },
  {
    key: 'minimap',
    icon: 'mdi-map',
    label: t('settings.editor.minimap.label'),
    description: '显示代码缩略图',
  },
  {
    key: 'autoSave',
    icon: 'mdi-content-save-auto',
    label: t('settings.editor.autoSave.label'),
    description: '自动保存文件更改',
  },
  {
    key: 'smoothScrolling',
    icon: 'mdi-arrow-up-down',
    label: t('settings.editor.smoothScrolling.label'),
    description: '启用平滑滚动效果',
  },
  {
    key: 'mouseWheelZoom',
    icon: 'mdi-magnify',
    label: t('settings.editor.mouseWheelZoom.label'),
    description: 'Ctrl + 滚轮缩放',
  },
];

// 计算属性
const themeMode = computed({
  get: () => settingStore.themeMode,
  set: (value) => {
    settingStore.setTheme(value);
  },
});

const editorSettings = computed({
  get: () => settingStore.editor,
  set: (value) => settingStore.updateEditorSettings(value),
});

const autoLaunch = computed({
  get: () => settingStore.autoLaunch,
  set: (value) => {
    settingStore.setAutoLaunch(value);
  },
});

const language = computed({
  get: () => settingStore.language,
  set: (locale: 'en-US' | 'zh-CN') => {
    settingStore.setLanguage(locale);
  },
});

// 方法
const getThemeIcon = (theme: string) => {
  const icons: Record<string, string> = {
    system: 'mdi-monitor',
    dark: 'mdi-weather-night',
    light: 'mdi-weather-sunny',
    blueGreen: 'mdi-water',
  };

  return icons[theme] || 'mdi-monitor';
};
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
