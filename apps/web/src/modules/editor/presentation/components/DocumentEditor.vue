<template>
    <div class="document-editor">
        <!-- Document Header -->
        <div class="document-header">
            <div class="header-left">
                <h3 class="document-title">{{ document?.title || 'Untitled Document' }}</h3>
                <span class="document-path" v-if="document?.repositoryUuid">Repository: {{ document.repositoryUuid
                    }}</span>
            </div>
            <div class="header-right">
                <v-chip :color="isModified ? 'warning' : 'success'" variant="tonal" size="small">
                    {{ isModified ? 'Modified' : 'Saved' }}
                </v-chip>
                <v-btn icon="mdi-content-save" variant="text" :disabled="!isModified" @click="saveDocument">
                    <v-icon>mdi-content-save</v-icon>
                    <v-tooltip activator="parent">Save Document (Ctrl+S)</v-tooltip>
                </v-btn>
            </div>
        </div>

        <!-- Monaco Editor Area -->
        <div class="editor-container">
            <MonacoEditor v-model:value="content" :options="editorOptions" :theme="editorTheme"
                :language="documentLanguage" @keydown.ctrl.s.prevent="saveDocument"
                @keydown.meta.s.prevent="saveDocument" @editorDidMount="handleEditorDidMount"
                @change="onContentChange" />
        </div>

        <!-- Document Status -->
        <div class="document-status">
            <div class="status-left">
                <span>{{ documentStats.lines }} lines</span>
                <span>{{ documentStats.characters }} characters</span>
                <span>{{ documentStats.words }} words</span>
            </div>
            <div class="status-right">
                <span>{{ document?.format || 'markdown' }}</span>
                <span v-if="document?.lastSavedAt">
                    Last Saved: {{ formatDate(document.lastSavedAt) }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import MonacoEditor from 'monaco-editor-vue3'
import { useDocumentStore, useWorkspaceStore } from '@dailyuse/domain-client'

interface Props {
    documentId: string
    workspaceId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'document-changed': [document: any]
    'content-modified': [isModified: boolean]
}>()

// Stores
const documentStore = useDocumentStore()
const workspaceStore = useWorkspaceStore()

// Reactive state
const content = ref('')
const originalContent = ref('')
const editor = ref<any>(null)
let autoSaveTimer: number | null = null

// Computed properties
const document = computed(() =>
    documentStore.documents.value.find(doc => doc.uuid === props.documentId)
)

const isModified = computed(() =>
    content.value !== originalContent.value
)

const documentLanguage = computed(() => {
    if (!document.value) return 'markdown'

    const format = document.value.format.toLowerCase()
    switch (format) {
        case 'markdown': return 'markdown'
        case 'typescript': return 'typescript'
        case 'javascript': return 'javascript'
        case 'html': return 'html'
        case 'css': return 'css'
        case 'json': return 'json'
        case 'yaml': return 'yaml'
        default: return 'plaintext'
    }
})

const documentStats = computed(() => {
    const text = content.value
    return {
        lines: text.split('\n').length,
        characters: text.length,
        words: text.trim() ? text.trim().split(/\s+/).length : 0
    }
})

const editorTheme = computed(() => 'vs-dark') // TODO: Get from theme store

const editorOptions = computed(() => ({
    minimap: { enabled: true },
    wordWrap: 'on',
    lineNumbers: 'on',
    renderWhitespace: 'boundary',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
    padding: { top: 16 },
    maxEditorWidth: Number.MAX_SAFE_INTEGER,
    links: true,
    mouseWheelZoom: true,
    quickSuggestions: true,
    wordBasedSuggestions: true
}))

// Methods
const loadDocument = async () => {
    if (!props.documentId) return

    try {
        // Check if document is already in store
        const doc = document.value
        if (doc) {
            content.value = doc.content
            originalContent.value = doc.content
            emit('document-changed', doc)
        } else {
            // TODO: Load from API if not in store
            console.log('Document not found in store:', props.documentId)
        }
    } catch (error) {
        console.error('Failed to load document:', error)
    }
}

const saveDocument = async () => {
    if (!document.value || !isModified.value) return

    try {
        const updatedDocument = {
            ...document.value,
            content: content.value,
            isDirty: false,
            lastSavedAt: new Date()
        }

        await documentStore.updateDocument(props.documentId, updatedDocument)
        originalContent.value = content.value
        emit('content-modified', false)

        // TODO: Update workspace if provided
        // if (props.workspaceId) {
        //   await workspaceStore.updateWorkspace(props.workspaceId, {...})
        // }
    } catch (error) {
        console.error('Failed to save document:', error)
    }
}

const onContentChange = () => {
    const modified = isModified.value
    emit('content-modified', modified)

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
    }

    autoSaveTimer = setTimeout(() => {
        if (modified) {
            saveDocument()
        }
    }, 2000)
}

const handleEditorDidMount = (instance: any) => {
    editor.value = instance

    // Setup image paste handling
    const editorElement = editor.value.getDomNode()
    editorElement.addEventListener('paste', handlePaste)
}

const handlePaste = async (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData
    if (!clipboardData) return

    for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i]
        if (item.type.startsWith('image/')) {
            e.preventDefault()
            const imageBlob = item.getAsFile()
            if (imageBlob && document.value) {
                try {
                    // TODO: Implement image handling through document service
                    const base64 = await fileToBase64(imageBlob)
                    insertMarkdownImage(base64)
                } catch (error) {
                    console.error('Failed to handle image paste:', error)
                }
            }
        }
    }
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
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

    editor.value.executeEdits('image-paste', [{
        range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        },
        text: `![${imageId}](${base64})`
    }])
}

const formatDate = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleString()
}

// Lifecycle
onMounted(() => {
    loadDocument()
})

onUnmounted(() => {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
    }
})

// Watchers
watch(() => props.documentId, () => {
    loadDocument()
})

watch(isModified, (modified) => {
    emit('content-modified', modified)
})
</script>

<style scoped>
.document-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgb(var(--v-theme-surface));
}

.document-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
    background: rgb(var(--v-theme-surface-variant));
}

.header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.document-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: rgb(var(--v-theme-on-surface));
}

.document-path {
    font-size: 0.85rem;
    color: rgb(var(--v-theme-on-surface-variant));
    margin-top: 2px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.editor-container {
    flex: 1;
    min-height: 0;
    position: relative;
}

.document-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 16px;
    border-top: 1px solid rgb(var(--v-theme-outline-variant));
    background: rgb(var(--v-theme-surface-variant));
    font-size: 0.8rem;
    color: rgb(var(--v-theme-on-surface-variant));
}

.status-left,
.status-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

:deep(.monaco-editor) {
    height: 100% !important;
}
</style>