<template>
  <v-container>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h5 font-weight-medium">设置</h1>
    </div>

    <v-card class="mb-4">
      <v-card-title>外观</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-switch
              v-model="isDark"
              label="深色模式"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
          <v-col cols="12">
            <v-select
              v-model="settingStore.language"
              label="语言"
              :items="[
                { title: '简体中文', value: 'zh-CN' },
                { title: 'English', value: 'en-US' }
              ]"
              item-title="title"
              item-value="value"
              hide-details
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>编辑器</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="editorSettings.fontSize"
              label="字体大小"
              :items="[12, 14, 16, 18, 20]"
              hide-details
              class="mb-4"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="editorSettings.wordWrap"
              label="自动换行"
              :items="[
                { title: '开启', value: 'on' },
                { title: '关闭', value: 'off' }
              ]"
              item-title="title"
              item-value="value"
              hide-details
              class="mb-4"
            ></v-select>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <v-switch
          v-model="editorSettings.lineNumbers"
          label="显示行号"
          color="primary"
          hide-details
          class="mb-2"
        ></v-switch>

        <v-switch
          v-model="editorSettings.minimap"
          label="显示小地图"
          color="primary"
          hide-details
        ></v-switch>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>文件</v-card-title>
      <v-card-text>
        <v-switch
          v-model="settingStore.autoSave"
          label="自动保存"
          color="primary"
          hide-details
          class="mb-2"
        ></v-switch>

        <v-switch
          v-model="settingStore.showHiddenFiles"
          label="显示隐藏文件"
          color="primary"
          hide-details
        ></v-switch>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>关于</v-card-title>
      <v-card-text>
        <div class="text-body-1">DailyUse v1.0.0</div>
        <div class="text-caption text-medium-emphasis mt-1">
          一个简单的个人知识管理工具
        </div>
        <v-btn
          class="mt-4"
          variant="text"
          prepend-icon="mdi-github"
          href="https://github.com/yourusername/dailyuse"
          target="_blank"
        >
          GitHub
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingStore } from '../stores/setting'

const settingStore = useSettingStore()

const isDark = computed({
  get: () => settingStore.theme === 'dark',
  set: (value) => settingStore.theme = value ? 'dark' : 'light'
})

const editorSettings = computed({
  get: () => settingStore.editor,
  set: (value) => settingStore.updateEditorSettings(value)
})
</script>
