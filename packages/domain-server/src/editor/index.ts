// Editor模块聚合根导出
export { EditorSession } from './aggregates/EditorSession';
export { EditorGroup } from './aggregates/EditorGroup';
export { EditorLayout } from './aggregates/EditorLayout';

// Editor模块实体导出
export { EditorTab } from './entities/EditorTab';

// Editor模块仓储接口导出
export type {
  IEditorSessionRepository,
  IEditorGroupRepository,
  IEditorTabRepository,
  IEditorLayoutRepository,
} from './repositories/iEditorRepository';
