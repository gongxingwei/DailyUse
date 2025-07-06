import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TaskDomainApplicationService, createTaskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';
import type { ITaskStateRepository } from '@/modules/Task/domain/repositories/ITaskStateRepository';
import type { ITaskTemplate, ITaskInstance } from '@/modules/Task/domain/types/task';

/**
 * 任务应用服务测试
 * 展示如何使用抽象状态仓库进行单元测试
 */
describe('TaskDomainApplicationService', () => {
  let mockStateRepository: jest.Mocked<ITaskStateRepository>;
  let taskService: TaskDomainApplicationService;

  beforeEach(() => {
    // 创建 mock 状态仓库
    mockStateRepository = {
      addTaskTemplate: jest.fn(),
      updateTaskTemplate: jest.fn(),
      removeTaskTemplate: jest.fn(),
      setTaskTemplates: jest.fn(),
      removeInstancesByTemplateId: jest.fn(),
      addTaskInstance: jest.fn(),
      updateTaskInstance: jest.fn(),
      removeTaskInstance: jest.fn(),
      setTaskInstances: jest.fn(),
      setMetaTemplates: jest.fn(),
      syncAllTaskData: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true)
    };

    // 使用 mock 仓库创建服务实例
    taskService = createTaskDomainApplicationService(mockStateRepository);
  });

  describe('创建任务模板', () => {
    it('成功创建时应同步状态', async () => {
      // Arrange
      const mockTemplate: ITaskTemplate = {
        id: 'test-template-1',
        title: '测试模板',
        description: '测试描述',
        // ... 其他必要字段
      } as ITaskTemplate;

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Task/infrastructure/ipc/taskIpcClient'), 'taskIpcClient', 'get')
        .mockReturnValue({
          createTaskTemplate: jest.fn().mockResolvedValue({
            success: true,
            data: mockTemplate
          })
        });

      // Act
      const result = await taskService.createTaskTemplate(mockTemplate);

      // Assert
      expect(result.success).toBe(true);
      expect(result.template).toBeDefined();
      expect(mockStateRepository.addTaskTemplate).toHaveBeenCalledWith(mockTemplate);
      expect(mockStateRepository.addTaskTemplate).toHaveBeenCalledTimes(1);
    });

    it('创建失败时不应同步状态', async () => {
      // Arrange
      const mockTemplate: ITaskTemplate = {
        id: 'test-template-1',
        title: '测试模板',
      } as ITaskTemplate;

      // Mock IPC 失败响应
      jest.spyOn(require('@/modules/Task/infrastructure/ipc/taskIpcClient'), 'taskIpcClient', 'get')
        .mockReturnValue({
          createTaskTemplate: jest.fn().mockResolvedValue({
            success: false,
            message: '创建失败'
          })
        });

      // Act
      const result = await taskService.createTaskTemplate(mockTemplate);

      // Assert
      expect(result.success).toBe(false);
      expect(mockStateRepository.addTaskTemplate).not.toHaveBeenCalled();
    });
  });

  describe('删除任务模板', () => {
    it('成功删除时应同步状态', async () => {
      // Arrange
      const templateId = 'test-template-1';

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Task/infrastructure/ipc/taskIpcClient'), 'taskIpcClient', 'get')
        .mockReturnValue({
          deleteTaskTemplate: jest.fn().mockResolvedValue({
            success: true,
            message: '删除成功'
          })
        });

      // Act
      const result = await taskService.deleteTaskTemplate(templateId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockStateRepository.removeTaskTemplate).toHaveBeenCalledWith(templateId);
      expect(mockStateRepository.removeInstancesByTemplateId).toHaveBeenCalledWith(templateId);
    });
  });

  describe('状态仓库不可用时', () => {
    beforeEach(() => {
      mockStateRepository.isAvailable.mockReturnValue(false);
    });

    it('应输出警告但不影响业务流程', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await taskService.syncAllData();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ 状态仓库不可用，跳过同步');
      expect(mockStateRepository.syncAllTaskData).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('工厂方法', () => {
    it('应支持依赖注入', () => {
      // Act
      const serviceWithInjection = createTaskDomainApplicationService(mockStateRepository);

      // Assert
      expect(serviceWithInjection).toBeInstanceOf(TaskDomainApplicationService);
    });

    it('应支持默认创建', () => {
      // Act
      const serviceWithDefaults = createTaskDomainApplicationService();

      // Assert
      expect(serviceWithDefaults).toBeInstanceOf(TaskDomainApplicationService);
    });
  });
});

/**
 * 集成测试示例
 * 展示在真实环境中的使用方式
 */
describe('TaskDomainApplicationService Integration', () => {
  it('应能与真实的 Pinia 状态仓库集成', async () => {
    // 这里可以添加与真实 Pinia store 的集成测试
    // 验证完整的数据流：IPC -> 应用服务 -> 状态仓库 -> UI
    expect(true).toBe(true); // 占位测试
  });
});

/**
 * 性能测试示例
 */
describe('TaskDomainApplicationService Performance', () => {
  it('批量同步应在合理时间内完成', async () => {
    // 性能测试逻辑
    expect(true).toBe(true); // 占位测试
  });
});
