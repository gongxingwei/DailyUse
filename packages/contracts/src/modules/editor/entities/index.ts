/**
 * Editor Module - Entities
 * 编辑器模块 - 实体统一导出
 */

// Document Entity
export * from './DocumentServer';
export * from './DocumentClient';

// Document Version Entity
export * from './DocumentVersionServer';
export * from './DocumentVersionClient';

// Editor Session Entity (⚠️ 实体，不是聚合根)
export * from './EditorSessionServer';
export * from './EditorSessionClient';

// Editor Group Entity
export * from './EditorGroupServer';
export * from './EditorGroupClient';

// Editor Tab Entity
export * from './EditorTabServer';
export * from './EditorTabClient';

// Search Engine Entity
export * from './SearchEngineServer';
export * from './SearchEngineClient';

// Linked Resource Entity
export * from './LinkedResourceServer';
export * from './LinkedResourceClient';
