import nodeSchedule from 'node-schedule';
import { notificationService } from '@electron/shared/notification';
import { ImportanceLevel } from '@dailyuse/contracts';
import type { RecurrenceRule as NodeScheduleRule } from 'node-schedule';
import type {
  RecurrenceRule as MyRecurrenceRule,
  RecurrenceSegment,
} from '@common/shared/types/recurrenceRule';

/**
 * ReminderPayload
 * @description 定时提醒任务的参数
 * @property uuid 唯一ID
 * @property title 标题
 * @property body 内容
 * @property importanceLevel 重要级别
 */
export interface ReminderPayload {
  uuid: string;
  title: string;
  body: string;
  importanceLevel: ImportanceLevel;
}

/**
 * ReminderScheduleService
 * @description 负责定时提醒任务的创建、取消、查询等调度管理
 * 用法示例：
 *   await reminderScheduleService.createReminderScheduleByDate(date, payload);
 *   await reminderScheduleService.createReminderScheduleByRule(rule, payload);
 *   reminderScheduleService.cancelReminderSchedule(uuid);
 *   reminderScheduleService.getScheduleInfo(uuid);
 */
export class ReminderScheduleService {
  private static instance: ReminderScheduleService;
  private scheduleJobs = new Map<string, nodeSchedule.Job>();

