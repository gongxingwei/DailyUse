import { apiClient } from '@/shared/api/instances';
import type * as EditorContracts from '@dailyuse/contracts/modules/editor';

/**
 * Editor Session API 客户端
 */
export class EditorSessionApiClient {
  private readonly baseUrl = '/editor/sessions';

  // ===== Editor Session CRUD =====

  /**
   * 创建编辑器会话
   */
  async createSession(
    request: EditorContracts.CreateEditorSessionRequest,
  ): Promise<EditorContracts.EditorSessionResponse> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取编辑器会话列表
   */
  async getSessions(params?: {
    page?: number;
    limit?: number;
    accountUuid?: string;
    status?: string;
  }): Promise<EditorContracts.EditorSessionListResponse> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取编辑器会话详情
   */
  async getSessionById(uuid: string): Promise<EditorContracts.EditorSessionResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 更新编辑器会话
   */
  async updateSession(
    uuid: string,
    request: EditorContracts.UpdateEditorSessionRequest,
  ): Promise<EditorContracts.EditorSessionResponse> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除编辑器会话
   */
  async deleteSession(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Editor Group Management =====

  /**
   * 创建编辑器组
   */
  async createGroup(
    sessionUuid: string,
    request: EditorContracts.CreateEditorGroupRequest,
  ): Promise<EditorContracts.EditorGroupResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${sessionUuid}/groups`, request);
    return data;
  }

  /**
   * 获取会话的编辑器组列表
   */
  async getGroupsBySession(
    sessionUuid: string,
  ): Promise<EditorContracts.EditorGroupListResponse['data']> {
    const data = await apiClient.get(`${this.baseUrl}/${sessionUuid}/groups`);
    return data;
  }

  /**
   * 获取会话的编辑器组列表 (别名方法)
   */
  async getSessionGroups(sessionUuid: string): Promise<EditorContracts.EditorGroupDTO[]> {
    const response = await apiClient.get(`${this.baseUrl}/${sessionUuid}/groups`);
    return response.data || response;
  }

  /**
   * 更新编辑器组
   */
  async updateGroup(
    sessionUuid: string,
    groupUuid: string,
    request: EditorContracts.UpdateEditorGroupRequest,
  ): Promise<EditorContracts.EditorGroupResponse> {
    const data = await apiClient.put(`${this.baseUrl}/${sessionUuid}/groups/${groupUuid}`, request);
    return data;
  }

  /**
   * 删除编辑器组
   */
  async deleteGroup(sessionUuid: string, groupUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${sessionUuid}/groups/${groupUuid}`);
  }

  // ===== Editor Tab Management =====

  /**
   * 创建编辑器标签页
   */
  async createTab(
    sessionUuid: string,
    groupUuid: string,
    request: EditorContracts.CreateEditorTabRequest,
  ): Promise<EditorContracts.EditorTabResponse> {
    const data = await apiClient.post(
      `${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/tabs`,
      request,
    );
    return data;
  }

  /**
   * 批量创建标签页
   */
  async batchCreateTabs(
    sessionUuid: string,
    groupUuid: string,
    request: EditorContracts.BatchCreateTabsRequest,
  ): Promise<EditorContracts.BatchCreateTabsResponse> {
    const data = await apiClient.post(
      `${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/tabs/batch`,
      request,
    );
    return data;
  }

  /**
   * 获取组内标签页列表
   */
  async getTabsByGroup(
    sessionUuid: string,
    groupUuid: string,
  ): Promise<EditorContracts.EditorTabListResponse['data']> {
    const data = await apiClient.get(`${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/tabs`);
    return data;
  }

  /**
   * 获取组内标签页列表 (别名方法)
   */
  async getGroupTabs(
    sessionUuid: string,
    groupUuid: string,
  ): Promise<EditorContracts.EditorTabDTO[]> {
    const response = await apiClient.get(`${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/tabs`);
    return response.data || response;
  }

  /**
   * 更新编辑器标签页
   */
  async updateTab(
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
    request: EditorContracts.UpdateEditorTabRequest,
  ): Promise<EditorContracts.EditorTabResponse> {
    const data = await apiClient.put(
      `${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/tabs/${tabUuid}`,
      request,
    );
    return data;
  }

  /**
   * 删除编辑器标签页
   */
  async deleteTab(sessionUuid: string, groupUuid: string, tabUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/tabs/${tabUuid}`);
  }

  // ===== Editor Layout Management =====

  /**
   * 获取会话布局
   */
  async getSessionLayout(sessionUuid: string): Promise<EditorContracts.EditorLayoutResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${sessionUuid}/layout`);
    return data;
  }

  /**
   * 更新会话布局
   */
  async updateSessionLayout(
    sessionUuid: string,
    request: EditorContracts.UpdateEditorLayoutRequest,
  ): Promise<EditorContracts.EditorLayoutResponse> {
    const data = await apiClient.put(`${this.baseUrl}/${sessionUuid}/layout`, request);
    return data;
  }

  // ===== File Operations =====

  /**
   * 打开文件
   */
  async openFile(
    sessionUuid: string,
    groupUuid: string,
    filePath: string,
  ): Promise<EditorContracts.EditorTabDTO> {
    const data = await apiClient.post(
      `${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/open-file`,
      { filePath },
    );
    return data;
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
    await apiClient.post(
      `${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/tabs/${tabUuid}/save`,
      { content },
    );
  }

  /**
   * 关闭文件
   */
  async closeFile(sessionUuid: string, groupUuid: string, tabUuid: string): Promise<void> {
    await apiClient.post(
      `${this.baseUrl}/${sessionUuid}/groups/${groupUuid}/tabs/${tabUuid}/close`,
    );
  }

  // ===== Session State Management =====

  /**
   * 激活会话
   */
  async activateSession(uuid: string): Promise<EditorContracts.EditorSessionResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/activate`);
    return data;
  }

  /**
   * 保存会话状态
   */
  async saveSessionState(
    uuid: string,
    request: EditorContracts.SaveSessionStateRequest,
  ): Promise<EditorContracts.EditorSessionResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/save-state`, request);
    return data;
  }

  /**
   * 恢复会话状态
   */
  async restoreSessionState(uuid: string): Promise<EditorContracts.EditorSessionResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/restore-state`);
    return data;
  }

  // ===== Aggregate Operations =====

  /**
   * 获取完整的编辑器会话聚合
   * 包含会话、组、标签页、布局等所有相关数据
   */
  async getSessionAggregate(uuid: string): Promise<EditorContracts.EditorSessionAggregateResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}/aggregate`);
    return data;
  }

  /**
   * 批量更新会话聚合
   */
  async updateSessionAggregate(
    uuid: string,
    request: EditorContracts.UpdateSessionAggregateRequest,
  ): Promise<EditorContracts.EditorSessionAggregateResponse> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}/aggregate`, request);
    return data;
  }

  // ===== Search and Query =====

  /**
   * 搜索编辑器会话
   */
  async searchSessions(params: {
    query: string;
    page?: number;
    limit?: number;
    accountUuid?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }): Promise<EditorContracts.EditorSessionListResponse['data']> {
    const data = await apiClient.get(`${this.baseUrl}/search`, { params });
    return data;
  }

  /**
   * 搜索标签页内容
   */
  async searchInTabs(
    sessionUuid: string,
    params: {
      query: string;
      fileTypes?: EditorContracts.SupportedFileType[];
      caseSensitive?: boolean;
      useRegex?: boolean;
    },
  ): Promise<EditorContracts.TabSearchResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${sessionUuid}/search-tabs`, { params });
    return data;
  }
}

