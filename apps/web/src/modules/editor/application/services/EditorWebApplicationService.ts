import type { EditorContracts } from '@dailyuse/contracts';
import { useEditorStore } from '../../presentation/stores/editorStore';
// 暂时注释掉 API 客户端导入，避免 shared API 依赖问题
// import {
//   editorSessionApiClient,
//   editorLayoutApiClient,
// } from '../../infrastructure/api/editorApiClient';

/**
 * Editor Web 应用服务 - 新架构
 * 负责协调 API 客户端和 Store 之间的数据流
 * 实现缓存优先的数据同步策略
 */
export class EditorWebApplicationService {
  /**
   * 懒加载获取 Editor Store
   * 避免在 Pinia 初始化之前调用
   */
  private get editorStore() {
    return useEditorStore();
  }

  // ===== 编辑器会话 CRUD 操作 =====

  /**
   * 创建编辑器会话
   */
  async createSession(
    request: EditorContracts.CreateEditorSessionRequest,
  ): Promise<EditorContracts.EditorSessionDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const session = await editorSessionApiClient.createSession(request);

      // 添加到缓存
      this.editorStore.setCurrentSession?.(session);

      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建编辑器会话失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取编辑器会话列表
   */
  async getSessions(params?: {
    page?: number;
    limit?: number;
    nameContains?: string;
    autoSave?: boolean;
  }): Promise<EditorContracts.EditorSessionListResponse> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const response = await editorSessionApiClient.getSessions(params);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取编辑器会话列表失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取编辑器会话详情
   */
  async getSessionById(uuid: string): Promise<EditorContracts.EditorSessionDTO | null> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const session = await editorSessionApiClient.getSessionById(uuid);

      // 设置为当前会话
      this.editorStore.setCurrentSession?.(session);

      return session;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : '获取编辑器会话详情失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 更新编辑器会话
   */
  async updateSession(
    uuid: string,
    request: EditorContracts.UpdateEditorSessionRequest,
  ): Promise<EditorContracts.EditorSessionDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const session = await editorSessionApiClient.updateSession(uuid, request);

