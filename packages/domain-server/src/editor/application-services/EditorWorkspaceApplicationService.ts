/**
 * EditorWorkspaceApplicationService
 * 编辑器工作区应用服务
 */

import type { IEditorWorkspaceRepository } from '../repositories/IEditorWorkspaceRepository';
import type { EditorContracts } from '@dailyuse/contracts';
import { EditorWorkspace } from '../aggregates/EditorWorkspace';
import { EditorSession } from '../entities/EditorSession';
import { EditorGroup } from '../entities/EditorGroup';
import { EditorTab } from '../entities/EditorTab';
import { WorkspaceLayout } from '../value-objects/WorkspaceLayout';
import { WorkspaceSettings } from '../value-objects/WorkspaceSettings';

type CreateWorkspaceRequest = EditorContracts.CreateEditorWorkspaceRequest;
type UpdateWorkspaceRequest = EditorContracts.UpdateEditorWorkspaceRequest;
type WorkspaceClientDTO = EditorContracts.EditorWorkspaceClientDTO;

/**
 * EditorWorkspace 应用服务
 */
export class EditorWorkspaceApplicationService {
  constructor(private readonly workspaceRepository: IEditorWorkspaceRepository) {}

  /**
   * 创建新工作区
   */
  async createWorkspace(
    accountUuid: string,
    request: CreateWorkspaceRequest,
  ): Promise<WorkspaceClientDTO> {
    // 检查名称是否已存在
    const exists = await this.workspaceRepository.existsByName(accountUuid, request.name);
    if (exists) {
      throw new Error(`工作区名称 "${request.name}" 已存在`);
    }

    // 创建工作区（布局和设置在 create 方法中处理）
    const workspace = EditorWorkspace.create({
      accountUuid,
      name: request.name,
      description: request.description ?? undefined,
      projectPath: request.projectPath,
      projectType: request.projectType,
      layout: request.layout ?? undefined,
      settings: request.settings ?? undefined,
    });

    // 保存
    await this.workspaceRepository.save(workspace);

    return workspace.toClientDTO();
  }

  /**
   * 更新工作区
   */
  async updateWorkspace(
    uuid: string,
    request: UpdateWorkspaceRequest,
  ): Promise<WorkspaceClientDTO> {
    // 查找工作区
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${uuid}`);
    }

    // 如果更新名称，检查是否冲突
    if (request.name && request.name !== workspace.name) {
      const exists = await this.workspaceRepository.existsByName(
        workspace.accountUuid,
        request.name,
      );
      if (exists) {
        throw new Error(`工作区名称 "${request.name}" 已存在`);
      }
    }

    // 更新工作区
    workspace.update({
      name: request.name,
      description: request.description ?? undefined,
    });

    // 更新布局
    if (request.layout) {
      const currentLayout = workspace.layout;
      const layout = WorkspaceLayout.fromServerDTO({
        ...currentLayout,
        ...request.layout,
      });
      workspace.updateLayout(layout);
    }

    // 更新设置
    if (request.settings) {
      const currentSettings = workspace.settings;
      const settings = WorkspaceSettings.fromServerDTO({
        ...currentSettings,
        ...request.settings,
      });
      workspace.updateSettings(settings);
    }

    // 保存
    await this.workspaceRepository.save(workspace);

    return workspace.toClientDTO();
  }

  /**
   * 激活工作区
   */
  async activateWorkspace(uuid: string, accountUuid: string): Promise<WorkspaceClientDTO> {
    // 查找工作区
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${uuid}`);
    }

    // 取消其他工作区的激活状态
    const activeWorkspace = await this.workspaceRepository.findActiveByAccountUuid(accountUuid);
    if (activeWorkspace && activeWorkspace.uuid !== uuid) {
      activeWorkspace.deactivate();
      await this.workspaceRepository.save(activeWorkspace);
    }

    // 激活当前工作区
    workspace.activate();
    await this.workspaceRepository.save(workspace);

    return workspace.toClientDTO();
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(uuid: string): Promise<void> {
    // 查找工作区
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${uuid}`);
    }

    // 删除关联的会话和文档（在仓储层面处理级联删除）
    // await this.sessionRepository.deleteByWorkspaceUuid(uuid);
    // await this.documentRepository.deleteByWorkspaceUuid(uuid);

    // 删除工作区
    await this.workspaceRepository.delete(uuid);
  }

  /**
   * 获取工作区详情
   */
  async getWorkspace(uuid: string): Promise<WorkspaceClientDTO | null> {
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    return workspace ? workspace.toClientDTO() : null;
  }

  /**
   * 获取账户的所有工作区
   */
  async listWorkspaces(accountUuid: string): Promise<WorkspaceClientDTO[]> {
    const workspaces = await this.workspaceRepository.findByAccountUuid(accountUuid);
    return workspaces.map((w) => w.toClientDTO());
  }

  /**
   * 获取活动工作区
   */
  async getActiveWorkspace(accountUuid: string): Promise<WorkspaceClientDTO | null> {
    const workspace = await this.workspaceRepository.findActiveByAccountUuid(accountUuid);
    return workspace ? workspace.toClientDTO() : null;
  }

  /**
   * 更新工作区布局
   */
  async updateWorkspaceLayout(
    uuid: string,
    layoutDTO: Partial<EditorContracts.WorkspaceLayoutServerDTO>,
  ): Promise<WorkspaceClientDTO> {
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${uuid}`);
    }

    const currentLayout = workspace.layout;
    const layout = WorkspaceLayout.fromServerDTO({
      ...currentLayout,
      ...layoutDTO,
    });
    workspace.updateLayout(layout);

    await this.workspaceRepository.save(workspace);

    return workspace.toClientDTO();
  }

  /**
   * 更新工作区设置
   */
  async updateWorkspaceSettings(
    uuid: string,
    settingsDTO: Partial<EditorContracts.WorkspaceSettingsServerDTO>,
  ): Promise<WorkspaceClientDTO> {
    const workspace = await this.workspaceRepository.findByUuid(uuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${uuid}`);
    }

    const currentSettings = workspace.settings;
    const settings = WorkspaceSettings.fromServerDTO({
      ...currentSettings,
      ...settingsDTO,
    });
    workspace.updateSettings(settings);

    await this.workspaceRepository.save(workspace);

    return workspace.toClientDTO();
  }

  /**
   * 统计工作区数量
   */
  async countWorkspaces(accountUuid: string): Promise<number> {
    return await this.workspaceRepository.countByAccountUuid(accountUuid);
  }
}
