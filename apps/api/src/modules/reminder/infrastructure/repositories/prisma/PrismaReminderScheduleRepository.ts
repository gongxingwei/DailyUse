/**
 * Prisma Reminder Schedule Repository Implementation
 * Prisma提醒计划仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { ReminderContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type IReminderSchedule = ReminderContracts.IReminderSchedule;
type RecurrenceRule = ReminderContracts.RecurrenceRule;

export class PrismaReminderScheduleRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapReminderScheduleToDTO(schedule: any): IReminderSchedule {
    return {
      uuid: schedule.uuid,
      templateUuid: schedule.templateUuid,
      name: schedule.name,
      description: schedule.description,
      enabled: schedule.enabled,
      nextExecutionTime: schedule.nextExecutionTime,
      lastExecutionTime: schedule.lastExecutionTime,
      executionCount: schedule.executionCount,
      maxExecutions: schedule.maxExecutions,
      recurrenceRule: JSON.parse(schedule.recurrenceRule) as RecurrenceRule,
      timezone: schedule.timezone,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  // ===== CRUD 操作 =====

  async findById(uuid: string): Promise<IReminderSchedule | null> {
    const schedule = await this.prisma.reminderSchedule.findUnique({
      where: { uuid },
    });

    return schedule ? this.mapReminderScheduleToDTO(schedule) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<IReminderSchedule[]> {
    const schedules = await this.prisma.reminderSchedule.findMany({
      where: { accountUuid },
      orderBy: { nextExecutionTime: 'asc' },
    });

    return schedules.map((schedule) => this.mapReminderScheduleToDTO(schedule));
  }

  async findByTemplateUuid(templateUuid: string): Promise<IReminderSchedule[]> {
    const schedules = await this.prisma.reminderSchedule.findMany({
      where: { templateUuid },
      orderBy: { nextExecutionTime: 'asc' },
    });

    return schedules.map((schedule) => this.mapReminderScheduleToDTO(schedule));
  }

  async findEnabledSchedules(accountUuid: string): Promise<IReminderSchedule[]> {
    const schedules = await this.prisma.reminderSchedule.findMany({
      where: {
        accountUuid,
        enabled: true,
      },
      orderBy: { nextExecutionTime: 'asc' },
    });

    return schedules.map((schedule) => this.mapReminderScheduleToDTO(schedule));
  }

  async findDueSchedules(beforeTime?: Date): Promise<IReminderSchedule[]> {
    const cutoffTime = beforeTime || new Date();

    const schedules = await this.prisma.reminderSchedule.findMany({
      where: {
        enabled: true,
        nextExecutionTime: { lte: cutoffTime },
      },
      orderBy: { nextExecutionTime: 'asc' },
    });

    return schedules.map((schedule) => this.mapReminderScheduleToDTO(schedule));
  }

  async save(accountUuid: string, reminderSchedule: IReminderSchedule): Promise<void> {
    const data = {
      accountUuid,
      templateUuid: reminderSchedule.templateUuid,
      name: reminderSchedule.name,
      description: reminderSchedule.description,
      enabled: reminderSchedule.enabled,
      nextExecutionTime: reminderSchedule.nextExecutionTime,
      lastExecutionTime: reminderSchedule.lastExecutionTime,
      executionCount: reminderSchedule.executionCount,
      maxExecutions: reminderSchedule.maxExecutions,
      recurrenceRule: JSON.stringify(reminderSchedule.recurrenceRule),
      timezone: reminderSchedule.timezone,
    };

    await this.prisma.reminderSchedule.upsert({
      where: { uuid: reminderSchedule.uuid },
      update: data,
      create: {
        uuid: reminderSchedule.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminderSchedule.delete({
      where: { uuid },
    });
  }

  async updateNextExecutionTime(uuid: string, nextExecutionTime: Date): Promise<void> {
    await this.prisma.reminderSchedule.update({
      where: { uuid },
      data: {
        nextExecutionTime,
        lastExecutionTime: new Date(),
        executionCount: {
          increment: 1,
        },
      },
    });
  }

  async updateExecutionCount(uuid: string, increment = 1): Promise<void> {
    await this.prisma.reminderSchedule.update({
      where: { uuid },
      data: {
        executionCount: {
          increment,
        },
        lastExecutionTime: new Date(),
      },
    });
  }

  async enableSchedule(uuid: string): Promise<void> {
    await this.prisma.reminderSchedule.update({
      where: { uuid },
      data: { enabled: true },
    });
  }

  async disableSchedule(uuid: string): Promise<void> {
    await this.prisma.reminderSchedule.update({
      where: { uuid },
      data: { enabled: false },
    });
  }

  // ===== 批量操作 =====

  async batchEnable(uuids: string[]): Promise<void> {
    await this.prisma.reminderSchedule.updateMany({
      where: { uuid: { in: uuids } },
      data: { enabled: true },
    });
  }

  async batchDisable(uuids: string[]): Promise<void> {
    await this.prisma.reminderSchedule.updateMany({
      where: { uuid: { in: uuids } },
      data: { enabled: false },
    });
  }

  async batchDelete(uuids: string[]): Promise<void> {
    await this.prisma.reminderSchedule.deleteMany({
      where: { uuid: { in: uuids } },
    });
  }

  // ===== 统计查询 =====

  async getEnabledCount(accountUuid: string): Promise<number> {
    return await this.prisma.reminderSchedule.count({
      where: {
        accountUuid,
        enabled: true,
      },
    });
  }

  async getTotalCount(accountUuid: string): Promise<number> {
    return await this.prisma.reminderSchedule.count({
      where: { accountUuid },
    });
  }

  async getExecutionStats(accountUuid: string): Promise<{
    totalExecutions: number;
    avgExecutionsPerSchedule: number;
    activeSchedules: number;
    inactiveSchedules: number;
  }> {
    const [stats, totalCount, activeCount] = await Promise.all([
      this.prisma.reminderSchedule.aggregate({
        where: { accountUuid },
        _sum: { executionCount: true },
        _avg: { executionCount: true },
      }),
      this.getTotalCount(accountUuid),
      this.getEnabledCount(accountUuid),
    ]);

    return {
      totalExecutions: stats._sum.executionCount || 0,
      avgExecutionsPerSchedule: Math.round((stats._avg.executionCount || 0) * 100) / 100,
      activeSchedules: activeCount,
      inactiveSchedules: totalCount - activeCount,
    };
  }

  // ===== 清理操作 =====

  async cleanupCompletedSchedules(accountUuid: string): Promise<number> {
    // 清理已完成的一次性计划（达到最大执行次数）
    const result = await this.prisma.reminderSchedule.deleteMany({
      where: {
        accountUuid,
        enabled: false,
        maxExecutions: { not: null },
        executionCount: { gte: this.prisma.reminderSchedule.fields.maxExecutions },
      },
    });

    return result.count;
  }

  async resetExecutionCounts(accountUuid: string): Promise<number> {
    const result = await this.prisma.reminderSchedule.updateMany({
      where: { accountUuid },
      data: {
        executionCount: 0,
        lastExecutionTime: null,
      },
    });

    return result.count;
  }
}
