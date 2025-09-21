<template>
    <div class="workspace-manager">
        <!-- Workspace Header -->
        <div class="workspace-header">
            <div class="header-left">
                <v-select v-model="activeWorkspaceId" :items="workspaceItems" item-title="name" item-value="uuid"
                    density="compact" variant="outlined" hide-details class="workspace-selector"
                    @update:model-value="switchWorkspace">
                    <template #prepend-inner>
                        <v-icon>mdi-folder-multiple</v-icon>
                    </template>
                </v-select>
            </div>
            <div class="header-right">
                <v-btn icon="mdi-plus" variant="text" size="small" @click="createWorkspace">
                    <v-icon>mdi-plus</v-icon>
                    <v-tooltip activator="parent">Create New Workspace</v-tooltip>
                </v-btn>
            </div>
        </div>

        <!-- Document Tabs -->
        <div class="document-tabs" v-if="currentWorkspace">
            <v-tabs v-model="activeDocumentIndex" show-arrows class="document-tab-bar">
                <v-tab v-for="(openDoc, index) in openDocuments" :key="openDoc.documentUuid" :value="index"
                    class="document-tab" @click="switchToDocument(openDoc.documentUuid)">
                    <div class="tab-content">
                        <span class="tab-title">{{ openDoc.tabTitle }}</span>
                        <v-icon v-if="openDoc.isDirty" class="dirty-indicator" size="small">
                            mdi-circle
                        </v-icon>
                        <v-btn icon="mdi-close" variant="plain" size="x-small" class="close-btn"
                            @click.stop="closeDocument(openDoc.documentUuid)">
                            <v-icon size="16">mdi-close</v-icon>
                        </v-btn>
                    </div>
                </v-tab>
            </v-tabs>
        </div>

        <!-- Main Editor Area -->
        <div class="editor-workspace" v-if="currentWorkspace && currentDocumentId">
            <DocumentEditor :document-id="currentDocumentId" :workspace-id="activeWorkspaceId || undefined"
                @document-changed="onDocumentChanged" @content-modified="onContentModified" />
        </div>

        <!-- Empty State -->
        <div class="empty-state" v-else>
            <div class="empty-content">
                <v-icon size="64" color="primary">mdi-file-document-plus</v-icon>
                <h3>No Document Open</h3>
                <p>Create a new document or open an existing one to start editing.</p>
                <v-btn color="primary" @click="createDocument">
                    <v-icon left>mdi-plus</v-icon>
                    Create New Document
                </v-btn>
            </div>
        </div>

        <!-- Create Workspace Dialog -->
        <v-dialog v-model="showCreateWorkspaceDialog" max-width="400">
            <v-card>
                <v-card-title>Create New Workspace</v-card-title>
                <v-card-text>
                    <v-text-field v-model="newWorkspaceName" label="Workspace Name" variant="outlined" density="compact"
                        autofocus @keydown.enter="confirmCreateWorkspace" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showCreateWorkspaceDialog = false">Cancel</v-btn>
                    <v-btn color="primary" @click="confirmCreateWorkspace">Create</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Create Document Dialog -->
        <v-dialog v-model="showCreateDocumentDialog" max-width="400">
            <v-card>
                <v-card-title>Create New Document</v-card-title>
                <v-card-text>
                    <v-text-field v-model="newDocumentTitle" label="Document Title" variant="outlined" density="compact"
                        autofocus @keydown.enter="confirmCreateDocument" />
                    <v-select v-model="newDocumentFormat" :items="documentFormats" label="Document Format"
                        variant="outlined" density="compact" class="mt-3" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showCreateDocumentDialog = false">Cancel</v-btn>
                    <v-btn color="primary" @click="confirmCreateDocument">Create</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDocumentStore, useWorkspaceStore } from '@dailyuse/domain-client'
import DocumentEditor from './DocumentEditor.vue'

// Stores
const documentStore = useDocumentStore()
const workspaceStore = useWorkspaceStore()

