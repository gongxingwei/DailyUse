/**
 * Editor Module Events
 * 编辑器模块领域事件定义
 */

import type {
  EditorTabDTO,
  EditorGroupDTO,
  EditorLayoutDTO,
  EditorSessionDTO,
  FileOperationResponse,
} from './dtos';
import type { SupportedFileType, FileOperationType } from './types';

// ============ Base Event Interface ============

/**
 * 编辑器事件基础接口
 */
export interface EditorBaseEvent {
  /** 事件ID */
  eventId: string;
  /** 事件类型 */
  type: string;
  /** 事件时间戳 */
  timestamp: Date;
  /** 触发用户UUID */
  accountUuid: string;
  /** 事件源 */
  source: string;
  /** 事件版本 */
  version: number;
}

// ============ Editor Tab Events ============

/**
 * 编辑器标签页创建事件
 */
export interface EditorTabCreatedEvent extends EditorBaseEvent {
  type: 'editor.tab.created';
  payload: {
    tab: EditorTabDTO;
    groupUuid: string;
  };
}

/**
 * 编辑器标签页打开事件
 */
export interface EditorTabOpenedEvent extends EditorBaseEvent {
  type: 'editor.tab.opened';
  payload: {
    tab: EditorTabDTO;
    groupUuid: string;
    isPreview: boolean;
  };
}

/**
 * 编辑器标签页激活事件
 */
export interface EditorTabActivatedEvent extends EditorBaseEvent {
  type: 'editor.tab.activated';
  payload: {
    tabUuid: string;
    groupUuid: string;
    previousTabUuid?: string;
  };
}

/**
 * 编辑器标签页内容变更事件
 */
export interface EditorTabContentChangedEvent extends EditorBaseEvent {
  type: 'editor.tab.content.changed';
  payload: {
    tabUuid: string;
    groupUuid: string;
    path: string;
    isDirty: boolean;
    changeSize: number;
  };
}

/**
 * 编辑器标签页保存事件
 */
export interface EditorTabSavedEvent extends EditorBaseEvent {
  type: 'editor.tab.saved';
  payload: {
    tabUuid: string;
    groupUuid: string;
    path: string;
    fileSize: number;
    saveTime: Date;
  };
}

/**
 * 编辑器标签页关闭事件
 */
export interface EditorTabClosedEvent extends EditorBaseEvent {
  type: 'editor.tab.closed';
  payload: {
    tabUuid: string;
    groupUuid: string;
    path: string;
    wasDirty: boolean;
    closeReason: 'user' | 'auto' | 'error';
  };
}

/**
 * 编辑器标签页更新事件
 */
export interface EditorTabUpdatedEvent extends EditorBaseEvent {
  type: 'editor.tab.updated';
  payload: {
    tabUuid: string;
    groupUuid: string;
    changes: Partial<EditorTabDTO>;
    previousValues: Partial<EditorTabDTO>;
  };
}

// ============ Editor Group Events ============

/**
 * 编辑器组创建事件
 */
export interface EditorGroupCreatedEvent extends EditorBaseEvent {
  type: 'editor.group.created';
  payload: {
    group: EditorGroupDTO;
    splitFromGroupUuid?: string;
  };
}

/**
 * 编辑器组激活事件
 */
export interface EditorGroupActivatedEvent extends EditorBaseEvent {
  type: 'editor.group.activated';
  payload: {
    groupUuid: string;
    previousGroupUuid?: string;
  };
}

/**
 * 编辑器组调整大小事件
 */
export interface EditorGroupResizedEvent extends EditorBaseEvent {
  type: 'editor.group.resized';
  payload: {
    groupUuid: string;
    newWidth: number;
    newHeight?: number;
    previousWidth: number;
    previousHeight?: number;
  };
}

/**
 * 编辑器组删除事件
 */
export interface EditorGroupRemovedEvent extends EditorBaseEvent {
  type: 'editor.group.removed';
  payload: {
    groupUuid: string;
    tabCount: number;
    wasActive: boolean;
  };
}

/**
 * 编辑器组更新事件
 */
export interface EditorGroupUpdatedEvent extends EditorBaseEvent {
  type: 'editor.group.updated';
  payload: {
    groupUuid: string;
    changes: Partial<EditorGroupDTO>;
    previousValues: Partial<EditorGroupDTO>;
  };
}

