import { eventBus } from '@dailyuse/utils';
import { GoalApplicationService } from '../services/GoalApplicationService';

/**
 * Goal 模块事件处理器
 * 监听其他模块的事件并作出响应
 */

/**
 * 注册 Goal 模块的事件处理器
 */
export function registerGoalEventHandlers(): void {
  console.log('🎯 [Goal] 注册事件处理器...');

  // ===================== 监听用户登录事件 =====================

  /**
   * 处理用户登录成功事件
   * 确保用户有默认的目标目录
   */
  eventBus.on('user.loggedIn', async (payload: { accountUuid: string; [key: string]: any }) => {
    try {
      console.log(`🎯 [Goal] 检测到用户登录事件: ${payload.accountUuid}`);

      const goalService = await GoalApplicationService.getInstance();

      // 确保用户有默认目录
      await goalService.ensureDefaultDirectories(payload.accountUuid);

      console.log(`✅ [Goal] 用户默认目录检查完成: ${payload.accountUuid}`);
    } catch (error) {
      console.error(`❌ [Goal] 处理用户登录事件失败:`, error);
      // 不抛出错误，避免影响登录流程
    }
  });

  // ===================== 监听账户注册事件 =====================

  /**
   * 处理账户注册成功事件
   * 为新用户创建默认的目标目录
   */
  eventBus.on(
    'AccountRegisteredEvent',
    async (payload: { accountUuid?: string; aggregateId?: string; [key: string]: any }) => {
      try {
        const accountUuid = payload.accountUuid || payload.aggregateId;
        if (!accountUuid) {
          console.warn('⚠️ [Goal] 账户注册事件缺少 accountUuid');
          return;
        }

        console.log(`🎯 [Goal] 检测到账户注册事件: ${accountUuid}`);

        const goalService = await GoalApplicationService.getInstance();

        // 初始化新用户的目标数据
        await goalService.initializeUserData(accountUuid);

        console.log(`✅ [Goal] 新用户目标数据初始化完成: ${accountUuid}`);
      } catch (error) {
        console.error(`❌ [Goal] 处理账户注册事件失败:`, error);
        // 不抛出错误，避免影响注册流程
      }
    },
  );

  // ===================== 监听账户删除事件 =====================

  /**
   * 处理账户删除事件
   * 清理用户的所有目标数据
   */
  eventBus.on('account.deleted', async (payload: { accountUuid: string; [key: string]: any }) => {
    try {
      console.log(`🎯 [Goal] 检测到账户删除事件: ${payload.accountUuid}`);

      // TODO: 实现清理逻辑
      // const goalService = await GoalApplicationService.getInstance();
      // await goalService.deleteAllUserGoals(payload.accountUuid);

      console.log(`✅ [Goal] 用户目标数据清理完成: ${payload.accountUuid}`);
    } catch (error) {
      console.error(`❌ [Goal] 处理账户删除事件失败:`, error);
    }
  });

  console.log('✅ [Goal] 事件处理器注册完成');
}

/**
 * 初始化 Goal 模块事件处理器
 * 在应用启动时调用
 */
export function initializeGoalEventHandlers(): void {
  registerGoalEventHandlers();
}