/**
 * Editor Layout API 客户端
 */
export class EditorLayoutApiClient {
  private readonly baseUrl = '/editor/layouts';

  // ===== Layout CRUD =====

  /**
   * 创建布局
   */
  async createLayout(
    request: Partial<EditorContracts.EditorLayoutDTO>,
  ): Promise<EditorContracts.EditorLayoutDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 更新布局
   */
  async updateLayout(
    uuid: string,
    request: EditorContracts.UpdateEditorLayoutRequest,
  ): Promise<EditorContracts.EditorLayoutDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  // ===== Layout Templates =====

  /**
   * 创建布局模板
   */
  async createLayoutTemplate(
    request: EditorContracts.CreateLayoutTemplateRequest,
  ): Promise<EditorContracts.EditorLayoutResponse> {
    const data = await apiClient.post(`${this.baseUrl}/templates`, request);
    return data;
  }

  /**
   * 获取布局模板列表
   */
  async getLayoutTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<EditorContracts.EditorLayoutListResponse['data']> {
    const data = await apiClient.get(`${this.baseUrl}/templates`, { params });
    return data;
  }

  /**
   * 应用布局模板
   */
  async applyLayoutTemplate(
    sessionUuid: string,
    templateUuid: string,
  ): Promise<EditorContracts.EditorLayoutResponse> {
    const data = await apiClient.post(`${this.baseUrl}/templates/${templateUuid}/apply`, {
      sessionUuid,
    });
    return data;
  }
}

// 导出单例实例
export const editorSessionApiClient = new EditorSessionApiClient();
export const editorLayoutApiClient = new EditorLayoutApiClient();

// 统一导出
export const editorApiClient = {
  session: editorSessionApiClient,
  layout: editorLayoutApiClient,
};