/**
 * 编辑器组分割事件
 */
export interface EditorGroupSplitEvent extends EditorBaseEvent {
  type: 'editor.group.split';
  payload: {
    sourceGroupUuid: string;
    newGroupUuid: string;
    direction: 'horizontal' | 'vertical';
    copiedTab?: string;
  };
}

// ============ Editor Layout Events ============

/**
 * 编辑器布局创建事件
 */
export interface EditorLayoutCreatedEvent extends EditorBaseEvent {
  type: 'editor.layout.created';
  payload: {
    layout: EditorLayoutDTO;
  };
}

/**
 * 编辑器布局变更事件
 */
export interface EditorLayoutChangedEvent extends EditorBaseEvent {
  type: 'editor.layout.changed';
  payload: {
    layoutUuid: string;
    changes: Partial<EditorLayoutDTO>;
    previousValues: Partial<EditorLayoutDTO>;
  };
}

/**
 * 编辑器布局应用事件
 */
export interface EditorLayoutAppliedEvent extends EditorBaseEvent {
  type: 'editor.layout.applied';
  payload: {
    layoutUuid: string;
    sessionUuid?: string;
    previousLayoutUuid?: string;
  };
}

/**
 * 编辑器布局删除事件
 */
export interface EditorLayoutDeletedEvent extends EditorBaseEvent {
  type: 'editor.layout.deleted';
  payload: {
    layoutUuid: string;
    layoutName: string;
    wasDefault: boolean;
  };
}

// ============ Editor Session Events ============

/**
 * 编辑器会话创建事件
 */
export interface EditorSessionCreatedEvent extends EditorBaseEvent {
  type: 'editor.session.created';
  payload: {
    session: EditorSessionDTO;
  };
}

/**
 * 编辑器会话激活事件
 */
export interface EditorSessionActivatedEvent extends EditorBaseEvent {
  type: 'editor.session.activated';
  payload: {
    sessionUuid: string;
    previousSessionUuid?: string;
  };
}

/**
 * 编辑器会话保存事件
 */
export interface EditorSessionSavedEvent extends EditorBaseEvent {
  type: 'editor.session.saved';
  payload: {
    sessionUuid: string;
    saveTime: Date;
    savedTabCount: number;
    isAutoSave: boolean;
  };
}

/**
 * 编辑器会话更新事件
 */
export interface EditorSessionUpdatedEvent extends EditorBaseEvent {
  type: 'editor.session.updated';
  payload: {
    sessionUuid: string;
    changes: Partial<EditorSessionDTO>;
    previousValues: Partial<EditorSessionDTO>;
  };
}

/**
 * 编辑器会话删除事件
 */
export interface EditorSessionDeletedEvent extends EditorBaseEvent {
  type: 'editor.session.deleted';
  payload: {
    sessionUuid: string;
    sessionName: string;
    groupCount: number;
    tabCount: number;
  };
}

// ============ File Operation Events ============

/**
 * 文件创建事件
 */
export interface FileCreatedEvent extends EditorBaseEvent {
  type: 'editor.file.created';
  payload: {
    path: string;
    fileType: SupportedFileType;
    size: number;
    tabUuid?: string;
    groupUuid?: string;
  };
}

/**
 * 文件打开事件
 */
export interface FileOpenedEvent extends EditorBaseEvent {
  type: 'editor.file.opened';
  payload: {
    path: string;
    fileType: SupportedFileType;
    size: number;
    tabUuid: string;
    groupUuid: string;
    isPreview: boolean;
  };
}

/**
 * 文件保存事件
 */
export interface FileSavedEvent extends EditorBaseEvent {
  type: 'editor.file.saved';
  payload: {
    path: string;
    fileType: SupportedFileType;
    size: number;
    tabUuid: string;
    groupUuid: string;
    saveTime: Date;
  };
}

/**
 * 文件删除事件
 */
export interface FileDeletedEvent extends EditorBaseEvent {
  type: 'editor.file.deleted';
  payload: {
    path: string;
    fileType: SupportedFileType;
    affectedTabs: string[];
    deleteTime: Date;
  };
}

/**
 * 文件重命名事件
 */
export interface FileRenamedEvent extends EditorBaseEvent {
  type: 'editor.file.renamed';
  payload: {
    oldPath: string;
    newPath: string;
    fileType: SupportedFileType;
    affectedTabs: string[];
    renameTime: Date;
  };
}

