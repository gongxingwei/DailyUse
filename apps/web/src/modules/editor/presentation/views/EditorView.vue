<template>
  <div class="editor-layout">
    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <v-btn-toggle v-model="activeView" mandatory class="view-toggle">
          <v-btn value="editor" icon="mdi-file-document-edit">
            <v-icon>mdi-file-document-edit</v-icon>
            <v-tooltip activator="parent">编辑器</v-tooltip>
          </v-btn>
          <v-btn value="preview" icon="mdi-eye">
            <v-icon>mdi-eye</v-icon>
            <v-tooltip activator="parent">预览</v-tooltip>
          </v-btn>
          <v-btn value="split" icon="mdi-view-split-vertical">
            <v-icon>mdi-view-split-vertical</v-icon>
            <v-tooltip activator="parent">分屏</v-tooltip>
          </v-btn>
        </v-btn-toggle>
      </div>

      <div class="toolbar-center">
        <v-text-field v-model="fileName" density="compact" variant="outlined" hide-details placeholder="文件名"
          class="file-name-input" />
      </div>

      <div class="toolbar-right">
        <v-btn variant="text" icon="mdi-content-save" @click="saveFile" :disabled="!isModified">
          <v-icon>mdi-content-save</v-icon>
          <v-tooltip activator="parent">保存 (Ctrl+S)</v-tooltip>
        </v-btn>

        <v-btn variant="text" icon="mdi-download" @click="downloadFile">
          <v-icon>mdi-download</v-icon>
          <v-tooltip activator="parent">下载</v-tooltip>
        </v-btn>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-main" :class="`view-${activeView}`">
      <!-- 编辑器区域 -->
      <div v-show="activeView !== 'preview'" class="editor-pane">
        <textarea ref="editorRef" v-model="content" class="editor-textarea" placeholder="开始编写您的内容..."
          @input="onContentChange" @keydown="onKeyDown" />
      </div>

      <!-- 预览区域 -->
      <div v-show="activeView !== 'editor'" class="preview-pane">
        <div class="preview-content" v-html="renderedContent"></div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="editor-status-bar">
      <div class="status-left">
        <span class="text-caption">
          行: {{ currentLine }} 列: {{ currentColumn }}
        </span>
        <span class="text-caption ml-4">
          字符: {{ contentLength }}
        </span>
      </div>

      <div class="status-right">
        <v-chip :color="isModified ? 'warning' : 'success'" variant="tonal" size="small">
          {{ isModified ? '未保存' : '已保存' }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { fileSystem } from '../../../../shared/utils/fileUtils';

// 响应式数据
const activeView = ref<'editor' | 'preview' | 'split'>('editor');
const fileName = ref('untitled.md');
const content = ref('');
const originalContent = ref('');
const editorRef = ref<HTMLTextAreaElement>();

// 编辑器状态
const currentLine = ref(1);
const currentColumn = ref(1);
const isModified = computed(() => content.value !== originalContent.value);
const contentLength = computed(() => content.value.length);

// 简单的Markdown渲染
const renderedContent = computed(() => {
  let html = content.value
    // 标题
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // 代码块
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    // 换行
    .replace(/\n/gim, '<br>');

  return html;
});

// 事件处理
const onContentChange = () => {
  updateCursorPosition();
};

const onKeyDown = (event: KeyboardEvent) => {
  // Ctrl+S 保存
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    saveFile();
  }

  // Tab键处理
  if (event.key === 'Tab') {
    event.preventDefault();
    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    content.value = content.value.substring(0, start) + '  ' + content.value.substring(end);

    // 恢复光标位置
    setTimeout(() => {
      textarea.setSelectionRange(start + 2, start + 2);
    });
  }

  updateCursorPosition();
};

const updateCursorPosition = () => {
  if (!editorRef.value) return;

  const textarea = editorRef.value;
  const cursorPos = textarea.selectionStart;
  const textBeforeCursor = content.value.substring(0, cursorPos);
  const lines = textBeforeCursor.split('\n');

  currentLine.value = lines.length;
  currentColumn.value = lines[lines.length - 1].length + 1;
};

const saveFile = async () => {
  try {
    // 在Web环境中，我们下载文件作为保存
    fileSystem.downloadFile(content.value, fileName.value, 'text/plain');
    originalContent.value = content.value;
    // TODO: 如果有后端API，可以调用保存接口
  } catch (error) {
    console.error('保存文件失败:', error);
  }
};

const downloadFile = () => {
  fileSystem.downloadFile(content.value, fileName.value, 'text/plain');
};

// 加载文件内容（如果有）
const loadFile = async () => {
  try {
    // TODO: 从URL参数或API加载文件内容
    // const response = await api.getFile(fileId);
    // content.value = response.content;
    // fileName.value = response.name;
    // originalContent.value = content.value;
  } catch (error) {
    console.error('加载文件失败:', error);
  }
};

// 生命周期
onMounted(() => {
  loadFile();
});

// 监听内容变化
watch(content, () => {
  updateCursorPosition();
});
</script>

<style scoped>
.editor-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface-variant));
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-center {
  flex: 1;
  max-width: 300px;
  margin: 0 16px;
}

.file-name-input {
  max-width: 100%;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.view-editor .preview-pane,
.view-preview .editor-pane {
  display: none;
}

.view-split .editor-pane,
.view-split .preview-pane {
  flex: 1;
}

.editor-pane {
  flex: 1;
  position: relative;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
}

.preview-pane {
  flex: 1;
  border-left: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface));
}

.preview-content {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  line-height: 1.6;
}

.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3) {
  margin-top: 0;
  margin-bottom: 16px;
  color: rgb(var(--v-theme-primary));
}

.preview-content :deep(p) {
  margin-bottom: 16px;
}

.preview-content :deep(code) {
  background: rgb(var(--v-theme-surface-variant));
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 0.9em;
}

.preview-content :deep(pre) {
  background: rgb(var(--v-theme-surface-variant));
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.preview-content :deep(pre code) {
  background: none;
  padding: 0;
}

.editor-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface-variant));
  min-height: 32px;
}

.status-left {
  display: flex;
  align-items: center;
}

.status-right {
  display: flex;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {

  .view-split .editor-pane,
  .view-split .preview-pane {
    flex: none;
    width: 100%;
  }

  .view-split {
    flex-direction: column;
  }

  .preview-pane {
    border-left: none;
    border-top: 1px solid rgb(var(--v-theme-outline-variant));
  }

  .toolbar-center {
    max-width: 200px;
    margin: 0 8px;
  }
}
</style>
