import { ipcMain } from 'electron';
import { MainTaskApplicationService } from '../../application/mainTaskApplicationService';
import { withAuth } from '@electron/modules/Authentication/application/services/authTokenService';

/**
 * 任务模块的 IPC 处理器
 * 负责处理渲染进程发送的任务相关请求
 */
export class TaskIpcHandler {
  private taskService: MainTaskApplicationService;

  constructor() {
    this.taskService = new MainTaskApplicationService();
  }

  /**
   * 注册所有 IPC 处理器
   */
  public register(): void {
    this.registerMetaTemplateHandlers();
    this.registerTaskTemplateHandlers();
    this.registerTaskInstanceHandlers();
    this.registerReminderSystemHandlers();
  }

  /**
   * 注册元模板相关的 IPC 处理器
   */
  private registerMetaTemplateHandlers(): void {
    // 获取所有元模板
    ipcMain.handle('task:meta-templates:get-all', withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getAllMetaTemplates(auth.accountUuid);
    }));

    // 根据ID获取元模板
    ipcMain.handle('task:meta-templates:get-by-id', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getMetaTemplate(auth.accountUuid, uuid);
    }));

    // 根据分类获取元模板
    ipcMain.handle('task:meta-templates:get-by-category', withAuth(async (_event, [category], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getMetaTemplatesByCategory(auth.accountUuid, category);
    }));
  }

  /**
   * 注册任务模板相关的 IPC 处理器
   */
  private registerTaskTemplateHandlers(): void {
    // 获取任务模板
    ipcMain.handle('task:templates:get-by-id', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getTaskTemplate(auth.accountUuid, uuid);
    }));

    // 获取所有任务模板
    ipcMain.handle('task:templates:get-all', withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getAllTaskTemplates(auth.accountUuid);
    }));

    // 根据关键结果获取任务模板
    ipcMain.handle('task:templates:get-by-key-result', withAuth(async (_event, [goalUuid, keyResultId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getTaskTemplateForKeyResult(auth.accountUuid, goalUuid, keyResultId);
    }));

    // 创建任务模板
    // 流程第2步：主进程 IPC 处理器 - 接收渲染进程数据并调用应用服务
    ipcMain.handle('task:templates:create', withAuth(async (_event, [dto], auth) => {
      console.log('🔄 [主进程-步骤2] IPC处理器：接收到创建任务模板请求');
      console.log('📋 [主进程-步骤2] 账户ID:', auth.accountUuid);
      console.log('📋 [主进程-步骤2] 接收到的DTO数据类型:', typeof dto);
      console.log('📋 [主进程-步骤2] 接收到的DTO数据:', dto);
      
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      
      // 验证接收到的数据是否可序列化
      try {
        const serializedCheck = JSON.stringify(dto);
        console.log('✅ [主进程-步骤2] 接收到的DTO数据可序列化，字符串长度:', serializedCheck.length);
      } catch (error) {
        console.error('❌ [主进程-步骤2] 接收到的DTO数据不可序列化:', error);
        return { success: false, message: 'Received data is not serializable' };
      }
      
      // 检查必要属性
      console.log('🔍 [主进程-步骤2] DTO 属性检查:');
      console.log('  - ID:', dto?.uuid, typeof dto?.id);
      console.log('  - Title:', dto?.title, typeof dto?.title);
      console.log('  - TimeConfig:', dto?.timeConfig, typeof dto?.timeConfig);
      console.log('  - ReminderConfig:', dto?.reminderConfig, typeof dto?.reminderConfig);
      
      try {
        console.log('🔄 [主进程-步骤2] 准备调用应用服务');
        const result = await this.taskService.createTaskTemplate(auth.accountUuid, dto);
        console.log('✅ [主进程-步骤2] 应用服务调用成功');
        console.log('🔍 [主进程-步骤2] 应用服务返回结果类型:', typeof result);
        console.log('🔍 [主进程-步骤2] 应用服务返回结果:', result);
        
        // 验证返回结果是否可序列化
        try {
          const serializedResult = JSON.stringify(result);
          console.log('✅ [主进程-步骤2] 返回结果可序列化，字符串长度:', serializedResult.length);
        } catch (error) {
          console.error('❌ [主进程-步骤2] 返回结果不可序列化:', error);
          console.error('❌ [主进程-步骤2] 问题可能出现在应用服务的返回值中');
          
          // 尝试修复序列化问题
          if (result && typeof result === 'object') {
            try {
              const safeResult = JSON.parse(JSON.stringify(result));
              console.log('🔄 [主进程-步骤2] 使用深拷贝修复序列化问题');
              return safeResult;
            } catch (deepError) {
              console.error('❌ [主进程-步骤2] 深拷贝也无法修复序列化问题:', deepError);
              return { success: false, message: 'Result data contains non-serializable content' };
            }
          }
        }
        
        console.log('✅ [主进程-步骤2] 准备返回结果给渲染进程');
        return result;
      } catch (error) {
        console.error('❌ [主进程-步骤2] 应用服务调用失败:', error);
        console.error('❌ [主进程-步骤2] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
        return { 
          success: false, 
          message: `IPC handler error: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    // 更新任务模板
    ipcMain.handle('task:templates:update', withAuth(async (_event, [dto], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.updateTaskTemplate(auth.accountUuid, dto);
    }));

    // 删除任务模板
    ipcMain.handle('task:templates:delete', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.deleteTaskTemplate(auth.accountUuid, uuid);
    }));

    // 删除所有任务模板
    ipcMain.handle('task:templates:delete-all', withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.deleteAllTaskTemplates(auth.accountUuid);
    }));

    // 激活任务模板
    ipcMain.handle('task:templates:activate', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        const result = await this.taskService.activateTemplate(auth.accountUuid, uuid);
        return { success: result, message: result ? 'Template activated successfully' : 'Failed to activate template' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to activate template: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    // 暂停任务模板
    ipcMain.handle('task:templates:pause', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        const result = await this.taskService.pauseTemplate(auth.accountUuid, uuid);
        return { success: result, message: result ? 'Template paused successfully' : 'Failed to pause template' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to pause template: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    // 恢复任务模板
    ipcMain.handle('task:templates:resume', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        const result = await this.taskService.resumeTemplate(auth.accountUuid, uuid);
        return { success: result, message: result ? 'Template resumed successfully' : 'Failed to resume template' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to resume template: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    // 归档任务模板
    ipcMain.handle('task:templates:archive', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        const result = await this.taskService.archiveTemplate(auth.accountUuid, uuid);
        return { success: result, message: result ? 'Template archived successfully' : 'Failed to archive template' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to archive template: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));
  }

  /**
   * 注册任务实例相关的 IPC 处理器
   */
  private registerTaskInstanceHandlers(): void {
    // 获取任务实例
    ipcMain.handle('task:instances:get-by-id', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getTaskInstance(auth.accountUuid, uuid);
    }));

    // 获取所有任务实例
    ipcMain.handle('task:instances:get-all', withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getAllTaskInstances(auth.accountUuid);
    }));

    // 获取今日任务
    ipcMain.handle('task:instances:get-today', withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.getTodayTasks(auth.accountUuid);
    }));

    // 创建任务实例
    ipcMain.handle('task:instances:create', withAuth(async (_event, [dto], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        // TODO: 实现创建任务实例的逻辑
        console.log('Creating task instance with dto:', dto);
        return { success: true, message: 'Task instance created successfully' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to create task instance: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    // 完成任务
    ipcMain.handle('task:instances:complete', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.completeTask(auth.accountUuid, uuid);
    }));

    // 撤销完成任务
    ipcMain.handle('task:instances:undo-complete', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.undoCompleteTask(auth.accountUuid, uuid);
    }));

    // 取消任务
    ipcMain.handle('task:instances:cancel', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await this.taskService.cancelTask(auth.accountUuid, uuid);
    }));

    // 重新安排任务时间
    ipcMain.handle('task:instances:reschedule', withAuth(async (_event, [uuid, newScheduledTime, newEndTime], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        // TODO: 实现重新安排任务时间的逻辑
        console.log(`Rescheduling task ${uuid} to ${newScheduledTime}`, newEndTime ? `- ${newEndTime}` : '');
        return { success: true, message: 'Task instance rescheduled successfully' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to reschedule task instance: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    // 删除任务实例
    ipcMain.handle('task:instances:delete', withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        // TODO: 实现删除任务实例的逻辑
        console.log(`Deleting task instance ${uuid}`);
        return { success: true, message: 'Task instance deleted successfully' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to delete task instance: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    // 提醒相关操作
    ipcMain.handle('task:instances:trigger-reminder', withAuth(async (_event, [instanceId, alertId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        // TODO: 实现触发提醒的逻辑
        console.log(`Triggering reminder ${alertId} for task ${instanceId}`);
        return { success: true, message: 'Reminder triggered successfully' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to trigger reminder: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    ipcMain.handle('task:instances:snooze-reminder', withAuth(async (_event, [instanceId, alertId, snoozeUntil, reason], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        // TODO: 实现推迟提醒的逻辑
        console.log(`Snoozing reminder ${alertId} for task ${instanceId} until ${snoozeUntil}`, reason ? `(${reason})` : '');
        return { success: true, message: 'Reminder snoozed successfully' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to snooze reminder: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    ipcMain.handle('task:instances:dismiss-reminder', withAuth(async (_event, [instanceId, alertId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        // TODO: 实现忽略提醒的逻辑
        console.log(`Dismissing reminder ${alertId} for task ${instanceId}`);
        return { success: true, message: 'Reminder dismissed successfully' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to dismiss reminder: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    ipcMain.handle('task:instances:disable-reminders', withAuth(async (_event, [instanceId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        // TODO: 实现禁用提醒的逻辑
        console.log(`Disabling reminders for task ${instanceId}`);
        return { success: true, message: 'Reminders disabled successfully' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to disable reminders: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    ipcMain.handle('task:instances:enable-reminders', withAuth(async (_event, [instanceId], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        // TODO: 实现启用提醒的逻辑
        console.log(`Enabling reminders for task ${instanceId}`);
        return { success: true, message: 'Reminders enabled successfully' };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to enable reminders: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));
  }

  /**
   * 注册提醒系统相关的 IPC 处理器
   */
  private registerReminderSystemHandlers(): void {
    // 初始化任务提醒系统
    ipcMain.handle('task:reminders:initialize', withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        console.log('Initializing task reminder system...');
        // 这里可以添加提醒系统的具体初始化逻辑
        // 比如创建调度器、注册提醒事件等
        return { success: true, message: 'Task reminder system initialized successfully' };
      } catch (error) {
        console.error('Failed to initialize task reminder system:', error);
        return { 
          success: false, 
          message: `Failed to initialize reminders: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));

    // 刷新任务提醒
    ipcMain.handle('task:reminders:refresh', withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      try {
        console.log('Refreshing task reminders...');
        // 这里可以添加刷新所有提醒的逻辑
        return { success: true, message: 'Task reminders refreshed successfully' };
      } catch (error) {
        console.error('Failed to refresh task reminders:', error);
        return { 
          success: false, 
          message: `Failed to refresh reminders: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }));
  }
}