/**
 * 文件移动事件
 */
export interface FileMovedEvent extends EditorBaseEvent {
  type: 'editor.file.moved';
  payload: {
    oldPath: string;
    newPath: string;
    fileType: SupportedFileType;
    affectedTabs: string[];
    moveTime: Date;
  };
}

/**
 * 文件复制事件
 */
export interface FileCopiedEvent extends EditorBaseEvent {
  type: 'editor.file.copied';
  payload: {
    sourcePath: string;
    targetPath: string;
    fileType: SupportedFileType;
    copyTime: Date;
  };
}

// ============ Editor Error Events ============

/**
 * 编辑器错误事件
 */
export interface EditorErrorEvent extends EditorBaseEvent {
  type: 'editor.error';
  payload: {
    errorCode: string;
    errorMessage: string;
    errorDetails?: any;
    context: {
      operation?: string;
      tabUuid?: string;
      groupUuid?: string;
      path?: string;
    };
  };
}

/**
 * 文件操作错误事件
 */
export interface FileOperationErrorEvent extends EditorBaseEvent {
  type: 'editor.file.error';
  payload: {
    operation: FileOperationType;
    path: string;
    errorCode: string;
    errorMessage: string;
    errorDetails?: any;
  };
}

// ============ Editor System Events ============

/**
 * 编辑器启动事件
 */
export interface EditorStartedEvent extends EditorBaseEvent {
  type: 'editor.system.started';
  payload: {
    version: string;
    restoreSession: boolean;
    restoredGroups: number;
    restoredTabs: number;
  };
}

/**
 * 编辑器关闭事件
 */
export interface EditorClosedEvent extends EditorBaseEvent {
  type: 'editor.system.closed';
  payload: {
    saveSession: boolean;
    openGroups: number;
    openTabs: number;
    unsavedFiles: number;
  };
}

/**
 * 编辑器自动保存事件
 */
export interface EditorAutoSaveEvent extends EditorBaseEvent {
  type: 'editor.system.autosave';
  payload: {
    savedFiles: number;
    failedFiles: number;
    saveTime: Date;
    nextSaveTime: Date;
  };
}

// ============ Event Union Types ============

/**
 * 编辑器标签页相关事件
 */
export type EditorTabEvent =
  | EditorTabCreatedEvent
  | EditorTabOpenedEvent
  | EditorTabActivatedEvent
  | EditorTabContentChangedEvent
  | EditorTabSavedEvent
  | EditorTabClosedEvent
  | EditorTabUpdatedEvent;

/**
 * 编辑器组相关事件
 */
export type EditorGroupEvent =
  | EditorGroupCreatedEvent
  | EditorGroupActivatedEvent
  | EditorGroupResizedEvent
  | EditorGroupRemovedEvent
  | EditorGroupUpdatedEvent
  | EditorGroupSplitEvent;

/**
 * 编辑器布局相关事件
 */
export type EditorLayoutEvent =
  | EditorLayoutCreatedEvent
  | EditorLayoutChangedEvent
  | EditorLayoutAppliedEvent
  | EditorLayoutDeletedEvent;

/**
 * 编辑器会话相关事件
 */
export type EditorSessionEvent =
  | EditorSessionCreatedEvent
  | EditorSessionActivatedEvent
  | EditorSessionSavedEvent
  | EditorSessionUpdatedEvent
  | EditorSessionDeletedEvent;

/**
 * 文件操作相关事件
 */
export type FileOperationEvent =
  | FileCreatedEvent
  | FileOpenedEvent
  | FileSavedEvent
  | FileDeletedEvent
  | FileRenamedEvent
  | FileMovedEvent
  | FileCopiedEvent;

/**
 * 编辑器错误相关事件
 */
export type EditorErrorEventUnion = EditorErrorEvent | FileOperationErrorEvent;

/**
 * 编辑器系统相关事件
 */
export type EditorSystemEvent = EditorStartedEvent | EditorClosedEvent | EditorAutoSaveEvent;

/**
 * 所有编辑器事件的联合类型
 */
export type EditorEvent =
  | EditorTabEvent
  | EditorGroupEvent
  | EditorLayoutEvent
  | EditorSessionEvent
  | FileOperationEvent
  | EditorErrorEventUnion
  | EditorSystemEvent;
