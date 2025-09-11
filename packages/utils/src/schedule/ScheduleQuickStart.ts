/**
 * Schedule Module Quick Start Example
 * @description Schedule模块快速开始示例
 * @author DailyUse Team
 * @date 2025-01-09
 */

import { scheduleSystemIntegration } from '@dailyuse/utils';
import { AlertMethod, SchedulePriority } from '@dailyuse/contracts';

/**
 * 快速开始示例
 */
export class ScheduleQuickStart {
  /**
   * 示例1: 创建任务提醒
   */
  static example1_TaskReminder(): void {
    console.log('=== 示例1: 创建任务提醒 ===');

    // 创建一个30分钟后的任务提醒
    const reminderId = scheduleSystemIntegration.createTaskReminder(
      'task-123',
      '完成项目报告',
      new Date(Date.now() + 30 * 60 * 1000), // 30分钟后
      {
        message: '请及时完成项目报告的编写工作',
        alertMethods: [AlertMethod.POPUP, AlertMethod.SOUND],
        priority: SchedulePriority.HIGH,
      },
    );

    console.log('任务提醒已创建，ID:', reminderId);

    // 5分钟后延后提醒
    setTimeout(
      () => {
        const snoozed = scheduleSystemIntegration.snoozeReminder(reminderId, 10);
        console.log('提醒延后结果:', snoozed ? '成功' : '失败');
      },
      5 * 60 * 1000,
    );
  }

  /**
   * 示例2: 创建目标提醒
   */
  static example2_GoalReminder(): void {
    console.log('=== 示例2: 创建目标提醒 ===');

    // 创建一个24小时后的目标提醒
    const reminderId = scheduleSystemIntegration.createGoalReminder(
      'goal-456',
      '学习新技能',
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
      {
        message: '记得每天学习新技术，进步一点点',
        alertMethods: [AlertMethod.POPUP],
        priority: SchedulePriority.NORMAL,
      },
    );

    console.log('目标提醒已创建，ID:', reminderId);
  }

  /**
   * 示例3: 创建快速提醒
   */
  static example3_QuickReminder(): void {
    console.log('=== 示例3: 创建快速提醒 ===');

    // 创建一个15分钟后的会议提醒
    const reminderId = scheduleSystemIntegration.createQuickReminder(
      '会议提醒',
      '15分钟后开始项目会议，请做好准备',
      new Date(Date.now() + 15 * 60 * 1000),
      {
        priority: SchedulePriority.URGENT,
        alertMethods: [AlertMethod.POPUP, AlertMethod.SOUND, AlertMethod.DESKTOP_FLASH],
      },
    );

    console.log('快速提醒已创建，ID:', reminderId);
  }

  /**
   * 示例4: 配置提醒系统
   */
  static example4_ConfigureSystem(): void {
    console.log('=== 示例4: 配置提醒系统 ===');

    // 设置静音时段 (晚上10点到早上8点)
    scheduleSystemIntegration.configureAlertSystem({
      enabled: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
    });

    console.log('提醒系统配置已更新');
  }

  /**
   * 示例5: 查询即将到来的提醒
   */
  static example5_QueryUpcoming(): void {
    console.log('=== 示例5: 查询即将到来的提醒 ===');

    // 查询1小时内的提醒
    const upcoming = scheduleSystemIntegration.getUpcomingReminders(60);

    console.log(`找到 ${upcoming.length} 个即将到来的提醒:`);
    upcoming.forEach((item) => {
      console.log(`- ${item.task.name}: ${item.minutesUntil} 分钟后`);
    });
  }

  /**
   * 示例6: 测试提醒方式
   */
  static async example6_TestAlerts(): Promise<void> {
    console.log('=== 示例6: 测试提醒方式 ===');

    const methods = [AlertMethod.POPUP, AlertMethod.SOUND, AlertMethod.SYSTEM_NOTIFICATION];

    for (const method of methods) {
      try {
        const success = await scheduleSystemIntegration.testAlertMethod(method);
        console.log(`${method} 测试结果: ${success ? '成功' : '失败'}`);
      } catch (error) {
        console.log(`${method} 测试失败:`, error);
      }
    }
  }

  /**
   * 示例7: 监听提醒事件
   */
  static example7_EventHandling(): void {
    console.log('=== 示例7: 监听提醒事件 ===');

    // 监听所有提醒触发事件
    scheduleSystemIntegration['scheduleService'].on('reminder-triggered', (data) => {
      console.log('收到提醒触发事件:', {
        title: data.title,
        message: data.message,
        methods: data.alertMethods,
        priority: data.priority,
      });
    });

    // 监听特定类型的提醒
    scheduleSystemIntegration['scheduleService'].on('task-reminder', (data) => {
      console.log('收到任务提醒:', data.title);
    });

    scheduleSystemIntegration['scheduleService'].on('goal-reminder', (data) => {
      console.log('收到目标提醒:', data.title);
    });

    console.log('提醒事件监听器已设置');
  }

  /**
   * 示例8: 系统状态监控
   */
  static example8_SystemStatus(): void {
    console.log('=== 示例8: 系统状态监控 ===');

    const status = scheduleSystemIntegration.getSystemStatus();

    console.log('调度系统状态:');
    console.log('- 总任务数:', status.schedule.totalTasks);
    console.log('- 活跃任务数:', status.schedule.scheduledTasks);
    console.log('- 即将提醒数:', status.schedule.upcomingTasks);

    console.log('提醒系统配置:');
    console.log('- 启用状态:', status.alert.enabled);
    console.log(
      '- 静音时段:',
      status.alert.quietHours.enabled
        ? `${status.alert.quietHours.start} - ${status.alert.quietHours.end}`
        : '未启用',
    );
  }

  /**
   * 示例9: 清理和维护
   */
  static example9_Cleanup(): void {
    console.log('=== 示例9: 清理和维护 ===');

    // 清理过期任务
    const cleaned = scheduleSystemIntegration.cleanup();
    console.log(`清理了 ${cleaned} 个过期任务`);

    // 设置定期清理
    setInterval(
      () => {
        const count = scheduleSystemIntegration.cleanup();
        if (count > 0) {
          console.log(`定期清理: 移除了 ${count} 个过期任务`);
        }
      },
      60 * 60 * 1000,
    ); // 每小时清理一次
  }

  /**
   * 运行所有示例
   */
  static async runAllExamples(): Promise<void> {
    console.log('🚀 开始运行 Schedule 模块示例\n');

    // 设置事件监听
    this.example7_EventHandling();

    // 配置系统
    this.example4_ConfigureSystem();

    // 创建各种提醒
    this.example1_TaskReminder();
    this.example2_GoalReminder();
    this.example3_QuickReminder();

    // 查询和监控
    setTimeout(() => {
      this.example5_QueryUpcoming();
      this.example8_SystemStatus();
    }, 1000);

    // 测试提醒方式
    await this.example6_TestAlerts();

    // 清理
    this.example9_Cleanup();

    console.log('\n✅ 所有示例运行完成');
    console.log('请等待提醒触发，或查看控制台输出');
  }
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  ScheduleQuickStart.runAllExamples().catch(console.error);
}