      // 更新当前会话
      if (this.editorStore.currentSession?.uuid === uuid) {
        this.editorStore.setCurrentSession?.(session);
      }

      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新编辑器会话失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 删除编辑器会话
   */
  async deleteSession(uuid: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      await editorSessionApiClient.deleteSession(uuid);

      // 如果删除的是当前会话，清空当前会话
      if (this.editorStore.currentSession?.uuid === uuid) {
        this.editorStore.setCurrentSession?.(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除编辑器会话失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 激活编辑器会话
   */
  async activateSession(uuid: string): Promise<EditorContracts.EditorSessionDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const session = await editorSessionApiClient.activateSession(uuid);

      // 设置为当前会话
      this.editorStore.setCurrentSession?.(session);

      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活编辑器会话失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  // ===== 编辑器组 CRUD 操作 =====

  /**
   * 创建编辑器组
   */
  async createGroup(
    sessionUuid: string,
    request: EditorContracts.CreateEditorGroupRequest,
  ): Promise<EditorContracts.EditorGroupDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const group = await editorSessionApiClient.createGroup(sessionUuid, request);

      // 添加到当前编辑器组列表
      this.editorStore.addEditorGroup?.(group);

      return group;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建编辑器组失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取编辑器组列表
   */
  async getGroups(sessionUuid: string): Promise<EditorContracts.EditorGroupDTO[]> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const groups = await editorSessionApiClient.getSessionGroups(sessionUuid);

      // 设置编辑器组列表
      this.editorStore.setEditorGroups?.(groups);

      return groups;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取编辑器组列表失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 更新编辑器组
   */
  async updateGroup(
    sessionUuid: string,
    groupUuid: string,
    request: EditorContracts.UpdateEditorGroupRequest,
  ): Promise<EditorContracts.EditorGroupDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const group = await editorSessionApiClient.updateGroup(sessionUuid, groupUuid, request);

      // 更新编辑器组
      this.editorStore.updateEditorGroup?.(groupUuid, group);

      return group;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新编辑器组失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 删除编辑器组
   */
  async deleteGroup(sessionUuid: string, groupUuid: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      await editorSessionApiClient.deleteGroup(sessionUuid, groupUuid);

      // 从编辑器组列表中移除
      this.editorStore.removeEditorGroup?.(groupUuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除编辑器组失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  // ===== 编辑器标签页 CRUD 操作 =====

  /**
   * 创建标签页
   */
  async createTab(
    sessionUuid: string,
    groupUuid: string,
    request: EditorContracts.CreateEditorTabRequest,
  ): Promise<EditorContracts.EditorTabDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const tab = await editorSessionApiClient.createTab(sessionUuid, groupUuid, request);

      // 添加到打开的文件列表
      this.editorStore.addOpenedFile?.(tab);

      return tab;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建标签页失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取组的标签页列表
   */
  async getGroupTabs(
    sessionUuid: string,
    groupUuid: string,
  ): Promise<EditorContracts.EditorTabDTO[]> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const tabs = await editorSessionApiClient.getGroupTabs(sessionUuid, groupUuid);

      return tabs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取标签页列表失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 更新标签页
   */
  async updateTab(
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
    request: EditorContracts.UpdateEditorTabRequest,
  ): Promise<EditorContracts.EditorTabDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const tab = await editorSessionApiClient.updateTab(sessionUuid, groupUuid, tabUuid, request);

      // 更新已打开的文件
      this.editorStore.updateOpenedFile?.(tabUuid, tab);

      return tab;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新标签页失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 删除标签页
   */
  async deleteTab(sessionUuid: string, groupUuid: string, tabUuid: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      await editorSessionApiClient.deleteTab(sessionUuid, groupUuid, tabUuid);

      // 从已打开文件列表中移除
      this.editorStore.removeOpenedFile?.(tabUuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除标签页失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  // ===== 编辑器布局 CRUD 操作 =====

  /**
   * 创建布局
   */
  async createLayout(
    request: Partial<EditorContracts.EditorLayoutDTO>,
  ): Promise<EditorContracts.EditorLayoutDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const layout = await editorLayoutApiClient.createLayout(request);

      return layout;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建布局失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 更新布局
   */
  async updateLayout(
    uuid: string,
    request: EditorContracts.UpdateEditorLayoutRequest,
  ): Promise<EditorContracts.EditorLayoutDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const layout = await editorLayoutApiClient.updateLayout(uuid, request);

      // 如果是当前布局，更新 store
      this.editorStore.updateLayout?.(layout);

      return layout;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新布局失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  // ===== 文件操作 =====

  /**
   * 打开文件
   */
  async openFile(
    sessionUuid: string,
    groupUuid: string,
    filePath: string,
  ): Promise<EditorContracts.EditorTabDTO> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      const tab = await editorSessionApiClient.openFile(sessionUuid, groupUuid, filePath);

      // 添加到打开的文件列表
      this.editorStore.addOpenedFile?.(tab);
      this.editorStore.setCurrentFile?.(tab);

      return tab;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '打开文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 关闭文件
   */
  async closeFile(sessionUuid: string, groupUuid: string, tabUuid: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      await editorSessionApiClient.closeFile(sessionUuid, groupUuid, tabUuid);

      // 从打开的文件列表中移除
      this.editorStore.removeOpenedFile?.(tabUuid);

      // 如果关闭的是当前文件，清空当前文件
      if (this.editorStore.currentFile?.uuid === tabUuid) {
        this.editorStore.setCurrentFile?.(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '关闭文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 保存文件
   */
  async saveFile(
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
    content: string,
  ): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      await editorSessionApiClient.saveFile(sessionUuid, groupUuid, tabUuid, content);

      // 更新文件状态
      this.editorStore.updateFileContent?.(tabUuid, content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存文件失败';
      this.editorStore.setError(errorMessage);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  // ===== 数据同步方法 =====

  /**
   * 同步当前会话数据
   */
  async syncSessionData(sessionUuid: string): Promise<void> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      // 获取会话详情和组列表
      const [session, groups] = await Promise.all([
        this.getSessionById(sessionUuid),
        this.getGroups(sessionUuid),
      ]);

      if (session) {
        this.editorStore.setCurrentSession?.(session);
      }

      this.editorStore.setEditorGroups?.(groups);

      console.log(`成功同步会话 ${sessionUuid} 数据: ${groups.length} 个编辑器组`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步会话数据失败';
      this.editorStore.setError(errorMessage);
      console.error('同步会话数据失败:', error);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 获取 Editor Store 实例
   */
  getStore() {
    return this.editorStore;
  }

  /**
   * 初始化服务
   */
  async initialize(sessionUuid?: string): Promise<void> {
    try {
      if (sessionUuid) {
        await this.syncSessionData(sessionUuid);
      }
    } catch (error) {
      console.error('Editor 服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 强制重新同步数据
   */
  async forceSync(sessionUuid?: string): Promise<void> {
    if (sessionUuid) {
      console.log('强制重新同步会话数据...');
      await this.syncSessionData(sessionUuid);
    }
  }

  /**
   * 同步所有编辑器数据
   * 用于全局初始化
   * 简化版本，避免复杂的 store 依赖
   */
  async syncAllEditorData(): Promise<{
    filesCount: number;
    editorGroupsCount: number;
    repositoriesCount: number;
  }> {
    try {
      this.editorStore.setLoading(true);
      this.editorStore.setError(null);

      console.log('开始同步编辑器数据...');

      // 简化版本：暂时返回默认值，避免复杂的依赖
      const result = {
        filesCount: 0,
        editorGroupsCount: 0,
        repositoriesCount: 0,
      };

      console.log('编辑器数据同步完成（简化版本）');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有编辑器数据失败';
      this.editorStore.setError(errorMessage);
      console.error('同步所有编辑器数据失败:', error);
      throw error;
    } finally {
      this.editorStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    try {
      // 简化版本：编辑器模块暂时总是认为不需要同步
      console.log('✅ [编辑器缓存检查] 跳过同步（简化版本）');
      return false;
    } catch (error) {
      console.warn('检查编辑器同步状态时出错，默认不需要同步:', error);
      return false;
    }
  }
}

/**
 * 导出单例实例
 */
export const editorWebApplicationService = new EditorWebApplicationService();
