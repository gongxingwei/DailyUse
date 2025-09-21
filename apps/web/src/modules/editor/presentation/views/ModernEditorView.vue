<template>
    <div class="modern-editor">
        <!-- Main Workspace Area -->
        <WorkspaceManager />
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDocumentStore, useWorkspaceStore } from '@dailyuse/domain-client'
import WorkspaceManager from '../components/WorkspaceManager.vue'

// Initialize stores
const documentStore = useDocumentStore()
const workspaceStore = useWorkspaceStore()

// Initialize the editor with sample data
const initializeEditor = () => {
    // Create sample workspace if none exist
    if (workspaceStore.workspaces.value.length === 0) {
        const sampleWorkspace = {
            uuid: 'workspace-1',
            name: 'My Documents',
            repositoryUuid: 'repo-1',
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

        workspaceStore.addWorkspace(sampleWorkspace)
    }

    // Create sample documents if none exist
    if (documentStore.documents.value.length === 0) {
        const sampleDocuments = [
            {
                uuid: 'doc-1',
                repositoryUuid: 'repo-1',
                title: 'Welcome to DailyUse Editor',
                content: `# Welcome to DailyUse Editor

This is a modern markdown editor built with Vue 3, Monaco Editor, and a clean DDD architecture.

## Features

- **Document Management**: Create, edit, and organize your documents
- **Workspace Support**: Multiple workspaces for different projects
- **Real-time Editing**: Monaco editor with syntax highlighting
- **Auto-save**: Never lose your work
- **Clean Architecture**: Domain-driven design with proper separation of concerns

## Getting Started

1. Create a new document using the "+" button
2. Start typing in the editor
3. Your changes are automatically saved
4. Use multiple tabs to work on different documents simultaneously

## Markdown Support

This editor supports full markdown syntax:

- **Bold text**
- *Italic text*
- \`Inline code\`
- [Links](https://example.com)
- Lists and more!

\`\`\`typescript
// Code blocks with syntax highlighting
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

Enjoy writing!`,
                format: 'markdown',
                isDirty: false,
                lastSavedAt: new Date()
            },
            {
                uuid: 'doc-2',
                repositoryUuid: 'repo-1',
                title: 'TypeScript Example',
                content: `// TypeScript Example
interface User {
  id: number;
  name: string;
  email: string;
}

class UserManager {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
}

const userManager = new UserManager();
userManager.addUser({
  id: 1,
  name: "John Doe",
  email: "john@example.com"
});`,
                format: 'typescript',
                isDirty: false,
                lastSavedAt: new Date()
            }
        ]

        sampleDocuments.forEach(doc => {
            documentStore.addDocument(doc)
        })

        // Add first document to workspace
        workspaceStore.updateWorkspace('workspace-1', {
            openDocuments: [{
                documentUuid: 'doc-1',
                tabTitle: 'Welcome to DailyUse Editor',
                isDirty: false,
                lastActiveAt: Date.now(),
                cursorPosition: { line: 1, column: 1, offset: 0 },
                scrollPosition: { x: 0, y: 0 }
            }],
            currentDocumentUuid: 'doc-1'
        })
    }
}

onMounted(() => {
    initializeEditor()
})
</script>

<style scoped>
.modern-editor {
    height: 100vh;
    width: 100vw;
    background: rgb(var(--v-theme-surface));
    overflow: hidden;
}

/* Global editor styles */
:deep(.monaco-editor) {
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace !important;
}

:deep(.monaco-editor .margin) {
    background: rgb(var(--v-theme-surface-variant)) !important;
}

:deep(.monaco-editor .monaco-editor-background) {
    background: rgb(var(--v-theme-surface)) !important;
}

:deep(.monaco-editor .current-line) {
    background: rgba(var(--v-theme-primary), 0.1) !important;
}
</style>