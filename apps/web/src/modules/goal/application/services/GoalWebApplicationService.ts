import type { GoalContracts } from '@dailyuse/contracts';

/**
 * Goal Web 应用服务
 * 负责协调 Web 端的目标相关操作
 */
export class GoalWebApplicationService {
  private baseUrl = '/api/v1/goals';

  // 基础 CRUD 操作
  async createGoal(request: GoalContracts.CreateGoalRequest): Promise<GoalContracts.GoalResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create goal: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getGoals(queryParams?: Record<string, any>): Promise<GoalContracts.GoalListResponse> {
    const url = new URL(this.baseUrl, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to get goals: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getGoalById(id: string): Promise<GoalContracts.GoalResponse | null> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to get goal: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async updateGoal(
    id: string,
    request: GoalContracts.UpdateGoalRequest,
  ): Promise<GoalContracts.GoalResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update goal: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async deleteGoal(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete goal: ${response.statusText}`);
  }

  // 状态管理操作
  async activateGoal(id: string): Promise<GoalContracts.GoalResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/activate`, { method: 'POST' });
    if (!response.ok) throw new Error(`Failed to activate goal: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async pauseGoal(id: string): Promise<GoalContracts.GoalResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/pause`, { method: 'POST' });
    if (!response.ok) throw new Error(`Failed to pause goal: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async completeGoal(id: string): Promise<GoalContracts.GoalResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/complete`, { method: 'POST' });
    if (!response.ok) throw new Error(`Failed to complete goal: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async archiveGoal(id: string): Promise<GoalContracts.GoalResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/archive`, { method: 'POST' });
    if (!response.ok) throw new Error(`Failed to archive goal: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  // 进度管理
  async updateProgress(id: string, progress: number): Promise<GoalContracts.GoalResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
    if (!response.ok) throw new Error(`Failed to update progress: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async recordMilestone(id: string, milestoneData: any): Promise<GoalContracts.GoalResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestoneData),
    });
    if (!response.ok) throw new Error(`Failed to record milestone: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  // 查询和统计
  async getGoalStats(queryParams?: Record<string, any>): Promise<any> {
    const url = new URL(`${this.baseUrl}/stats`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to get goal stats: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getGoalTimeline(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${id}/timeline`);
    if (!response.ok) throw new Error(`Failed to get goal timeline: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async searchGoals(queryParams?: Record<string, any>): Promise<GoalContracts.GoalListResponse> {
    const url = new URL(`${this.baseUrl}/search`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to search goals: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getActiveGoals(accountUuid: string): Promise<GoalContracts.GoalListResponse> {
    const response = await fetch(`${this.baseUrl}/account/${accountUuid}/active`);
    if (!response.ok) throw new Error(`Failed to get active goals: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getCompletedGoals(
    accountUuid: string,
    from?: Date,
    to?: Date,
  ): Promise<GoalContracts.GoalListResponse> {
    const url = new URL(`${this.baseUrl}/account/${accountUuid}/completed`, window.location.origin);
    if (from) url.searchParams.append('from', from.toISOString());
    if (to) url.searchParams.append('to', to.toISOString());
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to get completed goals: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }
}
