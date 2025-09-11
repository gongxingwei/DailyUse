/**
 * Prisma Reminder Instance Repository Implementation
 * Prisma提醒实例仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { ReminderContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type IReminderInstance = ReminderContracts.IReminderInstance;
type ReminderInstanceResponse = ReminderContracts.ReminderInstanceResponse;
type ReminderStatus = ReminderContracts.ReminderStatus;
type ReminderPriority = ReminderContracts.ReminderPriority;

export class PrismaReminderInstanceRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapReminderInstanceToDTO(instance: any): ReminderInstanceResponse {
    return {
      uuid: instance.uuid,
      templateUuid: instance.templateUuid,
      title: instance.title,
      message: instance.message,
      scheduledTime: instance.scheduledTime.toISOString(),
      triggeredTime: instance.triggeredTime?.toISOString(),
      acknowledgedTime: instance.acknowledgedTime?.toISOString(),
      dismissedTime: instance.dismissedTime?.toISOString(),
      snoozedUntil: instance.snoozedUntil?.toISOString(),
      status: instance.status as ReminderStatus,
      priority: instance.priority as ReminderPriority,
      metadata: {
        category: instance.category,
        tags: instance.tags ? JSON.parse(instance.tags) : [],
        sourceType: instance.sourceType,
        sourceId: instance.sourceId,
      },
      snoozeHistory: instance.snoozeHistory ? JSON.parse(instance.snoozeHistory) : [],
      currentSnoozeCount: instance.currentSnoozeCount,
      createdAt: instance.createdAt?.toISOString(),
      updatedAt: instance.updatedAt?.toISOString(),
      version: instance.version,
    };
  }

  // ===== CRUD 操作 =====

  async findById(uuid: string): Promise<ReminderInstanceResponse | null> {
    const instance = await this.prisma.reminderInstance.findUnique({
      where: { uuid },
    });

    return instance ? this.mapReminderInstanceToDTO(instance) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<ReminderInstanceResponse[]> {
    const instances = await this.prisma.reminderInstance.findMany({
      where: { accountUuid },
      orderBy: { scheduledTime: 'asc' },
    });

    return instances.map((instance) => this.mapReminderInstanceToDTO(instance));
  }

  async findByTemplateUuid(templateUuid: string): Promise<ReminderInstanceResponse[]> {
    const instances = await this.prisma.reminderInstance.findMany({
      where: { templateUuid },
      orderBy: { scheduledTime: 'asc' },
    });

    return instances.map((instance) => this.mapReminderInstanceToDTO(instance));
  }

  async findByStatus(
    accountUuid: string,
    status: ReminderStatus,
  ): Promise<ReminderInstanceResponse[]> {
    const instances = await this.prisma.reminderInstance.findMany({
      where: {
        accountUuid,
        status,
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return instances.map((instance) => this.mapReminderInstanceToDTO(instance));
  }

  async findByDateRange(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReminderInstanceResponse[]> {
    const instances = await this.prisma.reminderInstance.findMany({
      where: {
        accountUuid,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return instances.map((instance) => this.mapReminderInstanceToDTO(instance));
  }

  async findOverdue(accountUuid: string): Promise<ReminderInstanceResponse[]> {
    const now = new Date();
    const instances = await this.prisma.reminderInstance.findMany({
      where: {
        accountUuid,
        scheduledTime: { lt: now },
        status: 'pending',
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return instances.map((instance) => this.mapReminderInstanceToDTO(instance));
  }

  async findUpcoming(accountUuid: string, hours = 24): Promise<ReminderInstanceResponse[]> {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const instances = await this.prisma.reminderInstance.findMany({
      where: {
        accountUuid,
        scheduledTime: {
          gte: now,
          lte: future,
        },
        status: 'pending',
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return instances.map((instance) => this.mapReminderInstanceToDTO(instance));
  }

  async save(accountUuid: string, reminderInstance: IReminderInstance): Promise<void> {
    const data = {
      accountUuid,
      templateUuid: reminderInstance.templateUuid,
      title: reminderInstance.title,
      message: reminderInstance.message,
      scheduledTime: reminderInstance.scheduledTime,
      triggeredTime: reminderInstance.triggeredTime,
      acknowledgedTime: reminderInstance.acknowledgedTime,
      dismissedTime: reminderInstance.dismissedTime,
      snoozedUntil: reminderInstance.snoozedUntil,
      status: reminderInstance.status,
      priority: reminderInstance.priority,
      // 元数据展开
      category: reminderInstance.metadata.category,
      tags: JSON.stringify(reminderInstance.metadata.tags),
      sourceType: reminderInstance.metadata.sourceType,
      sourceId: reminderInstance.metadata.sourceId,
      // 稍后提醒历史
      snoozeHistory: JSON.stringify(reminderInstance.snoozeHistory),
      currentSnoozeCount: reminderInstance.currentSnoozeCount,
      version: reminderInstance.version,
    };

    await this.prisma.reminderInstance.upsert({
      where: { uuid: reminderInstance.uuid },
      update: data,
      create: {
        uuid: reminderInstance.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminderInstance.delete({
      where: { uuid },
    });
  }

  async updateStatus(uuid: string, status: ReminderStatus): Promise<void> {
    const updateData: any = { status };

    // 根据状态设置对应的时间戳
    const now = new Date();
    switch (status) {
      case 'triggered':
        updateData.triggeredTime = now;
        break;
      case 'acknowledged':
        updateData.acknowledgedTime = now;
        break;
      case 'dismissed':
        updateData.dismissedTime = now;
        break;
    }

    await this.prisma.reminderInstance.update({
      where: { uuid },
      data: updateData,
    });
  }

  async snoozeUntil(uuid: string, snoozedUntil: Date, reason?: string): Promise<void> {
    const instance = await this.prisma.reminderInstance.findUnique({
      where: { uuid },
    });

    if (!instance) {
      throw new Error(`Reminder instance with uuid ${uuid} not found`);
    }

    // 更新稍后提醒历史
    const snoozeHistory = instance.snoozeHistory ? JSON.parse(instance.snoozeHistory) : [];
    snoozeHistory.push({
      snoozedAt: new Date().toISOString(),
      snoozeUntil: snoozedUntil.toISOString(),
      reason,
    });

    await this.prisma.reminderInstance.update({
      where: { uuid },
      data: {
        status: 'snoozed',
        snoozedUntil,
        snoozeHistory: JSON.stringify(snoozeHistory),
        currentSnoozeCount: (instance.currentSnoozeCount || 0) + 1,
      },
    });
  }

  // ===== 统计查询 =====

  async getCountByStatus(accountUuid: string): Promise<Record<string, number>> {
    const counts = await this.prisma.reminderInstance.groupBy({
      by: ['status'],
      where: { accountUuid },
      _count: { status: true },
    });

    const result: Record<string, number> = {};
    counts.forEach((count) => {
      result[count.status] = count._count.status;
    });

    return result;
  }

  async getCountByPriority(accountUuid: string): Promise<Record<string, number>> {
    const counts = await this.prisma.reminderInstance.groupBy({
      by: ['priority'],
      where: { accountUuid },
      _count: { priority: true },
    });

    const result: Record<string, number> = {};
    counts.forEach((count) => {
      result[count.priority] = count._count.priority;
    });

    return result;
  }

  async getTotalCount(accountUuid: string): Promise<number> {
    return await this.prisma.reminderInstance.count({
      where: { accountUuid },
    });
  }

  // ===== 批量操作 =====

  async batchUpdateStatus(uuids: string[], status: ReminderStatus): Promise<void> {
    const updateData: any = { status };

    // 根据状态设置对应的时间戳
    const now = new Date();
    switch (status) {
      case 'triggered':
        updateData.triggeredTime = now;
        break;
      case 'acknowledged':
        updateData.acknowledgedTime = now;
        break;
      case 'dismissed':
        updateData.dismissedTime = now;
        break;
    }

    await this.prisma.reminderInstance.updateMany({
      where: { uuid: { in: uuids } },
      data: updateData,
    });
  }

  async batchDelete(uuids: string[]): Promise<void> {
    await this.prisma.reminderInstance.deleteMany({
      where: { uuid: { in: uuids } },
    });
  }

  // ===== 清理操作 =====

  async cleanupExpiredReminders(accountUuid: string, daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.reminderInstance.deleteMany({
      where: {
        accountUuid,
        status: { in: ['acknowledged', 'dismissed', 'expired'] },
        updatedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
