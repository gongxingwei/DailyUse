import { TaskTemplate, TaskApplicationService } from '../index';
import { TaskContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

/**
 * Task模块聚合根控制模式使用示例
 * 演示如何通过聚合根管理任务实例的生命周期
 */

// 创建应用服务
const taskApp = new TaskApplicationService();

async function demonstrateAggregateRootPattern() {
  console.log('=== Task模块聚合根控制模式演示 ===\n');

  // 1. 创建任务模板聚合根
  console.log('1. 创建任务模板聚合根...');
  const templateRequest: TaskContracts.CreateTaskTemplateRequest = {
    title: '每日晨练',
    description: '保持健康的晨练习惯',
    timeConfig: {
      time: {
        timeType: 'timed' as TaskContracts.TaskTimeType,
        startTime: '07:00',
        endTime: '08:00',
      },
      date: {
        startDate: new Date().toISOString(),
      },
      schedule: {
        mode: 'recurring' as TaskContracts.TaskScheduleMode,
      },
      timezone: 'Asia/Shanghai',
    },
    reminderConfig: {
      enabled: true,
      minutesBefore: 15,
      methods: ['notification'],
    },
    properties: {
      importance: ImportanceLevel.Vital,
      urgency: UrgencyLevel.High,
      tags: ['健康', '晨练'],
    },
  };

  const template = await taskApp.createTaskTemplate(templateRequest, 'user-123');
  console.log(`✅ 创建模板成功: ${template.title} (${template.uuid})\n`);

  // 2. 通过聚合根创建任务实例
  console.log('2. 通过聚合根创建任务实例...');
  const instanceRequest: TaskContracts.CreateTaskInstanceRequest = {
    templateUuid: template.uuid,
    title: '今日晨练',
    timeConfig: {
      timeType: 'timed' as TaskContracts.TaskTimeType,
      scheduledDate: new Date().toISOString(),
      startTime: '07:00',
      endTime: '08:00',
      estimatedDuration: 60,
      timezone: 'Asia/Shanghai',
    },
    properties: {
      importance: ImportanceLevel.Vital,
      urgency: UrgencyLevel.High,
      tags: ['健康', '晨练'],
    },
  };

  const instanceUuid = await taskApp.createTaskInstance(instanceRequest, 'user-123');
  console.log(`✅ 创建实例成功: ${instanceUuid}\n`);

  // 3. 验证聚合根控制
  console.log('3. 验证聚合根控制...');
  const aggregateTemplate = await taskApp.getTaskTemplateAggregate(template.uuid);
  if (aggregateTemplate) {
    console.log(`模板状态: ${aggregateTemplate.lifecycle?.status}`);
    console.log(`实例数量: ${aggregateTemplate.instances.length}`);
    console.log(`统计信息: ${aggregateTemplate.stats?.totalInstances} 总实例\n`);
  }

  // 4. 通过聚合根完成任务实例
  console.log('4. 通过聚合根完成任务实例...');
  const completeRequest: TaskContracts.CompleteTaskRequest = {
    actualDuration: 55,
    progressPercentage: 100,
    notes: '完成了30分钟慢跑和30分钟拉伸',
  };

  await taskApp.completeTaskInstance(completeRequest, template.uuid, instanceUuid);
  console.log(`✅ 完成实例成功: ${instanceUuid}\n`);

  // 5. 验证实例状态变更
  console.log('5. 验证实例状态变更...');
  const updatedTemplate = await taskApp.getTaskTemplateAggregate(template.uuid);
  if (updatedTemplate) {
    const instance = updatedTemplate.instances.find((inst: any) => inst.uuid === instanceUuid);
    if (instance) {
      console.log(`实例状态: ${instance.execution.status}`);
      console.log(`完成进度: ${instance.execution.progressPercentage}%`);
      console.log(`实际耗时: ${instance.execution.actualDuration}分钟`);
      console.log(`备注: ${instance.execution.notes}\n`);
    }
  }

  // 6. 跨聚合根查询
  console.log('6. 跨聚合根查询任务实例...');
  const instances = await taskApp.queryTaskInstances({
    accountUuid: 'user-123',
    status: ['completed'],
    importance: [ImportanceLevel.Vital],
  });
  console.log(`✅ 查询到 ${instances.length} 个已完成的重要任务实例\n`);

  console.log('=== 聚合根控制模式演示完成 ===');
}

// 运行演示
demonstrateAggregateRootPattern().catch(console.error);
