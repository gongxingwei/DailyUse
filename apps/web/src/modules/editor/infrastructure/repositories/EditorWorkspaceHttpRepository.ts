/**
 * EditorWorkspace HTTP Repository
 * 前端 Infrastructure 层 - 通过 HTTP 调用后端 API
 */

import { apiClient } from '@/shared/api';
import type { EditorContracts } from '@dailyuse/contracts';

// 类型别名
type CreateWorkspaceRequest = EditorContracts.CreateEditorWorkspaceRequest;
type UpdateWorkspaceRequest = EditorContracts.UpdateEditorWorkspaceRequest;
type CreateSessionRequest = EditorContracts.CreateEditorSessionRequest;

/**
 * EditorWorkspace Repository Interface (前端)
 */
export interface IEditorWorkspaceHttpRepository {
  /**
   * 创建工作区
   */
  createWorkspace(data: CreateWorkspaceRequest): Promise<EditorContracts.EditorWorkspaceClientDTO>;

  /**
   * 获取工作区详情
   */
  getWorkspace(uuid: string): Promise<EditorContracts.EditorWorkspaceClientDTO>;

  /**
   * 列出账户的所有工作区
   */
  listWorkspaces(accountUuid: string): Promise<EditorContracts.EditorWorkspaceClientDTO[]>;

  /**
   * 更新工作区
   */
  updateWorkspace(
    uuid: string,
    data: UpdateWorkspaceRequest,
  ): Promise<EditorContracts.EditorWorkspaceClientDTO>;

  /**
   * 删除工作区
   */
  deleteWorkspace(uuid: string): Promise<void>;

  /**
   * 添加会话到工作区
   */
  addSession(
    workspaceUuid: string,
    data: CreateSessionRequest,
  ): Promise<EditorContracts.EditorSessionClientDTO>;

  /**
   * 获取工作区的所有会话
   */
  getSessions(workspaceUuid: string): Promise<EditorContracts.EditorSessionClientDTO[]>;
}

/**
 * EditorWorkspace HTTP Repository 实现
 */
export class EditorWorkspaceHttpRepository implements IEditorWorkspaceHttpRepository {
  private readonly baseUrl = '/api/v1/editor-workspaces';

  /**
   * 创建工作区
   */
  async createWorkspace(
    data: CreateWorkspaceRequest,
  ): Promise<EditorContracts.EditorWorkspaceClientDTO> {
    // apiClient.post 会自动从 { success, data } 中提取 data 字段
    return await apiClient.post<EditorContracts.EditorWorkspaceClientDTO>(
      `${this.baseUrl}/workspaces`,
      data,
    );
  }

  /**
   * 获取工作区详情
   */
  async getWorkspace(uuid: string): Promise<EditorContracts.EditorWorkspaceClientDTO> {
    return await apiClient.get<EditorContracts.EditorWorkspaceClientDTO>(
      `${this.baseUrl}/workspaces/${uuid}`,
    );
  }

  /**
   * 列出账户的所有工作区
   */
  async listWorkspaces(accountUuid: string): Promise<EditorContracts.EditorWorkspaceClientDTO[]> {
    return await apiClient.get<EditorContracts.EditorWorkspaceClientDTO[]>(
      `${this.baseUrl}/accounts/${accountUuid}/workspaces`,
    );
  }

  /**
   * 更新工作区
   */
  async updateWorkspace(
    uuid: string,
    data: UpdateWorkspaceRequest,
  ): Promise<EditorContracts.EditorWorkspaceClientDTO> {
    return await apiClient.put<EditorContracts.EditorWorkspaceClientDTO>(
      `${this.baseUrl}/workspaces/${uuid}`,
      data,
    );
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/workspaces/${uuid}`);
  }

  /**
   * 添加会话到工作区
   */
  async addSession(
    workspaceUuid: string,
    data: CreateSessionRequest,
  ): Promise<EditorContracts.EditorSessionClientDTO> {
    return await apiClient.post<EditorContracts.EditorSessionClientDTO>(
      `${this.baseUrl}/workspaces/${workspaceUuid}/sessions`,
      data,
    );
  }

  /**
   * 获取工作区的所有会话
   */
  async getSessions(workspaceUuid: string): Promise<EditorContracts.EditorSessionClientDTO[]> {
    return await apiClient.get<EditorContracts.EditorSessionClientDTO[]>(
      `${this.baseUrl}/workspaces/${workspaceUuid}/sessions`,
    );
  }
}

/**
 * 单例实例
 */
export const editorWorkspaceHttpRepository = new EditorWorkspaceHttpRepository();
