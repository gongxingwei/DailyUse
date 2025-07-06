import { ipcMain } from 'electron';
import { MainGoalApplicationService } from '../application/mainGoalApplicationService';
import type { 
  IGoalCreateDTO, 
  IRecordCreateDTO, 
  IGoalDirCreateDTO,
  IGoal
} from '@/modules/Goal/domain/types/goal';

/**
 * 目标模块 IPC 处理器
 * 处理渲染进程与主进程之间的目标相关通信
 */

// 创建服务实例
const goalService = new MainGoalApplicationService();

/**
 * 注册所有目标相关的 IPC 处理器
 */
export function registerGoalIpcHandlers(): void {
  console.log('🔧 [IPC] 注册目标模块 IPC 处理器');

  // ========== 目标管理 ==========
  
  ipcMain.handle('goal:create', async (_, goalData: IGoalCreateDTO) => {
    return await goalService.createGoal(goalData);
  });

  ipcMain.handle('goal:get-all', async () => {
    return await goalService.getAllGoals();
  });

  ipcMain.handle('goal:get-by-id', async (_, goalId: string) => {
    return await goalService.getGoalById(goalId);
  });

  ipcMain.handle('goal:update', async (_, goalData: IGoal) => {
    return await goalService.updateGoal(goalData);
  });

  ipcMain.handle('goal:delete', async (_, goalId: string) => {
    return await goalService.deleteGoal(goalId);
  });

  ipcMain.handle('goal:delete-all', async () => {
    return await goalService.deleteAllGoals();
  });

  // ========== 关键结果管理 ==========
  
  ipcMain.handle('goal:key-result:update-current-value', async (
    _, 
    goalId: string, 
    keyResultId: string, 
    currentValue: number
  ) => {
    return await goalService.updateKeyResultCurrentValue(goalId, keyResultId, currentValue);
  });

  // ========== 记录管理 ==========
  
  ipcMain.handle('goal:record:create', async (_, recordData: IRecordCreateDTO) => {
    return await goalService.createRecord(recordData);
  });

  ipcMain.handle('goal:record:get-all', async () => {
    return await goalService.getAllRecords();
  });

  ipcMain.handle('goal:record:get-by-goal-id', async (_, goalId: string) => {
    return await goalService.getRecordsByGoalId(goalId);
  });

  ipcMain.handle('goal:record:delete', async (_, recordId: string) => {
    return await goalService.deleteRecord(recordId);
  });

  // ========== 目标目录管理 ==========
  
  ipcMain.handle('goal:dir:create', async (_, goalDirData: IGoalDirCreateDTO) => {
    return await goalService.createGoalDir(goalDirData);
  });

  ipcMain.handle('goal:dir:get-all', async () => {
    return await goalService.getAllGoalDirs();
  });

  ipcMain.handle('goal:dir:delete', async (_, goalDirId: string) => {
    return await goalService.deleteGoalDir(goalDirId);
  });

  console.log('✅ [IPC] 目标模块 IPC 处理器注册完成');
}
