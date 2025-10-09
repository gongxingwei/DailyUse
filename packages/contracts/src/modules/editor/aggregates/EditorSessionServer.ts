/**
 * EditorSessionServer 聚合根的 contracts 文件
 * 包含 EditorSessionServer 聚合根的接口定义
 * 以及与其相关的 DTO 定义
 *
 * @author Your Name
 * @date 2024-06-28
 */

import { EditorSessionClientDTO } from './/EditorSessionClient';

// 聚合根接口
export interface EditorSessionServer {
  xxxx: string;
  toServerDTO(): EditorSessionServerDTO;
  toClientDTO(): EditorSessionClientDTO;
  toPersistenceDTO(): EditorSessionPersistenceDTO;
}

// 数据传输类型
export interface EditorSessionServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  activeGroupId?: string | null;
  layoutId?: string | null;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  lastSavedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface EditorSessionPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  activeGroupId?: string | null;
  layoutId?: string | null;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  lastSavedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// 聚合根相关事件类型
export interface EditorSessionSavedEvent {
  eventType: 'EditorSessionSaved';
  aggregateId: string; // session uuid
  occurredOn: Date;
  payload: {
    sessionUuid: string;
    accountUuid: string;
    savedBy?: string | null;
  };
}