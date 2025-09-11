/**
 * Prisma Reminder Template Repository Implementation
 * Prisma提醒模板仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { ReminderContracts } from '@dailyuse/contracts';
import { ImportanceLevel } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type IReminderTemplate = ReminderContracts.IReminderTemplate;
type ReminderTemplateResponse = ReminderContracts.ReminderTemplateResponse;

export class PrismaReminderTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapReminderTemplateToDTO(template: any): ReminderTemplateResponse {
    return {
      uuid: template.uuid,
      groupUuid: template.groupUuid,
      name: template.name,
      description: template.description,
      message: template.message,
      enabled: template.enabled,
      selfEnabled: template.selfEnabled,
      importanceLevel: template.importanceLevel as ImportanceLevel,
      priority: template.priority as ReminderContracts.ReminderPriority,
      category: template.category,
      tags: template.tags ? JSON.parse(template.tags) : [],
      timeConfig: {
        type: template.timeConfigType as
          | 'daily'
          | 'weekly'
          | 'monthly'
          | 'custom'
          | 'absolute'
          | 'relative',
        times: template.timeConfigTimes ? JSON.parse(template.timeConfigTimes) : [],
        weekdays: template.timeConfigWeekdays ? JSON.parse(template.timeConfigWeekdays) : [],
        monthDays: template.timeConfigMonthDays ? JSON.parse(template.timeConfigMonthDays) : [],
        duration: template.timeConfigDuration,
        schedule: template.timeConfigSchedule ? JSON.parse(template.timeConfigSchedule) : undefined,
      },
      notificationSettings: {
        sound: template.notificationSound,
        vibration: template.notificationVibration,
        popup: template.notificationPopup,
        soundFile: template.notificationSoundFile,
        customIcon: template.notificationCustomIcon,
      },
      snoozeConfig: {
        enabled: template.snoozeEnabled,
        defaultMinutes: template.snoozeDefaultMinutes,
        maxCount: template.snoozeMaxCount,
        presetOptions: template.snoozePresetOptions ? JSON.parse(template.snoozePresetOptions) : [],
      },
      lifecycle: {
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        lastTriggered: template.lastTriggered?.toISOString(),
        triggerCount: template.triggerCount,
      },
      analytics: {
        totalTriggers: template.totalTriggers,
        acknowledgedCount: template.acknowledgedCount,
        dismissedCount: template.dismissedCount,
        snoozeCount: template.snoozeCountTotal,
        avgResponseTime: template.avgResponseTime,
      },
      version: template.version,
    };
  }

  // ===== CRUD 操作 =====

  async findById(uuid: string): Promise<ReminderTemplateResponse | null> {
    const template = await this.prisma.reminderTemplate.findUnique({
      where: { uuid },
    });

    return template ? this.mapReminderTemplateToDTO(template) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<ReminderTemplateResponse[]> {
    const templates = await this.prisma.reminderTemplate.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((template) => this.mapReminderTemplateToDTO(template));
  }

  async findByGroupUuid(groupUuid: string): Promise<ReminderTemplateResponse[]> {
    const templates = await this.prisma.reminderTemplate.findMany({
      where: { groupUuid },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((template) => this.mapReminderTemplateToDTO(template));
  }

  async findByCategory(accountUuid: string, category: string): Promise<ReminderTemplateResponse[]> {
    const templates = await this.prisma.reminderTemplate.findMany({
      where: {
        accountUuid,
        category,
      },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((template) => this.mapReminderTemplateToDTO(template));
  }

  async save(accountUuid: string, reminderTemplate: IReminderTemplate): Promise<void> {
    const data = {
      accountUuid,
      groupUuid: reminderTemplate.groupUuid,
      name: reminderTemplate.name,
      description: reminderTemplate.description,
      message: reminderTemplate.message,
      enabled: reminderTemplate.enabled,
      selfEnabled: reminderTemplate.selfEnabled,
      importanceLevel: reminderTemplate.importanceLevel,
      priority: reminderTemplate.priority,
      category: reminderTemplate.category,
      tags: JSON.stringify(reminderTemplate.tags),
      // 时间配置展开
      timeConfigType: reminderTemplate.timeConfig.type,
      timeConfigTimes: JSON.stringify(reminderTemplate.timeConfig.times || []),
      timeConfigWeekdays: JSON.stringify(reminderTemplate.timeConfig.weekdays || []),
      timeConfigMonthDays: JSON.stringify(reminderTemplate.timeConfig.monthDays || []),
      timeConfigDuration: reminderTemplate.timeConfig.duration as number,
      timeConfigSchedule: JSON.stringify(reminderTemplate.timeConfig.schedule || {}),
      // 通知设置展开
      notificationSound: reminderTemplate.notificationSettings?.sound ?? true,
      notificationVibration: reminderTemplate.notificationSettings?.vibration ?? true,
      notificationPopup: reminderTemplate.notificationSettings?.popup ?? true,
      notificationSoundFile: reminderTemplate.notificationSettings?.soundFile,
      notificationCustomIcon: reminderTemplate.notificationSettings?.customIcon,
      // 稍后提醒配置展开
      snoozeEnabled: reminderTemplate.snoozeConfig?.enabled ?? true,
      snoozeDefaultMinutes: reminderTemplate.snoozeConfig?.defaultMinutes ?? 10,
      snoozeMaxCount: reminderTemplate.snoozeConfig?.maxCount ?? 5,
      snoozePresetOptions: JSON.stringify(reminderTemplate.snoozeConfig?.presetOptions || []),
      // 生命周期信息展开
      lastTriggered: reminderTemplate.lifecycle.lastTriggered,
      triggerCount: reminderTemplate.lifecycle.triggerCount,
      // 统计信息展开
      totalTriggers: reminderTemplate.analytics.totalTriggers,
      acknowledgedCount: reminderTemplate.analytics.acknowledgedCount,
      dismissedCount: reminderTemplate.analytics.dismissedCount,
      snoozeCountTotal: reminderTemplate.analytics.snoozeCount,
      avgResponseTime: reminderTemplate.analytics.avgResponseTime,
      // 版本
      version: reminderTemplate.version,
    };

    await this.prisma.reminderTemplate.upsert({
      where: { uuid: reminderTemplate.uuid },
      update: data,
      create: {
        uuid: reminderTemplate.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminderTemplate.delete({
      where: { uuid },
    });
  }

  async updateEnabledStatus(uuid: string, enabled: boolean): Promise<void> {
    await this.prisma.reminderTemplate.update({
      where: { uuid },
      data: { enabled },
    });
  }

  async updateAnalytics(
    uuid: string,
    analytics: {
      totalTriggers?: number;
      acknowledgedCount?: number;
      dismissedCount?: number;
      snoozeCount?: number;
      avgResponseTime?: number;
    },
  ): Promise<void> {
    const updateData: any = {};

    if (analytics.totalTriggers !== undefined) {
      updateData.totalTriggers = analytics.totalTriggers;
    }
    if (analytics.acknowledgedCount !== undefined) {
      updateData.acknowledgedCount = analytics.acknowledgedCount;
    }
    if (analytics.dismissedCount !== undefined) {
      updateData.dismissedCount = analytics.dismissedCount;
    }
    if (analytics.snoozeCount !== undefined) {
      updateData.snoozeCountTotal = analytics.snoozeCount;
    }
    if (analytics.avgResponseTime !== undefined) {
      updateData.avgResponseTime = analytics.avgResponseTime;
    }

    await this.prisma.reminderTemplate.update({
      where: { uuid },
      data: updateData,
    });
  }
}
