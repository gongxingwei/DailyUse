/**
 * Task 模块初始化和持久化功能测试
 */

import { useTaskStore } from './presentation/stores/taskStore';
import { getTaskWebService } from './index';

/**
 * 测试Task Store的初始化和持久化功能
 */
export async function testTaskPersistence() {
  console.log('🧪 开始测试Task模块初始化和持久化功能...');

  try {
    // 1. 测试Store初始化
    const taskStore = useTaskStore();
    console.log('📦 Task Store 实例创建成功');

    // 2. 测试Store初始化方法
    taskStore.initialize();
    console.log('✅ Task Store 初始化完成');
    console.log(`📊 当前状态: 
      - 模板数量: ${taskStore.getAllTaskTemplates.length}
      - 实例数量: ${taskStore.getAllTaskInstances.length}  
      - 元模板数量: ${taskStore.getAllTaskMetaTemplates.length}
      - 是否已初始化: ${taskStore.isInitialized}
      - 最后同步时间: ${taskStore.lastSyncTime}`);

    // 3. 测试添加一些测试数据
    const testTemplate = {
      uuid: 'test-template-1',
      accountUuid: 'test-account',
      title: '测试任务模板',
      description: '这是一个测试用的任务模板',
      timeConfig: {
        time: {
          timeType: 'fixed' as const,
          startTime: '09:00',
          endTime: '10:00',
        },
        date: {
          startDate: new Date().toISOString(),
        },
        schedule: {
          mode: 'once' as const,
          intervalDays: 1,
        },
        timezone: 'Asia/Shanghai',
      },
      reminderConfig: {
        enabled: true,
        reminderTimes: ['09:00'],
        snoozeSettings: {
          snoozeOptions: [5, 10, 15],
          maxSnoozeCount: 3,
        },
      },
      properties: {
        priority: {
          importance: 'medium' as const,
          urgency: 'medium' as const,
        },
        tags: ['测试'],
        estimatedDuration: 60,
      },
      goalLinks: [],
      lifecycle: {
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      stats: {
        totalInstances: 0,
        completedInstances: 0,
        successRate: 0,
        averageCompletionTime: 0,
      },
    };

    const testInstance = {
      uuid: 'test-instance-1',
      templateUuid: 'test-template-1',
      accountUuid: 'test-account',
      title: '测试任务实例',
      description: '这是一个测试用的任务实例',
      timeConfig: {
        timeType: 'fixed' as const,
        scheduledDate: new Date().toISOString(),
        startTime: '09:00',
        endTime: '10:00',
        estimatedDuration: 60,
        timezone: 'Asia/Shanghai',
      },
      reminderStatus: {
        enabled: true,
        status: 'pending' as const,
        snoozeCount: 0,
      },
      execution: {
        status: 'pending' as const,
        progressPercentage: 0,
      },
      properties: {
        priority: {
          importance: 'medium' as const,
          urgency: 'medium' as const,
        },
        tags: ['测试'],
        estimatedDuration: 60,
      },
      goalLinks: [],
    };

    // 4. 添加测试数据到Store
    taskStore.addTaskTemplate(testTemplate);
    taskStore.addTaskInstance(testInstance);
    taskStore.updateLastSyncTime();

    console.log('✅ 测试数据添加成功');
    console.log(`📊 更新后状态:
      - 模板数量: ${taskStore.getAllTaskTemplates.length}
      - 实例数量: ${taskStore.getAllTaskInstances.length}
      - 最后同步时间: ${taskStore.lastSyncTime}`);

    // 5. 测试缓存刷新逻辑
    const shouldRefresh = taskStore.shouldRefreshCache();
    console.log(`🔄 是否需要刷新缓存: ${shouldRefresh}`);

    // 6. 测试Web应用服务
    const taskService = getTaskWebService;
    console.log('🔧 Task Web Service 获取成功');

    // 7. 测试模块初始化
    await taskService.initializeModule();
    console.log('✅ Task 模块初始化完成');

    // 8. 检查持久化效果（数据应该已经通过pinia persist插件保存到localStorage）
    const persistedData = localStorage.getItem('task-store');
    if (persistedData) {
      console.log('💾 数据已成功持久化到localStorage');
      console.log('📏 持久化数据大小:', persistedData.length, '字符');
    } else {
      console.log('⚠️ 未找到持久化数据');
    }

    console.log('🎉 Task模块初始化和持久化功能测试完成！');
    return true;
  } catch (error) {
    console.error('❌ Task模块测试失败:', error);
    return false;
  }
}

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
  // 延迟执行，确保Vue应用已初始化
  setTimeout(() => {
    testTaskPersistence();
  }, 1000);
}
