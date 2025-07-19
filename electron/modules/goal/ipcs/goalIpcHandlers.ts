import { ipcMain } from 'electron';
import { MainGoalApplicationService } from '../application/services/mainGoalApplicationService';
import type { 
  IGoal,
  IGoalCreateDTO,
  IGoalDir,
  IRecordCreateDTO
} from '../../../../src/modules/Goal/domain/types/goal';
import { withAuth } from '@electron/modules/Authentication/application/services/authTokenService';

// 创建应用服务实例
const goalApplicationService = new MainGoalApplicationService();

/**
 * Goal 模块 IPC 处理器
 * 注册所有目标相关的 IPC 通信
 */
export function registerGoalIpcHandlers() {
  // ========== 用户设置 IPC ==========
  
  ipcMain.handle('goal:setUsername', async (_event, username: string) => {
    await goalApplicationService.setUsername(username);
    return { success: true, message: '用户设置成功' };
  });

  // ========== 目标目录 IPC ==========
  
  ipcMain.handle('goal:dir:create', withAuth(async (_event, [goalDirData], auth) => {
    try {
      console.log('[GoalIpc] 创建目标目录:', goalDirData, auth);
      if (!auth.account_uuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      return await goalApplicationService.createGoalDir(goalDirData, auth.account_uuid);
    } catch (error) {
      console.error('[GoalIpc] 创建目标目录失败:', error);
      return { success: false, message: '创建目标目录失败' };
    }
  }));

  ipcMain.handle('goal:dir:get-all', async (_event) => {
    return await goalApplicationService.getAllGoalDirs();
  });

  ipcMain.handle('goal:dir:delete', async (_event, id: string) => {
    return await goalApplicationService.deleteGoalDir(id);
  });

  ipcMain.handle('goal:dir:update', async (_event, goalDirData: IGoalDir) => {
    return await goalApplicationService.updateGoalDir(goalDirData);
  });
  // ========== 目标 IPC ==========

  ipcMain.handle('goal:create', async (_event, goalData: IGoalCreateDTO) => {
    return await goalApplicationService.createGoal(goalData);
  });

  ipcMain.handle('goal:get-all', async (_event) => {
    return await goalApplicationService.getAllGoals();
  });

  ipcMain.handle('goal:get-by-id', async (_event, id: string) => {
    return await goalApplicationService.getGoalById(id);
  });

  ipcMain.handle('goal:update', async (_event, goalData: IGoal) => {
    return await goalApplicationService.updateGoal(goalData);
  });

  ipcMain.handle('goal:delete', async (_event, id: string) => {
    return await goalApplicationService.deleteGoal(id);
  });

  ipcMain.handle('goal:delete-all', async (_event) => {
    return await goalApplicationService.deleteAllGoals();
  });

  // ========== 关键结果 IPC ==========

  ipcMain.handle('goal:addKeyResult', async (_event, goalId: string, keyResultData: any) => {
    return await goalApplicationService.addKeyResultToGoal(goalId, keyResultData);
  });

  ipcMain.handle('goal:removeKeyResult', async (_event, goalId: string, keyResultId: string) => {
    return await goalApplicationService.removeKeyResultFromGoal(goalId, keyResultId);
  });

  ipcMain.handle('goal:updateKeyResult', async (_event, goalId: string, keyResultId: string, updates: any) => {
    return await goalApplicationService.updateKeyResultOfGoal(goalId, keyResultId, updates);
  });

  ipcMain.handle('goal:updateKeyResultCurrentValue', async (_event, goalId: string, keyResultId: string, currentValue: number) => {
    return await goalApplicationService.updateKeyResultCurrentValue(goalId, keyResultId, currentValue);
  });

  // ========== 记录 IPC ==========

  ipcMain.handle('goal:addRecordToGoal', async (_event, goalId: string, keyResultId: string, value: number, note?: string) => {
    return await goalApplicationService.addRecordToGoal(goalId, keyResultId, value, note);
  });

  ipcMain.handle('goal:removeRecord', async (_event, goalId: string, recordId: string) => {
    return await goalApplicationService.removeRecordFromGoal(goalId, recordId);
  });

  ipcMain.handle('goal:createRecord', async (_event, recordData: IRecordCreateDTO) => {
    return await goalApplicationService.createRecord(recordData);
  });

  ipcMain.handle('goal:getAllRecords', async (_event) => {
    return await goalApplicationService.getAllRecords();
  });

  ipcMain.handle('goal:getRecordsByGoal', async (_event, goalId: string) => {
    return await goalApplicationService.getRecordsByGoalId(goalId);
  });

  ipcMain.handle('goal:deleteRecord', async (_event, recordId: string) => {
    return await goalApplicationService.deleteRecord(recordId);
  });

  // ========== 复盘 IPC ==========

  ipcMain.handle('goal:addReview', async (_event, data: any) => {
    const { goalId, reviewData } = data;
    return await goalApplicationService.addReviewToGoal(goalId, reviewData);
  });

  ipcMain.handle('goal:updateReview', async (_event, data: any) => {
    const { goalId, reviewId, updateData } = data;
    return await goalApplicationService.updateReviewInGoal(goalId, reviewId, updateData);
  });

  ipcMain.handle('goal:removeReview', async (_event, data: any) => {
    const { goalId, reviewId } = data;
    return await goalApplicationService.removeReviewFromGoal(goalId, reviewId);
  });

  ipcMain.handle('goal:getReviews', async (_event, goalId: string) => {
    // 从目标获取复盘，需要先获取目标
    const goalResult = await goalApplicationService.getGoalById(goalId);
    if (!goalResult.success || !goalResult.data) {
      return { success: false, message: '目标不存在', data: [] };
    }
    // 返回目标的复盘数据
    return { success: true, data: goalResult.data.reviews || [] };
  });

  ipcMain.handle('goal:createReviewSnapshot', async (_event, goalId: string) => {
    return await goalApplicationService.createGoalReviewSnapshot(goalId);
  });

  console.log('✅ Goal IPC handlers registered');
}

/**
 * 取消注册所有 Goal 相关的 IPC 处理器
 */
export function unregisterGoalIpcHandlers() {
  const channels = [
    'goal:setUsername',
    'goal:dir:create',
    'goal:dir:get-all', 
    'goal:dir:delete',
    'goal:create',
    'goal:get-all',
    'goal:get-by-id',
    'goal:update',
    'goal:delete',
    'goal:delete-all',
    'goal:addKeyResult',
    'goal:removeKeyResult',
    'goal:updateKeyResult',
    'goal:updateKeyResultCurrentValue',
    'goal:addRecordToGoal',
    'goal:removeRecord',
    'goal:createRecord',
    'goal:getAllRecords',
    'goal:getRecordsByGoal',
    'goal:deleteRecord',
    'goal:addReview',
    'goal:updateReview',
    'goal:removeReview',
    'goal:getReviews',
    'goal:createReviewSnapshot'
  ];

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  console.log('✅ Goal IPC handlers unregistered');
}
