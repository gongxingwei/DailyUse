<template>
  <div class="markdown-editor">
    <div class="editor-container">
      <template v-if="isPreviewMode">
        <div class="preview-area">
          <div class="markdown-body" v-html="renderedContent"></div>
        </div>
      </template>
      <template v-else>
        <div class="edit-area">
          <MonacoEditor v-model:value="content" :options="editorOptions" :theme="editorTheme" language="markdown"
            @keydown.ctrl.s.prevent="saveContent" @keydown.meta.s.prevent="saveContent"
            @editorDidMount="handleEditorDidMount" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, markRaw } from 'vue'
import MonacoEditor from 'monaco-editor-vue3'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css'
import { fileSystem } from '@/shared/utils/fileSystem'
import { useThemeStore } from '@/modules/Theme/themeStroe'
import { useSettingStore } from '@/modules/Setting/settingStore'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  path: string
  initialContent?: string
  isPreview?: boolean
}>()

const emit = defineEmits<{
  'contentChanged': [isDirty: boolean]
}>()

const themeStore = useThemeStore()
const settingStore = useSettingStore()
const editorTheme = computed(() => `vs-${themeStore.currentThemeStyle}`)
const editor = ref<monaco.editor.IStandaloneCodeEditor>()
let autoSaveTimer: NodeJS.Timeout | null = null

const autoSaveDelay = ref(1000) // 1s
const imagePasteMethod = computed(() => settingStore.editor.insertImage)

// 状态管理
const isPreviewMode = computed(() => props.isPreview)
const content = ref('')
let originalContent = '';

const autoSaveEnabled = computed(() => settingStore.editor.autoSave)

// 编辑器配置
const editorOptions = computed(() => ({
  ...settingStore.getMonacoOptions(),
  maxEditorWidth: Number.MAX_SAFE_INTEGER,
  automaticLayout: true,
  links: true,
  mouseWheelZoom: true,
  // 添加链接检测配置
  quickSuggestions: true,
  wordBasedSuggestions: true,
  // 配置链接选项
  linkDetector: {
    enabled: true,
    preferredProtocols: ['http', 'https']
  },
  // 修改链接处理器
  'editor.action.openLink': {
    enabled: true,
    callback: (url: string) => {
      window.shared.ipcRenderer.invoke('open-external-url', url);
    }
  }
}))

// 添加编辑器实例初始化的处理函数
const handleEditorDidMount = (instance: any) => {
  editor.value = markRaw(instance)

  const editorElement = editor.value?.getDomNode()
  editorElement?.addEventListener('paste', async (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData
    if (!clipboardData) return
    console.log('Clipboard Data:', clipboardData)
    for (const item of clipboardData.items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        if (imagePasteMethod.value === 'embed') {
          embedImage(item);
        } else {
          linkImage(item);
        }

      }
    }
  })
}

const linkImage = async (item: any) => {
  const file = item.getAsFile()
  if (!file || !props.path) return

  try {
    // 获取当前文件名（不含扩展名）
    const currentFilePath = props.path
    const fileName = currentFilePath.split('\\').pop()?.split('.')[0] || 'untitled'

    // 构建图片文件夹路径
    const picFolderName = `${fileName}`
    const picFolderPath = `${currentFilePath.substring(0, currentFilePath.lastIndexOf('\\'))}\\${picFolderName}`

    // 确保图片文件夹存在
    await fileSystem.createFolder(picFolderPath)

    // 构建图片文件名
    const imageExt = file.name.split('.').pop() || 'png'
    const imageName = await generateUniqueImageName(picFolderPath, 'image', imageExt)

    // 转换 ArrayBuffer 为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = await fileSystem.arrayBufferToBuffer(arrayBuffer)
    console.log('Image Buffer:', buffer)

    // 保存图片
    const imagePath = `${picFolderPath}\\${imageName}`
    await fileSystem.writeFile(imagePath, buffer)

    // 创建相对路径引用
    const relativePath = `./${picFolderName}/${imageName}`
    const mdImageText = `![${imageName}](${relativePath})`

    // 在编辑器中插入图片引用
    if (editor.value) {
      const position = editor.value.getPosition()
      if (position) {
        editor.value.executeEdits('image-paste', [{
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: mdImageText
        }])
      }
    }
  } catch (error) {
    console.error('保存图片失败:', error)
    alert('保存图片失败')
  }
}

const generateUniqueImageName = async (basePath: string, baseName: string, ext: string) => {
  let counter = 1
  let fileName = `${baseName}${counter}.${ext}`
  let fullPath = `${basePath}\\${fileName}`

  while (await fileSystem.exists(fullPath)) {
    counter++
    fileName = `${baseName}${counter}.${ext}`
    fullPath = `${basePath}\\${fileName}`
  }

  return fileName
}

const embedImage = async (item: any) => {
  const imageBlob = item.getAsFile()
  if (imageBlob) {
    const base64 = await fileToBase64(imageBlob)
    insertMarkdownImage(base64)
    console.log('Image Base64:', base64)
  }
}

