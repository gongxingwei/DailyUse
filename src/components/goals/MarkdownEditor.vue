<template>
  <div class="markdown-editor">
    <v-toolbar density="compact" color="surface">
      <v-btn icon @click="saveContent" :disabled="!props.filePath">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
      <v-divider vertical class="mx-2"></v-divider>
      <v-btn-toggle v-model="viewMode" mandatory>
        <v-btn value="edit" icon="mdi-pencil"></v-btn>
        <v-btn value="preview" icon="mdi-eye"></v-btn>
        <v-btn value="split" icon="mdi-view-split-vertical"></v-btn>
      </v-btn-toggle>
      <v-spacer></v-spacer>
      <div v-if="props.filePath" class="text-caption">
        {{ electron.path.basename(props.filePath) }}
      </div>
    </v-toolbar>

    <div class="editor-container" :class="viewMode">
      <div class="edit-area" v-show="viewMode !== 'preview'">
        <MonacoEditor
          v-model:value="content"
          :options="editorOptions"
          theme="vs-dark"
          language="markdown"
          @keydown.ctrl.s.prevent="saveContent"
          @keydown.meta.s.prevent="saveContent"
        />
      </div>
      <div class="preview-area markdown-body" v-show="viewMode !== 'edit'" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import MonacoEditor from 'monaco-editor-vue3'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css'

const electron = window.electron

const props = defineProps<{
  filePath: string | undefined
}>()

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 状态管理
const content = ref('')
const viewMode = ref('edit')

// 编辑器配置
const editorOptions = {
  minimap: { enabled: true },
  wordWrap: 'on',
  lineNumbers: 'on',
  renderWhitespace: 'boundary',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontSize: 14,
  padding: { top: 16 }
}

// 计算属性
const renderedContent = computed(() => {
  console.log('当前内容:', content.value)
  return md.render(content.value || '')
})

// 监听视图模式变化
watch(viewMode, (newMode) => {
  console.log('视图模式变化:', newMode)
})

// 监听文件路径变化
watch(() => props.filePath, async (newPath) => {
  if (newPath) {
    try {
      const fileContent = await window.electron.readFile(newPath)
      content.value = fileContent
      console.log('读取文件内容:', fileContent)
    } catch (error) {
      console.error('读取文件失败:', error)
      content.value = ''
    }
  } else {
    content.value = ''
  }
}, {
  immediate: true,
  deep: true
})

// 确保组件挂载后也能读取文件
onMounted(async () => {
  if (props.filePath) {
    try {
      const fileContent = await window.electron.readFile(props.filePath)
      content.value = fileContent
    } catch (error) {
      console.error('读取文件失败:', error)
      content.value = ''
    }
  }
})

// 保存内容
const saveContent = async () => {
  if (!props.filePath) return

  try {
    await window.electron.writeFile(props.filePath, content.value)
  } catch (error) {
    console.error('保存文件失败:', error)
    alert('保存失败')
  }
}
</script>

<style scoped>
.markdown-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  margin: 0;
  padding: 0;
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
  background-color: #1e1e1e;
  color: #d4d4d4;
}

:deep(.markdown-body) {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  color: #d4d4d4;
}

:deep(.markdown-body h1) { font-size: 2em; margin: 0.67em 0; }
:deep(.markdown-body h2) { font-size: 1.5em; margin: 0.83em 0; }
:deep(.markdown-body p) { margin: 1em 0; }
:deep(.markdown-body code) { 
  background-color: #2d2d2d;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
:deep(.markdown-body pre) {
  background-color: #2d2d2d;
  padding: 16px;
  overflow: auto;
  border-radius: 3px;
}

:deep(.monaco-editor) {
  height: 100% !important;
}

:deep(.markdown-body a) {
  color: #58a6ff;
}

:deep(.markdown-body blockquote) {
  color: #8b949e;
  border-left: 0.25em solid #30363d;
}

:deep(.markdown-body hr) {
  background-color: #30363d;
}

:deep(.markdown-body table) {
  border-color: #30363d;
}

:deep(.markdown-body tr) {
  background-color: #1e1e1e;
  border-color: #30363d;
}

:deep(.markdown-body th, .markdown-body td) {
  border-color: #30363d;
  padding: 6px 13px;
}
</style> 