import { ipcMain } from 'electron';
import { MainGoalApplicationService } from '../application/mainGoalApplicationService';
import type { 
  IGoal,
  IGoalCreateDTO,
  IGoalDirCreateDTO,
  IRecordCreateDTO
} from '../../../../src/modules/Goal/domain/types/goal';

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
  
  ipcMain.handle('goal:createDirectory', async (_event, goalDirData: IGoalDirCreateDTO) => {
    return await goalApplicationService.createGoalDir(goalDirData);
  });

  ipcMain.handle('goal:getDirectories', async (_event) => {
    return await goalApplicationService.getAllGoalDirs();
  });

  ipcMain.handle('goal:deleteDirectory', async (_event, id: string) => {
    return await goalApplicationService.deleteGoalDir(id);
  });

  // ========== 目标 IPC ==========

  ipcMain.handle('goal:create', async (_event, goalData: IGoalCreateDTO) => {
    return await goalApplicationService.createGoal(goalData);
  });

  ipcMain.handle('goal:getAll', async (_event) => {
    return await goalApplicationService.getAllGoals();
  });

  ipcMain.handle('goal:getById', async (_event, id: string) => {
    return await goalApplicationService.getGoalById(id);
  });

  ipcMain.handle('goal:update', async (_event, goalData: IGoal) => {
    return await goalApplicationService.updateGoal(goalData);
  });

  ipcMain.handle('goal:delete', async (_event, id: string) => {
    return await goalApplicationService.deleteGoal(id);
  });

  ipcMain.handle('goal:deleteAll', async (_event) => {
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

  console.log('✅ Goal IPC handlers registered');
}

/**
 * 取消注册所有 Goal 相关的 IPC 处理器
 */
export function unregisterGoalIpcHandlers() {
  const channels = [
    'goal:setUsername',
    'goal:createDirectory',
    'goal:getDirectories', 
    'goal:deleteDirectory',
    'goal:create',
    'goal:getAll',
    'goal:getById',
    'goal:update',
    'goal:delete',
    'goal:deleteAll',
    'goal:addKeyResult',
    'goal:removeKeyResult',
    'goal:updateKeyResult',
    'goal:updateKeyResultCurrentValue',
    'goal:addRecordToGoal',
    'goal:removeRecord',
    'goal:createRecord',
    'goal:getAllRecords',
    'goal:getRecordsByGoal'
  ];

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  console.log('✅ Goal IPC handlers unregistered');
}