// Reactive state
const activeWorkspaceId = ref<string | null>(null)
const activeDocumentIndex = ref<number>(0)
const showCreateWorkspaceDialog = ref(false)
const showCreateDocumentDialog = ref(false)
const newWorkspaceName = ref('')
const newDocumentTitle = ref('')
const newDocumentFormat = ref('markdown')

// Constants
const documentFormats = [
    { title: 'Markdown', value: 'markdown' },
    { title: 'TypeScript', value: 'typescript' },
    { title: 'JavaScript', value: 'javascript' },
    { title: 'HTML', value: 'html' },
    { title: 'CSS', value: 'css' },
    { title: 'JSON', value: 'json' },
    { title: 'YAML', value: 'yaml' },
    { title: 'Plain Text', value: 'text' }
]

// Computed properties
const workspaceItems = computed(() =>
    workspaceStore.workspaces.value.map(workspace => ({
        uuid: workspace.uuid,
        name: workspace.name
    }))
)

const currentWorkspace = computed(() =>
    activeWorkspaceId.value
        ? workspaceStore.workspaces.value.find(w => w.uuid === activeWorkspaceId.value)
        : null
)

const openDocuments = computed(() =>
    currentWorkspace.value?.openDocuments || []
)

const currentDocumentId = computed(() => {
    const openDocs = openDocuments.value
    if (openDocs.length === 0) return null

    const index = Math.max(0, Math.min(activeDocumentIndex.value, openDocs.length - 1))
    return openDocs[index]?.documentUuid || null
})

// Methods
const switchWorkspace = (workspaceId: string) => {
    activeWorkspaceId.value = workspaceId
    activeDocumentIndex.value = 0

    // Update workspace as active
    workspaceStore.setActiveWorkspace(workspaceId)
}

const switchToDocument = (documentId: string) => {
    const index = openDocuments.value.findIndex(doc => doc.documentUuid === documentId)
    if (index !== -1) {
        activeDocumentIndex.value = index
    }
}

const closeDocument = (documentId: string) => {
    if (!currentWorkspace.value) return

    const updatedOpenDocs = openDocuments.value.filter(doc => doc.documentUuid !== documentId)

    workspaceStore.updateWorkspace(currentWorkspace.value.uuid, {
        openDocuments: updatedOpenDocs
    })

    // Adjust active document index if needed
    if (activeDocumentIndex.value >= updatedOpenDocs.length) {
        activeDocumentIndex.value = Math.max(0, updatedOpenDocs.length - 1)
    }
}

const createWorkspace = () => {
    newWorkspaceName.value = ''
    showCreateWorkspaceDialog.value = true
}

const confirmCreateWorkspace = () => {
    if (!newWorkspaceName.value.trim()) return

    const newWorkspace = {
        uuid: generateUuid(),
        name: newWorkspaceName.value.trim(),
        repositoryUuid: generateUuid(),
        openDocuments: [],
        settings: {
            theme: 'dark',
            fontSize: 14,
            fontFamily: 'Monaco, Consolas, monospace',
            lineHeight: 1.5,
            tabSize: 2,
            wordWrap: true,
            lineNumbers: true,
            minimap: true,
            autoSave: 'afterDelay',
            syntax: 'markdown'
        },
        layout: {
            sidebarWidth: 240,
            editorWidth: 800,
            previewWidth: 400,
            isPreviewVisible: false,
            panelSizes: {},
            viewMode: 'edit'
        }
    }

    workspaceStore.addWorkspace(newWorkspace)
    activeWorkspaceId.value = newWorkspace.uuid
    showCreateWorkspaceDialog.value = false
}

const createDocument = () => {
    newDocumentTitle.value = ''
    newDocumentFormat.value = 'markdown'
    showCreateDocumentDialog.value = true
}

