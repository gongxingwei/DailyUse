/**
 * Editor Web Module
 * 编辑器Web模块导出
 */

// 导出应用层
export * from './application/index';

// 导出基础设施层 API 客户端
export * from './infrastructure/api/index';

// 导出 Store
export { useEditorStore } from './presentation/stores/editorStore';

// 导出现代化组件
export { default as DocumentEditor } from './presentation/components/DocumentEditor.vue';
export { default as WorkspaceManager } from './presentation/components/WorkspaceManager.vue';
export { default as ModernEditorView } from './presentation/views/ModernEditorView.vue';
