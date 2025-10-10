/**
 * EditorWorkspace Application Service (Web)
 * 前端 Application 层 - 协调业务逻辑和数据流
 */

import type { EditorContracts } from '@dailyuse/contracts';
import type { IEditorWorkspaceHttpRepository } from '../infrastructure/repositories/EditorWorkspaceHttpRepository';
import { editorWorkspaceHttpRepository } from '../infrastructure/repositories/EditorWorkspaceHttpRepository';

// 类型别名
type CreateWorkspaceRequest = EditorContracts.CreateEditorWorkspaceRequest;
type UpdateWorkspaceRequest = EditorContracts.UpdateEditorWorkspaceRequest;
type CreateSessionRequest = EditorContracts.CreateEditorSessionRequest;
type WorkspaceClientDTO = EditorContracts.EditorWorkspaceClientDTO;
type SessionClientDTO = EditorContracts.EditorSessionClientDTO;

/**
 * EditorWorkspace Application Service
 *
 * 职责：
 * 1. 协调 HTTP Repository
 * 2. 处理业务逻辑编排
 * 3. 管理错误处理和状态转换
 * 4. 提供给 Presentation 层使用
 */
export class EditorWorkspaceApplicationService {
  constructor(private repository: IEditorWorkspaceHttpRepository) {}

  // ========== Workspace 管理 ==========

  /**
   * 创建工作区
   */
  async createWorkspace(data: CreateWorkspaceRequest): Promise<WorkspaceClientDTO> {
    try {
      return await this.repository.createWorkspace(data);
    } catch (error) {
      this.handleError(error, 'Failed to create workspace');
      throw error;
    }
  }

  /**
   * 获取工作区详情
   */
  async getWorkspace(uuid: string): Promise<WorkspaceClientDTO> {
    try {
      return await this.repository.getWorkspace(uuid);
    } catch (error) {
      this.handleError(error, `Failed to get workspace: ${uuid}`);
      throw error;
    }
  }

  /**
   * 列出账户的所有工作区
   */
  async listWorkspaces(accountUuid: string): Promise<WorkspaceClientDTO[]> {
    try {
      return await this.repository.listWorkspaces(accountUuid);
    } catch (error) {
      this.handleError(error, `Failed to list workspaces for account: ${accountUuid}`);
      throw error;
    }
  }

  /**
   * 更新工作区
   */
  async updateWorkspace(uuid: string, data: UpdateWorkspaceRequest): Promise<WorkspaceClientDTO> {
    try {
      return await this.repository.updateWorkspace(uuid, data);
    } catch (error) {
      this.handleError(error, `Failed to update workspace: ${uuid}`);
      throw error;
    }
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(uuid: string): Promise<void> {
    try {
      await this.repository.deleteWorkspace(uuid);
    } catch (error) {
      this.handleError(error, `Failed to delete workspace: ${uuid}`);
      throw error;
    }
  }

  // ========== Session 管理 ==========

  /**
   * 添加会话到工作区
   */
  async addSession(workspaceUuid: string, data: CreateSessionRequest): Promise<SessionClientDTO> {
    try {
      return await this.repository.addSession(workspaceUuid, data);
    } catch (error) {
      this.handleError(error, `Failed to add session to workspace: ${workspaceUuid}`);
      throw error;
    }
  }

  /**
   * 获取工作区的所有会话
   */
  async getSessions(workspaceUuid: string): Promise<SessionClientDTO[]> {
    try {
      return await this.repository.getSessions(workspaceUuid);
    } catch (error) {
      this.handleError(error, `Failed to get sessions for workspace: ${workspaceUuid}`);
      throw error;
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 错误处理
   */
  private handleError(error: unknown, message: string): void {
    console.error(message, error);
    // 可以在这里添加额外的错误处理逻辑
    // 例如：发送错误日志到服务器、显示toast提示等
  }
}

/**
 * 单例实例
 */
export const editorWorkspaceApplicationService = new EditorWorkspaceApplicationService(
  editorWorkspaceHttpRepository,
);
