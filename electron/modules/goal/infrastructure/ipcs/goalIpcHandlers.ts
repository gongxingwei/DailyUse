import { ipcMain } from 'electron';
import { MainGoalApplicationService } from '../../application/services/mainGoalApplicationService';
import { withAuth } from '@electron/modules/Authentication/application/services/authTokenService';

// 创建应用服务实例

/**
 * Goal 模块 IPC 处理器
 * 注册所有目标相关的 IPC 通信
 */
export async function registerGoalIpcHandlers() {
  const goalApplicationService = (await MainGoalApplicationService.getInstance());
  // ========== 目标目录 IPC ==========

  ipcMain.handle('goal:dir:create', withAuth(async (_event, [goalDirData], auth) => {
    try {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const dir = await goalApplicationService.createGoalDir(goalDirData, auth.accountUuid);
      const dirDTO = dir.toDTO();
      return { success: true, data: dirDTO, message: '创建成功' };
    } catch (error) {
      console.error('[GoalIpc] 创建目标目录失败:', error);
      return { success: false, message: '创建目标目录失败' };
    }
  }));

  ipcMain.handle('goal:dir:get-all', withAuth(async (_event, [], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const dirs = await goalApplicationService.getAllGoalDirs(auth.accountUuid);
    const dirDTOs = dirs.map(dir => dir.toDTO());
    return { success: true, data: dirDTOs };
  }));

  ipcMain.handle('goal:dir:delete', withAuth(async (_event, [uuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    await goalApplicationService.deleteGoalDir(auth.accountUuid, uuid);
    return { success: true, message: '删除成功' };
  }));

  ipcMain.handle('goal:dir:update', withAuth(async (_event, [goalDirData], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const dir = await goalApplicationService.updateGoalDir(goalDirData);
    const dirDTO = dir.toDTO();
    return { success: true, data: dirDTO, message: '更新成功' };
  }));

  // ========== 目标 IPC ==========

  ipcMain.handle('goal:create', withAuth(async (_event, [goalData], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const goal = await goalApplicationService.createGoal(auth.accountUuid, goalData);
    const goalDTO = goal.toDTO();
    return { success: true, data: goalDTO, message: '创建成功' };
  }));

  ipcMain.handle('goal:get-all', withAuth(async (_event, [], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const goals = await goalApplicationService.getAllGoals(auth.accountUuid);
    const goalDTOs = goals.map(goal => goal.toDTO());
    return { success: true, data: goalDTOs };
  }));

  ipcMain.handle('goal:get-by-id', withAuth(async (_event, [uuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const goal = await goalApplicationService.getGoalById(uuid);
    if (!goal) {
      return { success: false, message: '目标不存在' };
    }
    const goalDTO = goal.toDTO();
    return { success: true, data: goalDTO };
  }));

  ipcMain.handle('goal:update', withAuth(async (_event, [goalData], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const updatedGoal = await goalApplicationService.updateGoal(goalData);
    const goalDTO = updatedGoal.toDTO();
    return { success: true, data: goalDTO, message: '更新成功' };
  }));

  ipcMain.handle('goal:delete', withAuth(async (_event, [uuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    await goalApplicationService.deleteGoal(uuid);
    return { success: true, message: '删除成功' };
  }));

  ipcMain.handle('goal:delete-all', withAuth(async (_event, [], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    await goalApplicationService.deleteAllGoals(auth.accountUuid);
    return { success: true, message: '全部删除成功' };
  }));

  // ========== 关键结果 IPC ==========

  ipcMain.handle('goal:addKeyResult', withAuth(async (_event, [goalUuid, keyResultData], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const result = await goalApplicationService.addKeyResultToGoal(goalUuid, keyResultData);
    // result 结构: { goal, keyResultId }
    const resultDTO = {
      ...result,
      goal: result.goal?.toDTO ? result.goal.toDTO() : result.goal,
    };
    return { success: true, data: resultDTO, message: '添加成功' };
  }));

  ipcMain.handle('goal:removeKeyResult', withAuth(async (_event, [goalUuid, keyResultId], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const goal = await goalApplicationService.removeKeyResultFromGoal(goalUuid, keyResultId);
    const goalDTO = goal.toDTO();
    return { success: true, data: goalDTO, message: '删除成功' };
  }));

  ipcMain.handle('goal:updateKeyResult', withAuth(async (_event, [goalUuid, keyResultId, updates], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const goal = await goalApplicationService.updateKeyResultOfGoal(goalUuid, keyResultId, updates);
    const goalDTO = goal.toDTO();
    return { success: true, data: goalDTO, message: '更新成功' };
  }));

  ipcMain.handle('goal:updateKeyResultCurrentValue', withAuth(async (_event, [goalUuid, keyResultId, currentValue], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const goal = await goalApplicationService.updateKeyResultCurrentValue(goalUuid, keyResultId, currentValue);
    const goalDTO = goal.toDTO();
    return { success: true, data: goalDTO, message: '更新成功' };
  }));

  // ========== 记录 IPC ==========

  ipcMain.handle('goal:addRecordToGoal', withAuth(async (_event, [recordCreateDTO], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const result = await goalApplicationService.addRecordToGoal(recordCreateDTO);
    // result 结构: { goal, record }
    const resultDTO = {
      ...result,
      goal: result.goal?.toDTO ? result.goal.toDTO() : result.goal,
      record: result.record?.toDTO ? result.record.toDTO() : result.record,
    };
    return { success: true, data: resultDTO, message: '添加成功' };
  }));

  ipcMain.handle('goal:removeRecord', withAuth(async (_event, [goalUuid, recordId], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const goal = await goalApplicationService.removeRecordFromGoal(goalUuid, recordId);
    const goalDTO = goal.toDTO();
    return { success: true, data: goalDTO, message: '删除成功' };
  }));

  ipcMain.handle('goal:getAllRecords', withAuth(async (_event, [], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const records = await goalApplicationService.getAllRecords(auth.accountUuid);
    const recordDTOs = records.map(r => r.toDTO ? r.toDTO() : r);
    return { success: true, data: recordDTOs };
  }));

  ipcMain.handle('goal:getRecordsByGoal', withAuth(async (_event, [goalUuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const records = await goalApplicationService.getRecordsBygoalUuid(goalUuid);
    const recordDTOs = records.map(r => r.toDTO ? r.toDTO() : r);
    return { success: true, data: recordDTOs };
  }));

  ipcMain.handle('goal:deleteRecord', withAuth(async (_event, [recordId], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    await goalApplicationService.deleteRecord(recordId);
    return { success: true, message: '删除成功' };
  }));

  // ========== 复盘 IPC ==========

  ipcMain.handle('goal:addReview', withAuth(async (_event, [data], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const { goalUuid, reviewData } = data;
    const result = await goalApplicationService.addReviewToGoal(goalUuid, reviewData);
    // result 结构: { goal, review }
    const resultDTO = {
      ...result,
      goal: result.goal?.toDTO ? result.goal.toDTO() : result.goal,
      review: result.review?.toDTO ? result.review.toDTO() : result.review,
    };
    return { success: true, data: resultDTO, message: '添加成功' };
  }));

  ipcMain.handle('goal:updateReview', withAuth(async (_event, [data], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const { goalUuid, reviewId, updateData } = data;
    const result = await goalApplicationService.updateReviewInGoal(goalUuid, reviewId, updateData);
    // result 结构: { goal, review }
    const resultDTO = {
      ...result,
      goal: result.goal?.toDTO ? result.goal.toDTO() : result.goal,
      review: result.review?.toDTO ? result.review.toDTO() : result.review,
    };
    return { success: true, data: resultDTO, message: '更新成功' };
  }));

  ipcMain.handle('goal:removeReview', withAuth(async (_event, [data], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const { goalUuid, reviewId } = data;
    const goal = await goalApplicationService.removeReviewFromGoal(goalUuid, reviewId);
    const goalDTO = goal?.toDTO ? goal.toDTO() : goal;
    return { success: true, data: goalDTO, message: '删除成功' };
  }));

  ipcMain.handle('goal:getReviews', withAuth(async (_event, [goalUuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const reviews = await goalApplicationService.getGoalReviews(goalUuid);
    const reviewDTOs = reviews.map(r => r.toDTO ? r.toDTO() : r);
    return { success: true, data: reviewDTOs };
  }));

  ipcMain.handle('goal:createReviewSnapshot', withAuth(async (_event, [goalUuid], auth) => {
    if (!auth.accountUuid) {
      return { success: false, message: '未登录或登录已过期，请重新登录' };
    }
    const result = await goalApplicationService.createGoalReviewSnapshot(goalUuid);
    // result 结构: { goal, snapshot }
    const resultDTO = {
      ...result,
      goal: result.goal?.toDTO ? result.goal.toDTO() : result.goal,
      snapshot: result.snapshot, // 假设 snapshot 已经是纯数据
    };
    return { success: true, data: resultDTO, message: '快照创建成功' };
  }));

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