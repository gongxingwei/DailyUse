/**
 * Schedule Debug Controller
 * 调度模块调试控制器 - 仅用于开发和调试
 */

import type { Request, Response } from 'express';
import { eventBus } from '@dailyuse/utils';
import { createLogger } from '@dailyuse/utils';
import jwt from 'jsonwebtoken';

const logger = createLogger('ScheduleDebugController');

export class ScheduleDebugController {
  /**
   * 从请求中提取用户账户UUID
   */
  private getAccountUuid(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('[Debug] Authentication attempt without Bearer token');
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded?.accountUuid) {
      logger.warn('[Debug] Invalid token: missing accountUuid');
      throw new Error('Invalid token: missing accountUuid');
    }

    return decoded.accountUuid;
  }

  /**
   * 手动触发测试提醒
   * POST /api/v1/schedules/debug/trigger-reminder
   *
   * 🔥 正确的测试流程：
   * 1. 前端调用此接口
   * 2. 后端通过 SSE 推送事件到前端（而不是后端的 eventBus）
   * 3. 前端 SSE 客户端接收事件
   * 4. SSE 客户端转发到前端事件总线
   * 5. Notification 模块监听事件并播放声音
   */
  triggerTestReminder = async (req: Request, res: Response): Promise<Response> => {
    try {
      const accountUuid = this.getAccountUuid(req);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });

      logger.info('🧪 [Debug] 手动触发测试提醒', { accountUuid, timestamp: timeStr });

      // 创建测试提醒数据
      const reminderData = {
        id: `debug-reminder-${Date.now()}`,
        title: '🧪 调试测试提醒',
        message: `手动触发的测试提醒 - 当前时间: ${timeStr}`,
        type: 'GENERAL_REMINDER',
        priority: 'HIGH',
        alertMethods: ['POPUP', 'SOUND', 'SYSTEM_NOTIFICATION'],
        soundVolume: 80,
        popupDuration: 15,
        allowSnooze: true,
        snoozeOptions: [1, 5, 10],
        customActions: [],
        timestamp: now.toISOString(),
        source: 'manual-debug',
      };

      logger.debug('🔔 [Debug] 准备通过 SSE 推送测试提醒', { reminderData });

      // 🔥 通过 SSE 推送事件到前端（使用后端的 eventBus）
      // SSEController 监听此事件并转发到前端 SSE 连接
      eventBus.emit('reminder-triggered', reminderData);

      logger.info('✅ [Debug] 测试提醒已发送到 SSE 广播队列', { accountUuid });

      return res.status(200).json({
        success: true,
        code: 'DEBUG_REMINDER_TRIGGERED',
        message: '测试提醒已通过 SSE 推送',
        data: {
          reminderData,
          triggeredAt: now.toISOString(),
          sseEventSent: 'schedule:reminder-triggered',
          accountUuid,
          note: '请检查浏览器控制台和 SSE 连接状态',
        },
      });
    } catch (error) {
      logger.error('❌ [Debug] 触发测试提醒失败:', error);
      return res.status(500).json({
        success: false,
        code: 'DEBUG_ERROR',
        message: error instanceof Error ? error.message : '触发测试提醒失败',
      });
    }
  };

  /**
   * 获取调试信息
   * GET /api/v1/schedules/debug/info
   */
  getDebugInfo = async (req: Request, res: Response): Promise<Response> => {
    try {
      const accountUuid = this.getAccountUuid(req);

      logger.debug('[Debug] 获取调试信息', { accountUuid });

      const debugInfo = {
        timestamp: new Date().toISOString(),
        accountUuid,
        eventBusActive: !!eventBus,
        availableEvents: [
          'ui:show-popup-reminder',
          'ui:play-reminder-sound',
          'system:show-notification',
          'reminder-triggered',
        ],
        endpoints: {
          triggerTestReminder: 'POST /api/v1/schedules/debug/trigger-reminder',
          getDebugInfo: 'GET /api/v1/schedules/debug/info',
        },
      };

      return res.status(200).json({
        success: true,
        code: 'DEBUG_INFO',
        message: '调试信息获取成功',
        data: debugInfo,
      });
    } catch (error) {
      logger.error('❌ [Debug] 获取调试信息失败:', error);
      return res.status(500).json({
        success: false,
        code: 'DEBUG_ERROR',
        message: error instanceof Error ? error.message : '获取调试信息失败',
      });
    }
  };
}
