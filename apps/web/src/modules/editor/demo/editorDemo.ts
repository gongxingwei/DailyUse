import { createApp } from 'vue';
import { useDocumentStore, useWorkspaceStore } from '@dailyuse/domain-client';

// Simple demonstration of our new architecture
export function createEditorDemo() {
  const documentStore = useDocumentStore();
  const workspaceStore = useWorkspaceStore();

  // Initialize with sample data
  const initializeDemo = () => {
    // Create sample workspace
    const sampleWorkspace = {
      uuid: 'demo-workspace-1',
      name: 'Demo Workspace',
      repositoryUuid: 'demo-repo-1',
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
        syntax: 'markdown',
      },
      layout: {
        sidebarWidth: 240,
        editorWidth: 800,
        previewWidth: 400,
        isPreviewVisible: false,
        panelSizes: {},
        viewMode: 'edit',
      },
    };

    workspaceStore.addWorkspace(sampleWorkspace);

    // Create sample documents
    const sampleDocuments = [
      {
        uuid: 'demo-doc-1',
        repositoryUuid: 'demo-repo-1',
        title: 'Architecture Overview',
        content: `# DailyUse Editor Architecture

## Implementation Complete ✅

We have successfully implemented a comprehensive Typora-like markdown editor with proper Domain-Driven Design (DDD) architecture.

### Architecture Layers

1. **Contracts Package**: Type-safe interfaces and DTOs
2. **Domain-Core**: Pure business entities and aggregates  
3. **Domain-Server**: Business logic and validation services
4. **API Application Layer**: Cross-cutting concerns and coordination
5. **Repository Infrastructure**: Data access with repository pattern
6. **Domain-Client**: Frontend state management and services
7. **UI Components**: Monaco Editor integration and workspace management

### Key Features

- ✅ Document management with CRUD operations
- ✅ Workspace support with multiple documents
- ✅ Monaco Editor integration with syntax highlighting
- ✅ Auto-save functionality
- ✅ Clean DDD architecture
- ✅ TypeScript type safety
- ✅ Reactive state management

The implementation follows proper separation of concerns and maintains clean boundaries between layers.`,
        format: 'markdown',
        isDirty: false,
        lastSavedAt: new Date(),
      },
      {
        uuid: 'demo-doc-2',
        repositoryUuid: 'demo-repo-1',
        title: 'Quick Start Guide',
        content: `# Quick Start Guide

## Getting Started

1. Create a new workspace
2. Add documents to your workspace
3. Start editing with Monaco Editor
4. Changes are automatically saved

## Features

- **Multi-workspace support**
- **Tab-based document management**
- **Real-time editing**
- **Markdown preview**
- **Syntax highlighting**

Enjoy using the DailyUse Editor!`,
        format: 'markdown',
        isDirty: false,
        lastSavedAt: new Date(),
      },
    ];

    sampleDocuments.forEach((doc) => {
      documentStore.addDocument(doc);
    });

    // Add documents to workspace
    workspaceStore.updateWorkspace('demo-workspace-1', {
      openDocuments: [
        {
          documentUuid: 'demo-doc-1',
          tabTitle: 'Architecture Overview',
          isDirty: false,
          lastActiveAt: Date.now(),
          cursorPosition: { line: 1, column: 1, offset: 0 },
          scrollPosition: { x: 0, y: 0 },
        },
        {
          documentUuid: 'demo-doc-2',
          tabTitle: 'Quick Start Guide',
          isDirty: false,
          lastActiveAt: Date.now() - 1000,
          cursorPosition: { line: 1, column: 1, offset: 0 },
          scrollPosition: { x: 0, y: 0 },
        },
      ],
      currentDocumentUuid: 'demo-doc-1',
    });
  };

  return {
    initializeDemo,
    documentStore,
    workspaceStore,
  };
}
