/**
 * Editor Web Module
 * 编辑器Web模块导出
 */

export * from './application/index.js';

// 新增 - domain-client 集成相关
export { useEditorSessionStore } from './presentation/stores/editorSessionStore';
export { default as EditorSessionManager } from './presentation/components/EditorSessionManager.vue';
