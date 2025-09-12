import type { TaskContracts } from '@dailyuse/contracts';
import { useTaskStore } from '../../presentation/stores/taskStore';

/**
 * Task Web 应用服务 - 新架构
 * 负责协调 Domain Service 和 Store 之间的数据流
 * 实现缓存优先的数据同步策略
 */
export class TaskWebApplicationService {
  private baseUrl = '/api/v1/tasks';

  /**
   * 懒加载获取 Task Store
   * 避免在 Pinia 初始化之前调用
   */
  private get taskStore() {
    return useTaskStore();
  }

  // ===== 任务模板 CRUD 操作 =====

  /**
   * 创建任务模板
   */
  async createTaskTemplate(request: TaskContracts.CreateTaskTemplateRequest): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task template: ${response.statusText}`);
      }

      const result = await response.json();
      const template = result.data;

      // 添加到缓存
      this.taskStore.addTaskTemplate(template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务模板列表
   */
  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
  }): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const url = new URL(`${this.baseUrl}/templates`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to get task templates: ${response.statusText}`);
      }

      const result = await response.json();
      const templates = result.data || [];

      // 批量同步到 store
      this.taskStore.setTaskTemplates(templates);

      // 更新分页信息
      if (result.meta) {
        this.taskStore.setPagination({
          page: result.meta.page || 1,
          limit: result.meta.limit || 20,
          total: result.meta.total || templates.length,
        });
      }

      return {
        taskTemplates: templates,
        ...result.meta,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板列表失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务模板详情
   */
  async getTaskTemplateById(uuid: string): Promise<any | null> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/templates/${uuid}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get task template: ${response.statusText}`);
      }

      const result = await response.json();
      const template = result.data;

      // 添加到缓存
      this.taskStore.addTaskTemplate(template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板详情失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(
    uuid: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/templates/${uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task template: ${response.statusText}`);
      }

      const result = await response.json();
      const template = result.data;

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/templates/${uuid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task template: ${response.statusText}`);
      }

      // 从缓存中移除
      this.taskStore.removeTaskTemplate(uuid);
      // 同时移除相关的任务实例
      this.taskStore.removeInstancesByTemplateUuid(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  // ===== 任务模板状态管理 =====

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(uuid: string): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/templates/${uuid}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to activate task template: ${response.statusText}`);
      }

      const result = await response.json();
      const template = result.data;

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(uuid: string): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/templates/${uuid}/pause`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to pause task template: ${response.statusText}`);
      }

      const result = await response.json();
      const template = result.data;

      // 更新缓存
      this.taskStore.updateTaskTemplate(uuid, template);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  // ===== 任务实例 CRUD 操作 =====

  /**
   * 创建任务实例
   */
  async createTaskInstance(request: TaskContracts.CreateTaskInstanceRequest): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task instance: ${response.statusText}`);
      }

      const result = await response.json();
      const instance = result.data;

      // 添加到缓存
      this.taskStore.addTaskInstance(instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务实例列表
   */
  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    status?: string;
    templateUuid?: string;
    scheduledDate?: string;
  }): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const url = new URL(`${this.baseUrl}/instances`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to get task instances: ${response.statusText}`);
      }

      const result = await response.json();
      const instances = result.data || [];

      // 批量同步到 store
      this.taskStore.setTaskInstances(instances);

      // 更新分页信息
      if (result.meta) {
        this.taskStore.setPagination({
          page: result.meta.page || 1,
          limit: result.meta.limit || 20,
          total: result.meta.total || instances.length,
        });
      }

      return {
        taskInstances: instances,
        ...result.meta,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务实例列表失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务实例详情
   */
  async getTaskInstanceById(uuid: string): Promise<any | null> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/instances/${uuid}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get task instance: ${response.statusText}`);
      }

      const result = await response.json();
      const instance = result.data;

      // 添加到缓存
      this.taskStore.addTaskInstance(instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务实例详情失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 更新任务实例
   */
  async updateTaskInstance(
    uuid: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/instances/${uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task instance: ${response.statusText}`);
      }

      const result = await response.json();
      const instance = result.data;

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/instances/${uuid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task instance: ${response.statusText}`);
      }

      // 从缓存中移除
      this.taskStore.removeTaskInstance(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  // ===== 任务实例状态管理 =====

  /**
   * 完成任务
   */
  async completeTask(uuid: string, request: TaskContracts.CompleteTaskRequest): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/instances/${uuid}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete task: ${response.statusText}`);
      }

      const result = await response.json();
      const instance = result.data;

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 撤销完成任务
   */
  async undoCompleteTask(uuid: string, accountUuid: string): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/instances/${uuid}/undo-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountUuid }),
      });

      if (!response.ok) {
        throw new Error(`Failed to undo complete task: ${response.statusText}`);
      }

      const result = await response.json();
      const instance = result.data;

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '撤销完成任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 重新安排任务
   */
  async rescheduleTask(uuid: string, request: TaskContracts.RescheduleTaskRequest): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/instances/${uuid}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to reschedule task: ${response.statusText}`);
      }

      const result = await response.json();
      const instance = result.data;

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重新安排任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(uuid: string): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const response = await fetch(`${this.baseUrl}/instances/${uuid}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel task: ${response.statusText}`);
      }

      const result = await response.json();
      const instance = result.data;

      // 更新缓存
      this.taskStore.updateTaskInstance(uuid, instance);

      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  // ===== 搜索和查询 =====

  /**
   * 搜索任务
   */
  async searchTasks(params: {
    query: string;
    page?: number;
    limit?: number;
    type?: 'template' | 'instance' | 'both';
    status?: string;
  }): Promise<any> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const url = new URL(`${this.baseUrl}/search`, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to search tasks: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索任务失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(): Promise<any[]> {
    // 优先从缓存获取
    const todayTasks = this.taskStore.getTodayTaskInstances;

    if (todayTasks.length > 0) {
      return todayTasks;
    }

    // 如果缓存为空，从API获取
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getTaskInstances({
      scheduledDate: today,
      limit: 1000,
    });

    return response.taskInstances || [];
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有任务数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllTasks(): Promise<{
    templatesCount: number;
    instancesCount: number;
    metaTemplatesCount: number;
  }> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      // 并行获取所有数据
      const [templatesResponse, instancesResponse] = await Promise.all([
        this.getTaskTemplates({ limit: 1000 }),
        this.getTaskInstances({ limit: 1000 }),
      ]);

      const templates = templatesResponse.taskTemplates || [];
      const instances = instancesResponse.taskInstances || [];

      // 元模板暂时使用当前缓存
      const metaTemplates = this.taskStore.getAllTaskMetaTemplates;

      // 批量同步到 store
      this.taskStore.syncAllData(templates, instances, metaTemplates);

      console.log(
        `成功同步数据: ${templates.length} 个模板, ${instances.length} 个实例, ${metaTemplates.length} 个元模板`,
      );

      return {
        templatesCount: templates.length,
        instancesCount: instances.length,
        metaTemplatesCount: metaTemplates.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有任务数据失败';
      this.taskStore.setError(errorMessage);
      console.error('同步所有任务数据失败:', error);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    return (
      !this.taskStore.isInitialized ||
      (this.taskStore.getAllTaskTemplates.length === 0 &&
        this.taskStore.getAllTaskInstances.length === 0) ||
      this.taskStore.shouldRefreshCache
    );
  }

  // ===== 工具方法 =====

  /**
   * 获取 Task Store 实例
   */
  getStore() {
    return this.taskStore;
  }

  /**
   * 初始化服务
   * 会自动同步所有任务数据到 store
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      this.taskStore.initialize();

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('开始同步所有任务数据...');
        await this.syncAllTasks();
      } else {
        console.log('使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('Task 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      if (!this.taskStore.isInitialized) {
        this.taskStore.initialize();
      }
      throw error;
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('强制重新同步所有数据...');
    await this.syncAllTasks();
  }
}
