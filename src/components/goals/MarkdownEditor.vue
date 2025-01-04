<template>
  <div class="markdown-editor">
    <v-toolbar density="compact" color="surface">
      <v-btn icon @click="saveContent">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
      <v-divider vertical class="mx-2"></v-divider>
      <v-btn-toggle v-model="viewMode" mandatory>
        <v-btn value="edit" icon="mdi-pencil"></v-btn>
        <v-btn value="preview" icon="mdi-eye"></v-btn>
        <v-btn value="split" icon="mdi-view-split-vertical"></v-btn>
      </v-btn-toggle>
    </v-toolbar>

    <div class="editor-container" :class="viewMode">
      <div class="edit-area" v-show="viewMode !== 'preview'" ref="editorContainer"></div>
      <div class="preview-area markdown-body" v-show="viewMode !== 'edit'" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as monaco from 'monaco-editor'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css'

const props = defineProps<{
  filePath: string | undefined
}>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const content = ref('')
const viewMode = ref('edit')
const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | undefined

const renderedContent = computed(() => {
  return md.render(content.value)
})

// 监听文件路径变化
watch(() => props.filePath, async (newPath) => {
  if (newPath) {
    try {
      const fileContent = await window.electron.readFile(newPath)
      content.value = fileContent
      editor?.setValue(fileContent)
    } catch (error) {
      console.error('读取文件失败:', error)
      content.value = ''
      editor?.setValue('')
    }
  } else {
    content.value = ''
    editor?.setValue('')
  }
}, { immediate: true })

// 保存内容
const saveContent = async () => {
  if (props.filePath) {
    try {
      const currentContent = editor?.getValue() || ''
      await window.electron.writeFile(props.filePath, currentContent)
    } catch (error) {
      console.error('保存文件失败:', error)
      alert('保存失败')
    }
  }
}

// 初始化编辑器
onMounted(() => {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: content.value,
      language: 'markdown',
      theme: 'vs-dark',
      minimap: { enabled: true },
      wordWrap: 'on',
      lineNumbers: 'on',
      renderWhitespace: 'boundary',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14
    })

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      content.value = editor?.getValue() || ''
    })

    // 添加快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveContent)
  }
})

// 销毁编辑器
onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<style scoped>
.markdown-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-container.edit .edit-area {
  width: 100%;
}

.editor-container.preview .preview-area {
  width: 100%;
}

.editor-container.split .edit-area,
.editor-container.split .preview-area {
  width: 50%;
}

.edit-area, .preview-area {
  height: 100%;
  overflow: auto;
}

.preview-area {
  padding: 16px;
  border-left: 1px solid rgba(128, 128, 128, 0.2);
}

:deep(.markdown-body) {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  padding: 45px;
}
</style> 