// 将文件转换为 base64
const fileToBase64 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const insertMarkdownImage = (base64: string) => {
  if (!editor.value) return
  const position = editor.value.getPosition()
  const imageId = `image_${Date.now()}`
  console.log(position)
  if (!position) return
  const mdImageText = `![${imageId}](${base64})`
  const urlStartPos = mdImageText.indexOf('(') + 1
  const insertRange = new monaco.Range(
    position.lineNumber,
    position.column,
    position.lineNumber,
    position.column
  )
  editor.value.executeEdits('image-paste', [{
    range: insertRange,
    text: `![${imageId}](${base64})`
  }])

  editor.value.deltaDecorations([], [{
    range: new monaco.Range(
      position.lineNumber,
      position.column + urlStartPos,
      position.lineNumber,
      position.column + mdImageText.length - 1
    ),
    options: {
      isWholeLine: false,
      inlineClassName: 'folded-image-base64',
      hoverMessage: { value: 'base64 data' },
      beforeContentClassName: 'image-url-collapse'
    }
  }])
}

// 计算属性
const renderedContent = computed(() => {
  // 获取当前文件所在目录的路径
  const currentDir = props.path.substring(0, props.path.lastIndexOf('\\'))
  
  // 创建一个自定义渲染规则来处理图片
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  })

  // 重写图片渲染规则
  const defaultRender = md.renderer.rules.image || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    const token = tokens[idx]
    const srcIndex = token.attrIndex('src')
    if (srcIndex >= 0 && token.attrs) {
      const src = token.attrs[srcIndex][1]
      // 如果是相对路径（以 ./ 或 ../ 开头）
      if (src.startsWith('./') || src.startsWith('../')) {
        // 将相对路径转换为文件系统路径
        const normalizedPath = currentDir.replace(/\\/g, '/') + '/' + src.replace(/^\.\//, '')
        token.attrs[srcIndex][1] = `local://${normalizedPath}`
      }
    }
    return defaultRender(tokens, idx, options, env, self)
  }

  return md.render(content.value || '')
})


// 加载文件内容
const loadFileContent = async () => {
  try {
    const fileContent = await fileSystem.readFile(props.path)
    content.value = fileContent
    originalContent = fileContent
  } catch (error) {
    console.error('读取文件失败:', error)
    content.value = ''
    originalContent = ''
  }
}

// 检查内容是否有更改
const checkDirtyState = () => {
  const isDirty = content.value !== originalContent
  emit('contentChanged', isDirty)
}
// 保存内容
const saveContent = async () => {
  if (!props.path) return

  try {
    await fileSystem.writeFile(props.path, content.value)
    originalContent = content.value
    emit('contentChanged', false)
  } catch (error) {
    console.error('保存文件失败:', error)
    alert('保存失败')
  }
}
// 监听内容变化
watch(content, () => {
  checkDirtyState()

  if (autoSaveEnabled.value) {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    autoSaveTimer = setTimeout(async () => {
      if (content.value !== originalContent) {
        await saveContent()
        originalContent = content.value // Update original content after save
      }
    }, autoSaveDelay.value)
  }
})


// 监听路径变化重新加载内容
watch(() => props.path, () => {
  loadFileContent()
}, { immediate: true })

onMounted(async () => {
  if (props.path && !props.initialContent) {
    try {
      const fileContent = await fileSystem.readFile(props.path)
      content.value = fileContent
    } catch (error) {
      console.error('读取文件失败:', error)
      content.value = ''
    }
  }
})

onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})
</script>

<style scoped>
.markdown-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #3b3a8d;
  overflow: hidden;
  /* 添加这行 */

}

.toolbar {
  padding: 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  flex-shrink: 0;
}

.editor-container {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.editor-container.split .edit-area,
.editor-container.split .preview-area {
  width: 50%;
}

.edit-area,
.preview-area {
  flex: 1;
  overflow: auto;
}

.preview-area {

  background-color: var(--vscode-editor-background);

  /* 添加滚动条样式 */
  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgb(var(--v-theme-surface));
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--vscode-scrollbarSlider-background);
    border-radius: 3px;
    border: 3px solid var(--vscode-editor-background);

    &:hover {
      background-color: var(--vscode-scrollbarSlider-hoverBackground);
    }

    &:active {
      background-color: var(--vscode-scrollbarSlider-activeBackground);
    }
  }
}

:deep(.markdown-body) {
  box-sizing: border-box;
  min-width: 200px;
  /* max-width: 980px; */
  margin: 0 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  /* 编辑器字体颜色 */
  color: rgb(var(--v-theme-font));

}

:deep(.markdown-body h1) {
  font-size: 2em;
  margin: 0.67em 0;
}

:deep(.markdown-body h2) {
  font-size: 1.5em;
  margin: 0.83em 0;
}

:deep(.markdown-body p) {
  margin: 1em 0;
}

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
  color: #5b91ce;
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

:deep(.folded-image-base64) {
  display: none !important;
  width: 0 !important;
  position: absolute !important;
  font-size: 0;
}

:deep(.image-url-collapse) {
  position: relative;
}

:deep(.image-url-collapse::after) {
  content: "..." !important;
  opacity: 0.6;
  cursor: pointer;
  position: absolute;
  left: 0;
}

:deep(.image-url-collapse:hover::after) {
  opacity: 1;
}
</style>