  /**
   * 获取单例实例
   */
  static getInstance(): ReminderScheduleService {
    if (!this.instance) {
      this.instance = new ReminderScheduleService();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 创建一次性定时提醒任务
   * @param date Date 触发时间
   * @param payload ReminderPayload 任务参数
   * @returns Promise<void>
   * @example
   * await reminderScheduleService.createReminderScheduleByDate(new Date(), { uuid, title, body, importanceLevel });
   */
  async createReminderScheduleByDate(date: Date, payload: ReminderPayload): Promise<void> {
    try {
      // 如果已存在相同ID的任务，先删除
      if (this.scheduleJobs.has(payload.uuid)) {
        this.cancelReminderSchedule(payload.uuid);
      }
      const job = nodeSchedule.scheduleJob(date, () => {
        notificationService.showNotification({
          uuid: payload.uuid,
          title: payload.title,
          body: payload.body,
          importance: payload.importanceLevel,
        });
      });
      this.scheduleJobs.set(payload.uuid, job);
    } catch (error) {
      console.error('ReminderScheduleService - createReminder Error:', error);
    }
  }

  /**
   * 创建 Cron 表达式定时提醒任务
   * @param cron string Cron表达式
   * @param payload ReminderPayload 任务参数
   * @returns Promise<void>
   * @example
   * await reminderScheduleService.createReminderScheduleByCron("0 9 * * *", { uuid, title, body, importanceLevel });
   */
  async createReminderScheduleByCron(cron: string, payload: ReminderPayload): Promise<void> {
    try {
      if (this.scheduleJobs.has(payload.uuid)) {
        this.cancelReminderSchedule(payload.uuid);
      }
      const job = nodeSchedule.scheduleJob(cron, () => {
        notificationService.showNotification({
          uuid: payload.uuid,
          title: payload.title,
          body: payload.body,
          importance: payload.importanceLevel,
        });
      });
      this.scheduleJobs.set(payload.uuid, job);
    } catch (error) {
      console.error('ReminderScheduleService - createReminder Error:', error);
    }
  }

  /**
   * 创建自定义规则定时提醒任务
   * @param rule MyRecurrenceRule 自定义规则对象
   * @param payload ReminderPayload 任务参数
   * @returns Promise<void>
   * @example
   * await reminderScheduleService.createReminderScheduleByRule(rule, { uuid, title, body, importanceLevel });
   */
  async createReminderScheduleByRule(
    rule: MyRecurrenceRule,
    payload: ReminderPayload,
  ): Promise<void> {
    try {
      if (this.scheduleJobs.has(payload.uuid)) {
        this.cancelReminderSchedule(payload.uuid);
      }
      const nodeRule = this.myRecurrenceRuleToNodeScheduleRule(rule);
      const job = nodeSchedule.scheduleJob(payload.uuid, nodeRule, () => {
        notificationService.showNotification({
          uuid: payload.uuid,
          title: payload.title,
          body: payload.body,
          importance: payload.importanceLevel,
        });
      });
      console.log('【ReminderScheduleService】创建定时任务:', {
        uuid: payload.uuid,
        rule,
        nextInvocation: job.nextInvocation(),
      });
      this.scheduleJobs.set(payload.uuid, job);
    } catch (error) {
      console.error('ReminderScheduleService - createReminder Error:', error);
    }
  }

  /**
   * 取消定时任务
   * @param uuid string 任务唯一ID
   * @returns void
   * @example
   * reminderScheduleService.cancelReminderSchedule(uuid);
   */
  cancelReminderSchedule(uuid: string): void {
    try {
      const job = this.scheduleJobs.get(uuid);
      if (job) {
        job.cancel();
        this.scheduleJobs.delete(uuid);
      }
    } catch (error) {
      console.error('ReminderScheduleService - cancelReminder Error:', error);
    }
  }

  /**
   * 获取所有调度任务ID
   * @returns string[] 所有任务ID数组
   * @example
   * const ids = reminderScheduleService.getScheduleIds();
   */
  getScheduleIds(): string[] {
    return Array.from(this.scheduleJobs.keys());
  }

  /**
   * 获取调度任务信息
   * @param uuid string 任务唯一ID
   * @returns { exists: boolean, nextInvocation: Date | null }
   * @example
   * const info = reminderScheduleService.getScheduleInfo(uuid);
   * // info = { exists: true, nextInvocation: Date }
   */
  getScheduleInfo(uuid: string): {
    exists: boolean;
    nextInvocation: Date | null;
  } {
    const job = this.scheduleJobs.get(uuid);
    if (!job) {
      return { exists: false, nextInvocation: null };
    }
    return {
      exists: true,
      nextInvocation: job.nextInvocation(),
    };
  }

  /**
   * 将自定义 RecurrenceRule 转为 node-schedule 的 RecurrenceRule
   * @param rule MyRecurrenceRule 自定义规则对象
   * @returns NodeScheduleRule node-schedule 规则对象
   * @example
   * const nodeRule = reminderScheduleService.myRecurrenceRuleToNodeScheduleRule(rule);
   */
  myRecurrenceRuleToNodeScheduleRule(rule: MyRecurrenceRule): NodeScheduleRule {
    const nodeRule = new nodeSchedule.RecurrenceRule();

    /**
     * 工具函数：处理 RecurrenceSegment（支持 Range 类型）
     * @param seg RecurrenceSegment
     * @returns number | number[]
     * @example
     * parseSegment({ start: 1, end: 5, step: 1 }) // [1,2,3,4,5]
     * parseSegment([1,2,3]) // [1,2,3]
     */
    const parseSegment = (seg: RecurrenceSegment): number | number[] => {
      if (Array.isArray(seg)) {
        return seg.map(parseSegment).flat();
      }
      if (
        typeof seg === 'object' &&
        seg !== null &&
        typeof seg.start === 'number' &&
        typeof seg.end === 'number'
      ) {
        // Range 类型
        const arr: number[] = [];
        for (let i = seg.start; i <= seg.end; i += seg.step || 1) {
          arr.push(i);
        }
        return arr;
      }
      return seg as number;
    };

    if (rule.second !== undefined) nodeRule.second = parseSegment(rule.second);
    if (rule.minute !== undefined) nodeRule.minute = parseSegment(rule.minute);
    if (rule.hour !== undefined) nodeRule.hour = parseSegment(rule.hour);
    if (rule.date !== undefined) nodeRule.date = parseSegment(rule.date);
    if (rule.month !== undefined) nodeRule.month = parseSegment(rule.month);
    if (rule.year !== undefined) nodeRule.year = parseSegment(rule.year);
    if (rule.dayOfWeek !== undefined) nodeRule.dayOfWeek = parseSegment(rule.dayOfWeek);

    return nodeRule;
  }
}

/**
 * ReminderScheduleService 单例实例
 * 用法：import { reminderScheduleService } from '.../reminderScheduleService'
 */
export const reminderScheduleService = ReminderScheduleService.getInstance();