const confirmCreateDocument = () => {
    if (!newDocumentTitle.value.trim() || !activeWorkspaceId.value) return

    const newDocument = {
        uuid: generateUuid(),
        repositoryUuid: currentWorkspace.value?.repositoryUuid || generateUuid(),
        title: newDocumentTitle.value.trim(),
        content: '',
        format: newDocumentFormat.value,
        isDirty: false,
        lastSavedAt: new Date()
    }

    // Add document to store
    documentStore.addDocument(newDocument)

    // Add to workspace's open documents
    if (currentWorkspace.value) {
        const openDoc = {
            documentUuid: newDocument.uuid,
            tabTitle: newDocument.title,
            isDirty: false,
            lastActiveAt: Date.now(),
            cursorPosition: { line: 1, column: 1, offset: 0 },
            scrollPosition: { x: 0, y: 0 }
        }

        const updatedOpenDocs = [...openDocuments.value, openDoc]
        workspaceStore.updateWorkspace(activeWorkspaceId.value, {
            openDocuments: updatedOpenDocs,
            currentDocumentUuid: newDocument.uuid
        })

        activeDocumentIndex.value = updatedOpenDocs.length - 1
    }

    showCreateDocumentDialog.value = false
}

const onDocumentChanged = (document: any) => {
    // Update tab title if needed
    if (currentWorkspace.value && currentDocumentId.value) {
        const openDoc = openDocuments.value.find(doc => doc.documentUuid === currentDocumentId.value)
        if (openDoc && openDoc.tabTitle !== document.title) {
            const updatedOpenDocs = openDocuments.value.map(doc =>
                doc.documentUuid === currentDocumentId.value
                    ? { ...doc, tabTitle: document.title }
                    : doc
            )

            workspaceStore.updateWorkspace(currentWorkspace.value.uuid, {
                openDocuments: updatedOpenDocs
            })
        }
    }
}

const onContentModified = (isModified: boolean) => {
    // Update dirty indicator in tab
    if (currentWorkspace.value && currentDocumentId.value) {
        const updatedOpenDocs = openDocuments.value.map(doc =>
            doc.documentUuid === currentDocumentId.value
                ? { ...doc, isDirty: isModified, lastActiveAt: Date.now() }
                : doc
        )

        workspaceStore.updateWorkspace(currentWorkspace.value.uuid, {
            openDocuments: updatedOpenDocs
        })
    }
}

const generateUuid = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Initialize
const initialize = () => {
    // Set first workspace as active if none selected
    if (!activeWorkspaceId.value && workspaceStore.workspaces.value.length > 0) {
        activeWorkspaceId.value = workspaceStore.workspaces.value[0].uuid
    }

    // Create default workspace if none exist
    if (workspaceStore.workspaces.value.length === 0) {
        confirmCreateWorkspace()
        newWorkspaceName.value = 'Default Workspace'
    }
}

// Lifecycle
onMounted(() => {
    initialize()
})

// Watch for workspace changes
watch(() => workspaceStore.workspaces.value.length, () => {
    if (!activeWorkspaceId.value && workspaceStore.workspaces.value.length > 0) {
        activeWorkspaceId.value = workspaceStore.workspaces.value[0].uuid
    }
})
</script>

<style scoped>
.workspace-manager {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: rgb(var(--v-theme-surface));
}

.workspace-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
    background: rgb(var(--v-theme-surface-variant));
}

.workspace-selector {
    min-width: 200px;
}

.document-tabs {
    border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.document-tab-bar {
    background: rgb(var(--v-theme-surface));
}

.document-tab {
    min-width: 120px;
    max-width: 200px;
}

.tab-content {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
}

.tab-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dirty-indicator {
    color: rgb(var(--v-theme-warning));
    flex-shrink: 0;
}

.close-btn {
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.2s;
}

.close-btn:hover {
    opacity: 1;
}

.editor-workspace {
    flex: 1;
    min-height: 0;
}

.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-content {
    text-align: center;
    max-width: 300px;
}

.empty-content h3 {
    margin: 16px 0 8px;
    color: rgb(var(--v-theme-on-surface));
}

.empty-content p {
    margin-bottom: 24px;
    color: rgb(var(--v-theme-on-surface-variant));
}

/* Responsive design */
@media (max-width: 768px) {
    .workspace-header {
        padding: 4px 8px;
    }

    .workspace-selector {
        min-width: 150px;
    }

    .document-tab {
        min-width: 100px;
        max-width: 150px;
    }
}
</style>