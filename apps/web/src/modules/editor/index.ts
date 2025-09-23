/**
 * Editor Web Module
 * 编辑器Web模块导出
 */

// 导出应用层 (暂时注释，因为有 API 依赖问题)
// export * from './application/index';

// 导出基础设施层 API 客户端 (暂时注释，因为有 shared API 依赖问题)
// export * from './infrastructure/api/index';

// 导出 Store
export { useEditorStore } from './presentation/stores/editorStore';

// 导出 Composables (暂时注释，因为依赖应用服务)
// export * from './presentation/composables/useEditor';

// 导出现代化组件 (Vue 组件在 TypeScript 检查时会有类型声明问题，先注释)
// export { default as DocumentEditor } from './presentation/components/DocumentEditor.vue';
// export { default as WorkspaceManager } from './presentation/components/WorkspaceManager.vue';
// export { default as ModernEditorView } from './presentation/views/ModernEditorView.vue';
