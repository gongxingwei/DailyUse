<template>
  <v-container>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h5 font-weight-medium">{{ t('settings.title') }}</h1>
    </div>
    <v-card class="mb-4">
      <v-card-title>{{ t('settings.general.title') }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select v-model="themeMode" :label="t('settings.general.theme.label')" :items="[
              { title: t('settings.general.theme.system'), value: 'system' },
              { title: t('settings.general.theme.dark'), value: 'dark' },
              { title: t('settings.general.theme.light'), value: 'light' },
              { title: t('settings.general.theme.blueGreen'), value: 'blueGreen' }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>
          <v-col cols="12" md="6">
            <v-select v-model="language" :label="t('settings.general.language.label')" :items="[
              { title: t('settings.general.language.zhCN'), value: 'zh-CN' },
              { title: t('settings.general.language.enUS'), value: 'en-US' }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>
          <v-col cols="12" md="6">
            <v-select v-model="autoLaunch" :label="t('settings.general.autoLaunch.label')" :items="[
              { title: t('settings.general.autoLaunch.on'), value: true },
              { title: t('settings.general.autoLaunch.off'), value: false }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>{{ t('settings.editor.title') }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.fontSize" :label="t('settings.editor.fontSize')"
              :items="[12, 14, 16, 18, 20]" hide-details class="mb-4" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.wordWrap" :label="t('settings.editor.wordWrap.label')" :items="[
              { title: t('settings.editor.wordWrap.on'), value: 'on' },
              { title: t('settings.editor.wordWrap.off'), value: 'off' }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.lineNumbers" :label="t('settings.editor.lineNumbers.label')" :items="[
              { title: t('settings.editor.lineNumbers.show'), value: true },
              { title: t('settings.editor.lineNumbers.hide'), value: false }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.minimap" :label="t('settings.editor.minimap.label')" :items="[
              { title: t('settings.editor.minimap.show'), value: true },
              { title: t('settings.editor.minimap.hide'), value: false }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="settingStore.autoSave" :label="t('settings.editor.autoSave.label')" :items="[
              { title: t('settings.editor.autoSave.on'), value: true },
              { title: t('settings.editor.autoSave.off'), value: false }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.fontFamily" :label="t('settings.editor.fontFamily.label')" :items="[
              { title: t('settings.editor.fontFamily.consolas'), value: 'Consolas, monospace' },
              { title: t('settings.editor.fontFamily.sourceCodePro'), value: 'Source Code Pro, monospace' },
              { title: t('settings.editor.fontFamily.firaCode'), value: 'Fira Code, monospace' },
              { title: t('settings.editor.fontFamily.jetbrainsMono'), value: 'JetBrains Mono, monospace' }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.tabSize" :label="t('settings.editor.tabSize.label')" :items="[2, 4, 8]"
              hide-details class="mb-4" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.autoIndent" :label="t('settings.editor.autoIndent.label')" :items="[
              { title: t('settings.editor.autoIndent.none'), value: 'none' },
              { title: t('settings.editor.autoIndent.keep'), value: 'keep' },
              { title: t('settings.editor.autoIndent.brackets'), value: 'brackets' },
              { title: t('settings.editor.autoIndent.advanced'), value: 'advanced' }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <!-- 自动闭合括号设置 -->
          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.autoClosingBrackets"
              :label="t('settings.editor.autoClosingBrackets.label')" :items="[
                { title: t('settings.editor.autoClosingBrackets.always'), value: 'always' },
                { title: t('settings.editor.autoClosingBrackets.languageDefined'), value: 'languageDefined' },
                { title: t('settings.editor.autoClosingBrackets.beforeWhitespace'), value: 'beforeWhitespace' },
                { title: t('settings.editor.autoClosingBrackets.never'), value: 'never' }
              ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <!-- 显示空格设置 -->
          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.renderWhitespace" :label="t('settings.editor.renderWhitespace.label')"
              :items="[
                { title: t('settings.editor.renderWhitespace.none'), value: 'none' },
                { title: t('settings.editor.renderWhitespace.boundary'), value: 'boundary' },
                { title: t('settings.editor.renderWhitespace.selection'), value: 'selection' },
                { title: t('settings.editor.renderWhitespace.trailing'), value: 'trailing' },
                { title: t('settings.editor.renderWhitespace.all'), value: 'all' }
              ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <!-- 光标样式设置 -->
          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.cursorStyle" :label="t('settings.editor.cursorStyle.label')" :items="[
              { title: t('settings.editor.cursorStyle.line'), value: 'line' },
              { title: t('settings.editor.cursorStyle.block'), value: 'block' },
              { title: t('settings.editor.cursorStyle.underline'), value: 'underline' },
              { title: t('settings.editor.cursorStyle.lineThin'), value: 'line-thin' },
              { title: t('settings.editor.cursorStyle.blockOutline'), value: 'block-outline' },
              { title: t('settings.editor.cursorStyle.underlineThin'), value: 'underline-thin' }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <!-- 光标闪烁设置 -->
          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.cursorBlinking" :label="t('settings.editor.cursorBlinking.label')" :items="[
              { title: t('settings.editor.cursorBlinking.blink'), value: 'blink' },
              { title: t('settings.editor.cursorBlinking.smooth'), value: 'smooth' },
              { title: t('settings.editor.cursorBlinking.phase'), value: 'phase' },
              { title: t('settings.editor.cursorBlinking.expand'), value: 'expand' },
              { title: t('settings.editor.cursorBlinking.solid'), value: 'solid' }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <!-- 其他布尔值选项 -->
          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.smoothScrolling" :label="t('settings.editor.smoothScrolling.label')"
              :items="[
                { title: t('settings.editor.smoothScrolling.on'), value: true },
                { title: t('settings.editor.smoothScrolling.off'), value: false }
              ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.mouseWheelZoom" :label="t('settings.editor.mouseWheelZoom.label')" :items="[
              { title: t('settings.editor.mouseWheelZoom.on'), value: true },
              { title: t('settings.editor.mouseWheelZoom.off'), value: false }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>

          <!-- 行高设置 -->
          <v-col cols="12" md="6">
            <v-select v-model="editorSettings.lineHeight" :label="t('settings.editor.lineHeight.label')"
              :items="[16, 18, 20, 22, 24]" hide-details class="mb-4" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>{{ t('settings.file.title') }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select v-model="settingStore.showHiddenFiles" :label="t('settings.file.showHiddenFiles.label')" :items="[
              { title: t('settings.file.showHiddenFiles.show'), value: true },
              { title: t('settings.file.showHiddenFiles.hide'), value: false }
            ]" item-title="title" item-value="value" hide-details class="mb-4" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>{{ t('settings.about.title') }}</v-card-title>
      <v-card-text>
        <div class="text-body-1">{{ t('settings.about.version') }}</div>
        <div class="text-caption text-medium-emphasis mt-1">
          {{ t('settings.about.description') }}
        </div>
        <v-btn class="mt-4" variant="text" prepend-icon="mdi-github" href="https://github.com/yourusername/dailyuse"
          target="_blank">
          GitHub
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, } from 'vue'
import { useSettingStore } from './settingStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const settingStore = useSettingStore()

const themeMode = computed({
  get: () => settingStore.themeMode,
  set: (value) => {
    settingStore.setTheme(value)
  }
})

const editorSettings = computed({
  get: () => settingStore.editor,
  set: (value) => settingStore.updateEditorSettings(value)
})

const autoLaunch = computed({
  get: () => settingStore.autoLaunch,
  set: (value) => {
    settingStore.setAutoLaunch(value)
  }
})

const language = computed({
  get: () => settingStore.language,
  set: (locale: 'en-US' | 'zh-CN') => {
    settingStore.setLanguage(locale)
  }
})

// 初始化时获取当前开机自启动状态
onMounted(async () => {
  try {
    const isAutoLaunch = await window.shared?.ipcRenderer.invoke('get-auto-launch')
    autoLaunch.value = isAutoLaunch
  } catch (error) {
    console.error('获取开机自启动状态失败:', error)
  }
})

</script>
