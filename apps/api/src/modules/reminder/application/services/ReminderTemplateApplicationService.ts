/**
 * Reminder Template Application Service
 * 提醒模板应用服务
 */

import { ReminderContracts } from '@dailyuse/contracts';
import { PrismaReminderTemplateRepository } from '../../infrastructure/repositories/prisma/PrismaReminderTemplateRepository';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// 使用类型别名来简化类型引用
type ReminderTemplateResponse = ReminderContracts.ReminderTemplateResponse;
type CreateReminderTemplateRequest = ReminderContracts.CreateReminderTemplateRequest;
type UpdateReminderTemplateRequest = ReminderContracts.UpdateReminderTemplateRequest;
type ReminderPriority = ReminderContracts.ReminderPriority;

export class ReminderTemplateApplicationService {
  private readonly repository: PrismaReminderTemplateRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new PrismaReminderTemplateRepository(prisma);
  }

  // ===== 基本 CRUD 操作 =====

  async getById(uuid: string): Promise<ReminderTemplateResponse | null> {
    return await this.repository.findById(uuid);
  }

  async getAllByAccount(accountUuid: string): Promise<ReminderTemplateResponse[]> {
    return await this.repository.findByAccountUuid(accountUuid);
  }

  async create(accountUuid: string, request: CreateReminderTemplateRequest): Promise<string> {
    const uuid = randomUUID();

    // 构建简化的模板数据，让仓储处理完整结构
    const reminderTemplateData = {
      uuid,
      groupUuid: request.groupUuid,
      name: request.name,
      description: request.description,
      message: request.message,
      enabled: true,
      selfEnabled: true,
      timeConfig: request.timeConfig,
      priority: request.priority as ReminderPriority,
      category: request.category,
      tags: request.tags,
      // 让仓储处理其他必需字段
      lifecycle: {
        createdAt: new Date(),
        updatedAt: new Date(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: 1,
    };

    await this.repository.save(accountUuid, reminderTemplateData as any);
    return uuid;
  }

  async update(uuid: string, request: UpdateReminderTemplateRequest): Promise<void> {
    const existing = await this.repository.findById(uuid);
    if (!existing) {
      throw new Error(`Reminder template with uuid ${uuid} not found`);
    }

    // 由于仓储save方法需要accountUuid，我们需要先获取它
    // 这里暂时使用一个占位符，实际应该从existing中获取或通过其他方式获取
    const accountUuid = 'placeholder'; // TODO: 需要从existing或其他地方获取accountUuid

    // 构建更新数据
    const updatedData = {
      uuid,
      groupUuid: request.groupUuid !== undefined ? request.groupUuid : existing.groupUuid,
      name: request.name || existing.name,
      description: request.description !== undefined ? request.description : existing.description,
      message: request.message || existing.message,
      enabled: existing.enabled,
      selfEnabled: existing.selfEnabled,
      timeConfig: request.timeConfig || existing.timeConfig,
      priority: (request.priority as ReminderPriority) || existing.priority,
      category: request.category || existing.category,
      tags: request.tags || existing.tags,
      lifecycle: existing.lifecycle,
      analytics: existing.analytics,
      version: existing.version + 1,
    };

    await this.repository.save(accountUuid, updatedData as any);
  }

  async delete(uuid: string): Promise<void> {
    await this.repository.delete(uuid);
  }

  // ===== 查询操作 =====

  async getByCategory(accountUuid: string, category: string): Promise<ReminderTemplateResponse[]> {
    return await this.repository.findByCategory(accountUuid, category);
  }

  async getByGroup(groupUuid: string): Promise<ReminderTemplateResponse[]> {
    return await this.repository.findByGroupUuid(groupUuid);
  }

  async search(accountUuid: string, query: string): Promise<ReminderTemplateResponse[]> {
    // 由于仓储没有search方法，我们在内存中过滤
    const allTemplates = await this.repository.findByAccountUuid(accountUuid);
    return allTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        (template.description &&
          template.description.toLowerCase().includes(query.toLowerCase())) ||
        template.message.toLowerCase().includes(query.toLowerCase()),
    );
  }

  // ===== 统计操作 =====

  async getCountByCategory(accountUuid: string): Promise<Record<string, number>> {
    const allTemplates = await this.repository.findByAccountUuid(accountUuid);
    const counts: Record<string, number> = {};

    for (const template of allTemplates) {
      counts[template.category] = (counts[template.category] || 0) + 1;
    }

    return counts;
  }

  async getTotalCount(accountUuid: string): Promise<number> {
    const templates = await this.repository.findByAccountUuid(accountUuid);
    return templates.length;
  }

  // ===== 批量操作 =====

  async batchDelete(uuids: string[]): Promise<void> {
    // 由于仓储没有batchDelete方法，逐个删除
    for (const uuid of uuids) {
      await this.repository.delete(uuid);
    }
  }

  // ===== 状态管理 =====

  async enable(uuid: string): Promise<void> {
    const template = await this.repository.findById(uuid);
    if (template) {
      // 这里需要重构，因为我们无法直接从ReminderTemplateResponse构建IReminderTemplate
      // 暂时抛出错误，提示需要实现
      throw new Error('Enable functionality needs to be implemented with proper data mapping');
    }
  }

  async disable(uuid: string): Promise<void> {
    const template = await this.repository.findById(uuid);
    if (template) {
      // 这里需要重构，因为我们无法直接从ReminderTemplateResponse构建IReminderTemplate
      // 暂时抛出错误，提示需要实现
      throw new Error('Disable functionality needs to be implemented with proper data mapping');
    }
  }

  // ===== 业务逻辑方法 =====

  async exists(uuid: string): Promise<boolean> {
    const template = await this.repository.findById(uuid);
    return template !== null;
  }

  async getEnabledTemplates(accountUuid: string): Promise<ReminderTemplateResponse[]> {
    const allTemplates = await this.repository.findByAccountUuid(accountUuid);
    return allTemplates.filter((template) => template.enabled);
  }

  async getTemplatesByTimeType(
    accountUuid: string,
    timeType: 'daily' | 'weekly' | 'monthly' | 'custom',
  ): Promise<ReminderTemplateResponse[]> {
    const allTemplates = await this.repository.findByAccountUuid(accountUuid);
    return allTemplates.filter((template) => template.timeConfig.type === timeType);
  }

  async getTemplatesWithTags(
    accountUuid: string,
    tags: string[],
  ): Promise<ReminderTemplateResponse[]> {
    const allTemplates = await this.repository.findByAccountUuid(accountUuid);
    return allTemplates.filter((template) => tags.some((tag) => template.tags.includes(tag)));
  }

  async duplicateTemplate(uuid: string, newName: string, accountUuid: string): Promise<string> {
    const existing = await this.repository.findById(uuid);
    if (!existing) {
      throw new Error(`Reminder template with uuid ${uuid} not found`);
    }

    const newUuid = randomUUID();
    const duplicatedData = {
      uuid: newUuid,
      groupUuid: existing.groupUuid,
      name: newName,
      description: existing.description,
      message: existing.message,
      enabled: existing.enabled,
      selfEnabled: existing.selfEnabled,
      timeConfig: existing.timeConfig,
      priority: existing.priority,
      category: existing.category,
      tags: existing.tags,
      lifecycle: {
        createdAt: new Date(),
        updatedAt: new Date(),
        triggerCount: 0,
      },
      analytics: {
        totalTriggers: 0,
        acknowledgedCount: 0,
        dismissedCount: 0,
        snoozeCount: 0,
      },
      version: 1,
    };

    await this.repository.save(accountUuid, duplicatedData as any);
    return newUuid;
  }
}
