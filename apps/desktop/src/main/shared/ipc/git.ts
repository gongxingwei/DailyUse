import { ipcMain } from 'electron';
import gitService from '../services/gitService';

export function registerGitHandlers() {
  ipcMain.handle('git:initialize', async (_event, workingDirectory: string) => {
    return await gitService.initialize(workingDirectory);
  });

  ipcMain.handle('git:checkIsRepo', async (_event, workingDirectory: string) => {
    return await gitService.checkIsRepo(workingDirectory);
  });

  ipcMain.handle('git:init', async (_event, workingDirectory: string) => {
    return await gitService.initRepo(workingDirectory);
  });

  ipcMain.handle('git:status', async () => {
    return await gitService.getStatus();
  });
  ipcMain.handle('git:add', async (_event, files: string[]) => {
    return await gitService.add(files);
  });
  ipcMain.handle('git:stage', async (_event, files: string[]) => {
    return await gitService.stage(files);
  });

  ipcMain.handle('git:unstage', async (_event, files: string[]) => {
    return await gitService.unstage(files);
  });

  ipcMain.handle('git:commit', async (_event, message: string) => {
    return await gitService.commit(message);
  });

  ipcMain.handle('git:stageAll', async () => {
    return await gitService.stageAll();
  });

  ipcMain.handle('git:unstageAll', async () => {
    return await gitService.unstageAll();
  });

  ipcMain.handle('git:discardAll', async () => {
    return await gitService.discardAll();
  });

  ipcMain.handle('git:getLog', async () => {
    return await gitService.getLog();
  });
}
