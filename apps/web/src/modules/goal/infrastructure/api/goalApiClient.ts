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

  // ===== DDD聚合根控制：KeyResult管理 =====

  /**
   * 通过Goal聚合根创建关键结果
   */
  async createKeyResultForGoal(
    goalUuid: string,
    request: {
      name: string;
      description?: string;
      startValue: number;
      targetValue: number;
      currentValue?: number;
      unit: string;
      weight: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    },
  ): Promise<GoalContracts.KeyResultResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${goalUuid}/key-results`, request);
    return response.data.data;
  }

  /**
   * 获取目标的所有关键结果
   */
  async getKeyResultsByGoal(goalUuid: string): Promise<GoalContracts.KeyResultListResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${goalUuid}/key-results`);
    return response.data.data;
  }

  /**
   * 通过Goal聚合根更新关键结果
   */
  async updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: GoalContracts.UpdateKeyResultRequest,
  ): Promise<GoalContracts.KeyResultResponse> {
    const response = await apiClient.put(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`,
      request,
    );
    return response.data.data;
  }

  /**
   * 通过Goal聚合根删除关键结果
   */
  async deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`);
  }

  /**
   * 更新关键结果进度
   */
  async updateKeyResultProgress(
    goalUuid: string,
    keyResultUuid: string,
    request: GoalContracts.UpdateKeyResultProgressRequest,
  ): Promise<GoalContracts.KeyResultResponse> {
    const response = await apiClient.patch(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/progress`,
      request,
    );
    return response.data.data;
  }

  // ===== DDD聚合根控制：GoalRecord管理 =====

  /**
   * 通过KeyResult创建目标记录
   */
  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: GoalContracts.CreateGoalRecordRequest,
  ): Promise<GoalContracts.GoalRecordResponse> {
    const response = await apiClient.post(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records`,
      request,
    );
    return response.data.data;
  }

  /**
   * 获取关键结果的所有记录
   */
  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalContracts.GoalRecordListResponse> {
    const response = await apiClient.get(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records`,
      { params },
    );
    return response.data.data;
  }

  /**
   * 获取目标的所有记录
   */
  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalContracts.GoalRecordListResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${goalUuid}/records`, { params });
    return response.data.data;
  }

  // ===== DDD聚合根控制：GoalReview管理 =====

  /**
   * 通过Goal聚合根创建目标复盘
   */
  async createGoalReview(
    goalUuid: string,
    request: GoalContracts.CreateGoalReviewRequest,
  ): Promise<GoalContracts.GoalReviewResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${goalUuid}/reviews`, request);
    return response.data.data;
  }

  /**
   * 获取目标的所有复盘
   */
  async getGoalReviewsByGoal(goalUuid: string): Promise<GoalContracts.GoalReviewListResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${goalUuid}/reviews`);
    return response.data.data;
  }

  /**
   * 通过Goal聚合根更新目标复盘
   */
  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalContracts.GoalReviewDTO>,
  ): Promise<GoalContracts.GoalReviewResponse> {
    const response = await apiClient.put(
      `${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`,
      request,
    );
    return response.data.data;
  }

  /**
   * 通过Goal聚合根删除目标复盘
   */
  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`);
  }

  // ===== DDD聚合根完整视图 =====

  /**
   * 获取Goal聚合根的完整视图
   * 包含目标、关键结果、记录、复盘等所有子实体
   */
  async getGoalAggregateView(goalUuid: string): Promise<GoalContracts.GoalAggregateViewResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${goalUuid}/aggregate`);
    return response.data.data;
  }

  /**
   * 批量更新关键结果权重
   */
  async batchUpdateKeyResultWeights(
    goalUuid: string,
    request: {
      updates: Array<{
        keyResultUuid: string;
        weight: number;
      }>;
    },
  ): Promise<GoalContracts.KeyResultListResponse> {
    const response = await apiClient.put(
      `${this.baseUrl}/${goalUuid}/key-results/batch-weight`,
      request,
    );
    return response.data.data;
  }

  /**
   * 克隆Goal聚合根
   */
  async cloneGoal(
    goalUuid: string,
    request: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    },
  ): Promise<GoalContracts.GoalResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${goalUuid}/clone`, request);
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
