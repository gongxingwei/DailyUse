import type { ReminderContracts } from '@dailyuse/contracts';

/**
 * Reminder Web 应用服务
 */
export class ReminderWebApplicationService {
  private baseUrl = '/api/v1/reminders';

  // 提醒模板操作
  async createTemplate(
    request: ReminderContracts.CreateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create reminder template: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getTemplates(
    queryParams?: Record<string, any>,
  ): Promise<ReminderContracts.ReminderTemplateResponse[]> {
    const url = new URL(`${this.baseUrl}/templates`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to get reminder templates: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getTemplateById(id: string): Promise<ReminderContracts.ReminderTemplateResponse | null> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to get reminder template: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async updateTemplate(
    id: string,
    request: ReminderContracts.UpdateReminderTemplateRequest,
  ): Promise<ReminderContracts.ReminderTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update reminder template: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete reminder template: ${response.statusText}`);
  }

  async activateTemplate(id: string): Promise<ReminderContracts.ReminderTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/templates/${id}/activate`, { method: 'POST' });
    if (!response.ok)
      throw new Error(`Failed to activate reminder template: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async pauseTemplate(id: string): Promise<ReminderContracts.ReminderTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/templates/${id}/pause`, { method: 'POST' });
    if (!response.ok) throw new Error(`Failed to pause reminder template: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  // 提醒实例操作
  async createInstance(
    request: ReminderContracts.CreateReminderInstanceRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create reminder instance: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getInstances(
    queryParams?: Record<string, any>,
  ): Promise<ReminderContracts.ReminderListResponse> {
    const url = new URL(`${this.baseUrl}/instances`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to get reminder instances: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getInstanceById(id: string): Promise<ReminderContracts.ReminderInstanceResponse | null> {
    const response = await fetch(`${this.baseUrl}/instances/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to get reminder instance: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async updateInstance(
    id: string,
    request: ReminderContracts.UpdateReminderInstanceRequest,
  ): Promise<ReminderContracts.ReminderInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update reminder instance: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async deleteInstance(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/instances/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Failed to delete reminder instance: ${response.statusText}`);
  }

  // 提醒操作
  async triggerReminder(id: string): Promise<ReminderContracts.ReminderInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}/trigger`, { method: 'POST' });
    if (!response.ok) throw new Error(`Failed to trigger reminder: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async snoozeReminder(
    id: string,
    snoozeUntil: Date,
    reason?: string,
  ): Promise<ReminderContracts.ReminderInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snoozeUntil: snoozeUntil.toISOString(), reason }),
    });
    if (!response.ok) throw new Error(`Failed to snooze reminder: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async dismissReminder(id: string): Promise<ReminderContracts.ReminderInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}/dismiss`, { method: 'POST' });
    if (!response.ok) throw new Error(`Failed to dismiss reminder: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async acknowledgeReminder(id: string): Promise<ReminderContracts.ReminderInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${id}/acknowledge`, { method: 'POST' });
    if (!response.ok) throw new Error(`Failed to acknowledge reminder: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  // 批量操作
  async batchDismissReminders(ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/batch/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error(`Failed to batch dismiss reminders: ${response.statusText}`);
  }

  async batchSnoozeReminders(ids: string[], snoozeUntil: Date): Promise<void> {
    const response = await fetch(`${this.baseUrl}/batch/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, snoozeUntil: snoozeUntil.toISOString() }),
    });
    if (!response.ok) throw new Error(`Failed to batch snooze reminders: ${response.statusText}`);
  }

  // 查询方法
  async getActiveReminders(accountUuid: string): Promise<ReminderContracts.ReminderListResponse> {
    const response = await fetch(`${this.baseUrl}/account/${accountUuid}/active`);
    if (!response.ok) throw new Error(`Failed to get active reminders: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getPendingReminders(accountUuid: string): Promise<ReminderContracts.ReminderListResponse> {
    const response = await fetch(`${this.baseUrl}/account/${accountUuid}/pending`);
    if (!response.ok) throw new Error(`Failed to get pending reminders: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getOverdueReminders(accountUuid: string): Promise<ReminderContracts.ReminderListResponse> {
    const response = await fetch(`${this.baseUrl}/account/${accountUuid}/overdue`);
    if (!response.ok) throw new Error(`Failed to get overdue reminders: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getUpcomingReminders(
    accountUuid: string,
    hours?: number,
  ): Promise<ReminderContracts.ReminderListResponse> {
    const url = new URL(`${this.baseUrl}/account/${accountUuid}/upcoming`, window.location.origin);
    if (hours) url.searchParams.append('hours', hours.toString());
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to get upcoming reminders: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getReminderHistory(
    accountUuid: string,
    from?: Date,
    to?: Date,
  ): Promise<ReminderContracts.ReminderListResponse> {
    const url = new URL(`${this.baseUrl}/account/${accountUuid}/history`, window.location.origin);
    if (from) url.searchParams.append('from', from.toISOString());
    if (to) url.searchParams.append('to', to.toISOString());
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to get reminder history: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async searchReminders(
    queryParams?: Record<string, any>,
  ): Promise<ReminderContracts.ReminderListResponse> {
    const url = new URL(`${this.baseUrl}/search`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to search reminders: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }

  async getReminderStats(queryParams?: Record<string, any>): Promise<any> {
    const url = new URL(`${this.baseUrl}/stats`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Failed to get reminder stats: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  }
}
