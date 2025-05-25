import { app } from 'electron';
import path from 'path';
import SyncService from '../services/syncService';

/**
 * 初始化同步服务
 * @returns 配置好的SyncService实例
 */
export function setupSyncService(): SyncService {
  // 配置服务器URL - 可以从环境变量或配置文件读取
  const SERVER_URL = process.env.SYNC_SERVER_URL || 'http://localhost:3000';
  
  // 用户数据目录
  const userDataPath = path.join(app.getPath('userData'), 'data');
  
  // 初始化同步服务
  const syncService = new SyncService(SERVER_URL, userDataPath);
  syncService.initializeSync();
  
  return syncService;
}