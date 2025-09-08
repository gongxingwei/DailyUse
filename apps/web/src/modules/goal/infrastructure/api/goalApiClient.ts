import { apiClient } from '@/shared/api/instances';
import { type GoalContracts } from '@dailyuse/contracts';

/**
 * Goal API 客户端
 */
export class GoalApiClient {
  private readonly baseUrl = '/goals';

  // ===== Goal CRUD =====

  /**
   * 创建目标
   */
  async createGoal(request: GoalContracts.CreateGoalRequest): Promise<GoalContracts.GoalResponse> {
    const response = await apiClient.post(this.baseUrl, request);
    return response.data.data;
  }

  /**
   * 获取目标列表
   */
  async getGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<GoalContracts.GoalListResponse> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data.data;
  }

  /**
   * 获取目标详情
   */
  async getGoalById(uuid: string): Promise<GoalContracts.GoalResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return response.data.data;
  }

  /**
   * 更新目标
   */
  async updateGoal(
    uuid: string,
    request: GoalContracts.UpdateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    const response = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return response.data.data;
  }

  /**
   * 删除目标
   */
  async deleteGoal(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Goal 状态管理 =====

  /**
   * 激活目标
   */
  async activateGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${uuid}/activate`);
    return response.data.data;
  }

  /**
   * 暂停目标
   */
  async pauseGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${uuid}/pause`);
    return response.data.data;
  }

  /**
   * 完成目标
   */
  async completeGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${uuid}/complete`);
    return response.data.data;
  }

  /**
   * 归档目标
   */
  async archiveGoal(uuid: string): Promise<GoalContracts.GoalResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${uuid}/archive`);
    return response.data.data;
  }

  // ===== 搜索和过滤 =====

  /**
   * 搜索目标
   */
  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<GoalContracts.GoalListResponse> {
    const response = await apiClient.get(`${this.baseUrl}/search`, { params });
    return response.data.data;
  }
}

/**
 * GoalDir API 客户端
 */
export class GoalDirApiClient {
  private readonly baseUrl = '/goal-dirs';

  // ===== GoalDir CRUD =====

  /**
   * 创建目标目录
   */
  async createGoalDir(
    request: GoalContracts.CreateGoalDirRequest,
  ): Promise<GoalContracts.GoalDirResponse> {
    const response = await apiClient.post(this.baseUrl, request);
    return response.data.data;
  }

  /**
   * 获取目标目录列表
   */
  async getGoalDirs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string;
  }): Promise<GoalContracts.GoalDirListResponse> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data.data;
  }

  /**
   * 获取目标目录详情
   */
  async getGoalDirById(uuid: string): Promise<GoalContracts.GoalDirResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return response.data.data;
  }

  /**
   * 更新目标目录
   */
  async updateGoalDir(
    uuid: string,
    request: GoalContracts.UpdateGoalDirRequest,
  ): Promise<GoalContracts.GoalDirResponse> {
    const response = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return response.data.data;
  }

  /**
   * 删除目标目录
   */
  async deleteGoalDir(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }
}

// 导出单例实例
export const goalApiClient = new GoalApiClient();
export const goalDirApiClient = new GoalDirApiClient();
