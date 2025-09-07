import type { TaskContracts } from '@dailyuse/contracts';

/**
 * Task Web 应用服务
 * 负责协调 Web 端的任务相关操作
 */
export class TaskWebApplicationService {
  private baseUrl = '/api/v1/tasks';

  // 任务模板相关方法
  async createTemplate(
    request: TaskContracts.CreateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
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
    return result.data;
  }

  async getTemplates(
    queryParams?: Record<string, any>,
  ): Promise<TaskContracts.TaskTemplateResponse[]> {
    const url = new URL(`${this.baseUrl}/templates`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
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
    return result.data;
  }

  async getTemplateById(id: string): Promise<TaskContracts.TaskTemplateResponse | null> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get task template: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async updateTemplate(
    id: string,
    request: TaskContracts.UpdateTaskTemplateRequest,
  ): Promise<TaskContracts.TaskTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, {
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
    return result.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task template: ${response.statusText}`);
    }
  }

  async activateTemplate(id: string): Promise<TaskContracts.TaskTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/templates/${id}/activate`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to activate task template: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async pauseTemplate(id: string): Promise<TaskContracts.TaskTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/templates/${id}/pause`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to pause task template: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // 任务实例相关方法
  async createInstance(
    request: TaskContracts.CreateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
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
    return result.data;
  }

  async getInstances(queryParams?: Record<string, any>): Promise<TaskContracts.TaskListResponse> {
    const url = new URL(`${this.baseUrl}/instances`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
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
    return result.data;
  }

  async getInstanceById(id: string): Promise<TaskContracts.TaskInstanceResponse | null> {
    const response = await fetch(`${this.baseUrl}/instances/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get task instance: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async updateInstance(
    id: string,
    request: TaskContracts.UpdateTaskInstanceRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}`, {
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
    return result.data;
  }

  async deleteInstance(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/instances/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task instance: ${response.statusText}`);
    }
  }

  async completeTask(
    id: string,
    request: TaskContracts.CompleteTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}/complete`, {
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
    return result.data;
  }

  async undoCompleteTask(
    id: string,
    accountUuid: string,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}/undo-complete`, {
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
    return result.data;
  }

  async rescheduleTask(
    id: string,
    request: TaskContracts.RescheduleTaskRequest,
  ): Promise<TaskContracts.TaskInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}/reschedule`, {
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
    return result.data;
  }

  async cancelTask(id: string): Promise<TaskContracts.TaskInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel task: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // 查询和统计方法
  async getTaskStats(queryParams?: Record<string, any>): Promise<any> {
    const url = new URL(`${this.baseUrl}/stats`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to get task stats: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getTaskTimeline(queryParams?: Record<string, any>): Promise<any> {
    const url = new URL(`${this.baseUrl}/timeline`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to get task timeline: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async searchTasks(queryParams?: Record<string, any>): Promise<TaskContracts.TaskListResponse> {
    const url = new URL(`${this.baseUrl}/search`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to search tasks: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getUpcomingTasks(
    queryParams?: Record<string, any>,
  ): Promise<TaskContracts.TaskListResponse> {
    const url = new URL(`${this.baseUrl}/upcoming`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to get upcoming tasks: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getOverdueTasks(
    queryParams?: Record<string, any>,
  ): Promise<TaskContracts.TaskListResponse> {
    const url = new URL(`${this.baseUrl}/overdue`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to get overdue tasks: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }
}
