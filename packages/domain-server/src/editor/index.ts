/**
 * Editor模块 - Domain Server
 * 编辑器模块服务端领域层导出
 */

// 仓储实现导出
export { DocumentRepository } from './repositories/DocumentRepository';
export { WorkspaceRepository } from './repositories/WorkspaceRepository';

// 应用服务导出
export {
  DocumentApplicationService,
  WorkspaceApplicationService,
} from './services/EditorApplicationService';

// 现有的导出保持不变
export type { IEditorRepository } from './repositories/iEditorRepository.js';
export * from './services/index.js';
