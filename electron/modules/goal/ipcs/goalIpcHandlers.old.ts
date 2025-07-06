import { ipcMain } from 'electron';
import { MainGoalApplicationService } from '../application/mainGoalApplicationService';
import type { 
  IGoalCreateDTO,
  IGoalDirCreateDTO,
  IKeyResultCreateDTO,
  IRecordCreateDTO
} from '../../../../src/modules/Goal/domain/types/goal';

// 创建应用服务实例
const goalApplicationService = new MainGoalApplicationService();

/**
 * Goal 模块 IPC 处理器
 * 注册所有目标相关的 IPC 通信
 */
export function registerGoalIpcHandlers() {
  // ========== 目标目录 IPC ==========
  
  ipcMain.handle('goal:createDirectory', async (_event, username: string, goalDirData: IGoalDirCreateDTO) => {
    return await goalMainService.createGoalDirectory(username, goalDirData);
  });

  ipcMain.handle('goal:getDirectories', async (_event, username: string) => {
    return await goalMainService.getGoalDirectories(username);
  });

  ipcMain.handle('goal:getDirectoryById', async (_event, id: string) => {
    return await goalMainService.getGoalDirectoryById(id);
  });

  ipcMain.handle('goal:deleteDirectory', async (_event, id: string) => {
    return await goalMainService.deleteGoalDirectory(id);
  });

  // ========== 目标 IPC ==========

  ipcMain.handle('goal:create', async (_event, username: string, goalData: IGoalCreateDTO) => {
    return await goalMainService.createGoal(username, goalData);
  });

  ipcMain.handle('goal:getAll', async (_event, username: string) => {
    return await goalMainService.getGoals(username);
  });

  ipcMain.handle('goal:getById', async (_event, id: string) => {
    return await goalMainService.getGoalById(id);
  });

  ipcMain.handle('goal:update', async (_event, id: string, updates: any) => {
    return await goalMainService.updateGoal(id, updates);
  });

  ipcMain.handle('goal:delete', async (_event, id: string) => {
    return await goalMainService.deleteGoal(id);
  });

  // ========== 关键结果 IPC ==========

  ipcMain.handle('goal:createKeyResult', async (_event, username: string, goalId: string, keyResultData: IKeyResultCreateDTO) => {
    return await goalMainService.createKeyResult(username, goalId, keyResultData);
  });

  ipcMain.handle('goal:getKeyResults', async (_event, goalId: string) => {
    return await goalMainService.getKeyResults(goalId);
  });

  ipcMain.handle('goal:updateKeyResult', async (_event, id: string, updates: any) => {
    return await goalMainService.updateKeyResult(id, updates);
  });

  ipcMain.handle('goal:deleteKeyResult', async (_event, id: string) => {
    return await goalMainService.deleteKeyResult(id);
  });

  // ========== 记录 IPC ==========

  ipcMain.handle('goal:createRecord', async (_event, username: string, recordData: IRecordCreateDTO) => {
    return await goalMainService.createRecord(username, recordData);
  });

  ipcMain.handle('goal:getRecords', async (_event, goalId: string) => {
    return await goalMainService.getRecords(goalId);
  });

  ipcMain.handle('goal:getRecordsByKeyResult', async (_event, keyResultId: string) => {
    return await goalMainService.getRecordsByKeyResult(keyResultId);
  });

  ipcMain.handle('goal:updateRecord', async (_event, id: string, updates: any) => {
    return await goalMainService.updateRecord(id, updates);
  });

  ipcMain.handle('goal:deleteRecord', async (_event, id: string) => {
    return await goalMainService.deleteRecord(id);
  });

  console.log('✅ Goal IPC 处理器注册完成');
}
