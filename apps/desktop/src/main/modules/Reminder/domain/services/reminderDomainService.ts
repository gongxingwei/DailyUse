import { ReminderTemplateGroup } from '../aggregates/reminderTemplateGroup';
import type { IReminderTemplateRepository } from '../../domain/repositories/iReminderTemplateRepository';
import type { IReminderTemplateGroupRepository } from '../../domain/repositories/iReminderTemplateGroupRepository';

class ReminderDomainService {
  private static instance: ReminderDomainService;
  private constructor() {
    // 私有构造函数，防止外部实例化
  }
  public static getInstance(): ReminderDomainService {
    if (!ReminderDomainService.instance) {
      ReminderDomainService.instance = new ReminderDomainService();
    }
    return ReminderDomainService.instance;
  }

  async createReminderTemplateGroup(
    accountUuid: string,
    group: ReminderTemplateGroup,
    reminderGroupRepository: IReminderTemplateGroupRepository,
  ): Promise<ApiResponse<ReminderTemplateGroup>> {
    try {
      const result = await reminderGroupRepository.create(accountUuid, group);
      if (!result) {
        return {
          success: false,
          message: '创建提醒组失败',
        };
      }
      return {
        success: true,
        message: '创建提醒组成功',
        data: group,
      };
    } catch (error) {
      console.error('[主进程] 创建提醒组失败:', error);
      return {
        success: false,
        message: `创建提醒组失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async switchEnableModeToGroup(
    accountUuid: string,
    groupUuid: string,
    reminderGroupRepository: IReminderTemplateGroupRepository,
  ): Promise<ApiResponse<void>> {
    try {
      const group = await reminderGroupRepository.getById(accountUuid, groupUuid);
      if (!group) {
        return {
          success: false,
          message: '提醒组不存在',
        };
      }
      group.switchEnableModeToGroup();
      await reminderGroupRepository.update(accountUuid, group);
      return {
        success: true,
        message: '切换到分组模式成功',
      };
    } catch (error) {
      console.error('[主进程] 切换到分组模式失败:', error);
      return {
        success: false,
        message: `切换到分组模式失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async switchEnableModeToIndividual(
    accountUuid: string,
    groupUuid: string,
    reminderGroupRepository: IReminderTemplateGroupRepository,
  ): Promise<ApiResponse<void>> {
    try {
      const group = await reminderGroupRepository.getById(accountUuid, groupUuid);
      if (!group) {
        return {
          success: false,
          message: '提醒组不存在',
        };
      }
      group.switchEnableModeToIndividual();
      await reminderGroupRepository.update(accountUuid, group);
      return {
        success: true,
        message: '切换到个人模式成功',
      };
    } catch (error) {
      console.error('[主进程] 切换到个人模式失败:', error);
      return {
        success: false,
        message: `切换到个人模式失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async switchGroupEnabledToTrue(
    accountUuid: string,
    groupUuid: string,
    reminderGroupRepository: IReminderTemplateGroupRepository,
  ): Promise<ApiResponse<void>> {
    try {
      const group = await reminderGroupRepository.getById(accountUuid, groupUuid);
      if (!group) {
        return {
          success: false,
          message: '提醒组不存在',
        };
      }
      group.enabled = true;
      await reminderGroupRepository.update(accountUuid, group);
      return {
        success: true,
        message: '切换提醒组状态成功',
      };
    } catch (error) {
      console.error('[主进程] 切换提醒组状态失败:', error);
      return {
        success: false,
        message: `切换提醒组状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async switchGroupEnabledToFalse(
    accountUuid: string,
    groupUuid: string,
    reminderGroupRepository: IReminderTemplateGroupRepository,
  ): Promise<ApiResponse<void>> {
    try {
      const group = await reminderGroupRepository.getById(accountUuid, groupUuid);
      if (!group) {
        return {
          success: false,
          message: '提醒组不存在',
        };
      }
      group.enabled = false;
      await reminderGroupRepository.update(accountUuid, group);
      return {
        success: true,
        message: '切换提醒组状态成功',
      };
    } catch (error) {
      console.error('[主进程] 切换提醒组状态失败:', error);
      return {
        success: false,
        message: `切换提醒组状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async switchReminderTemplateSelfEnabledToTrue(
    accountUuid: string,
    templateUuid: string,
    reminderRepository: IReminderTemplateRepository,
  ): Promise<ApiResponse<void>> {
    try {
      const template = await reminderRepository.getById(accountUuid, templateUuid);
      if (!template) {
        return {
          success: false,
          message: '提醒模板不存在',
        };
      }
      template.selfEnabled = true;
      await reminderRepository.update(accountUuid, template);
      return {
        success: true,
        message: '切换提醒模板状态成功',
      };
    } catch (error) {
      console.error('[主进程] 切换提醒模板状态失败:', error);
      return {
        success: false,
        message: `切换提醒模板状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async switchReminderTemplateSelfEnabledToFalse(
    accountUuid: string,
    templateUuid: string,
    reminderRepository: IReminderTemplateRepository,
  ): Promise<ApiResponse<void>> {
    try {
      const template = await reminderRepository.getById(accountUuid, templateUuid);
      if (!template) {
        return {
          success: false,
          message: '提醒模板不存在',
        };
      }
      template.selfEnabled = false;
      await reminderRepository.update(accountUuid, template);
      return {
        success: true,
        message: '切换提醒模板状态成功',
      };
    } catch (error) {
      console.error('[主进程] 切换提醒模板状态失败:', error);
      return {
        success: false,
        message: `切换提醒模板状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async moveTemplateToGroup(
    accountUuid: string,
    templateUuid: string,
    toGroupUuid: string,
    reminderRepository: IReminderTemplateRepository,
  ): Promise<void> {
    // 直接修改数据库，在返回全新的所有数据，让渲染进程重新渲染
    try {
      console.log('[主进程 ReminderDomainService] 移动提醒模板:', {
        accountUuid,
        templateUuid,
        toGroupUuid,
      });
      const template = await reminderRepository.getById(accountUuid, templateUuid);
      if (!template) {
        throw new Error(`Template with ID ${templateUuid} not found`);
      }
      template.groupUuid = toGroupUuid;
      await reminderRepository.update(accountUuid, template);
    } catch (error) {
      console.error('[主进程] 移动提醒模板失败:', error);
      throw new Error(`移动提醒模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

export const reminderDomainService = ReminderDomainService.getInstance();
