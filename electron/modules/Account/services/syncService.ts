import axios, { AxiosResponse } from 'axios';
import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';

/**
 * 表示同步队列中的一个项目
 * 包含文件路径和时间戳信息
 */
interface SyncQueueItem {
  path: string;      // 需要同步的文件完整路径
  timestamp: number; // 添加到队列时的时间戳（毫秒）
}

/**
 * 服务器同步响应的数据结构
 * 包含同步结果和可能的服务器数据
 */
interface SyncResponse {
  serverData?: any;           // 可选，服务器返回的数据（如有更新）
  serverTimestamp?: number;   // 可选，服务器数据的时间戳
  message?: string;           // 可选，同步相关的消息
  success: boolean;           // 同步操作是否成功
}

/**
 * 存储文件路径及其对应的上次修改时间戳
 * 用于跟踪文件变化
 */
interface Timestamps {
  [filePath: string]: number; // 键为文件路径，值为时间戳（毫秒）
}

/**
 * 同步服务类
 * 负责在本地文件系统和远程服务器之间同步数据文件
 * 实现了文件监视、队列管理和增量同步功能
 */
export class SyncService {
  private baseUrl: string;                        // 同步服务器的基础URL
  private dataDir: string;                        // 数据文件目录路径
  private syncQueue: SyncQueueItem[];             // 等待同步的文件队列
  private isSyncing: boolean;                     // 当前是否正在进行同步
  private isOnline: boolean;                      // 当前网络连接状态
  private timestamps: Timestamps;                 // 文件修改时间戳记录
  private onlineStatusInterval: NodeJS.Timeout | null; // 检查网络状态的定时器

  /**
   * 创建同步服务实例
   * @param baseUrl 同步服务器的基础URL
   * @param dataDir 需要监视和同步的数据目录路径
   */
  constructor(baseUrl: string, dataDir: string) {
    this.baseUrl = baseUrl;
    this.dataDir = dataDir;
    this.syncQueue = [];
    this.isSyncing = false;
    this.isOnline = true; // 默认假设在线
    this.timestamps = {};
    this.onlineStatusInterval = null;
    
    // 初始化网络状态监控（主进程中没有window/navigator对象）
    this.setupNetworkMonitoring();
  }

  /**
   * 设置网络状态监控
   * 通过定期向服务器发送ping请求检测在线状态
   * 在从离线状态恢复时自动触发同步
   * @private
   */
  private setupNetworkMonitoring(): void {
    // 每30秒通过axios ping检查在线状态
    this.onlineStatusInterval = setInterval(() => {
      axios.get(`${this.baseUrl}/api/ping`)
        .then(() => {
          const wasOffline = !this.isOnline;
          this.isOnline = true;
          // 如果之前是离线状态，尝试同步队列中的文件
          if (wasOffline) {
            this.syncWithServer();
          }
        })
        .catch(() => {
          this.isOnline = false;
        });
    }, 30000); // 每30秒检查一次
  }

  /**
   * 监视文件变化并添加到同步队列
   * 通过比较文件修改时间来检测变化
   * @param filePath 要监视的文件完整路径
   * @public
   */
  public watchFile(filePath: string): void {
    // 为文件创建时间戳记录（如果不存在）
    if (!this.timestamps[filePath]) this.timestamps[filePath] = 0;

    try {
      // 检查文件状态，如果有更新则添加到队列
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs > this.timestamps[filePath]) {
        this.addToSyncQueue(filePath);
        this.timestamps[filePath] = stats.mtimeMs;
      }
    } catch (error) {
      console.error(`Error watching file ${filePath}:`, error);
    }
  }

  /**
   * 将文件添加到同步队列
   * 如果在线，立即尝试同步
   * @param filePath 要添加到队列的文件路径
   * @public
   */
  public addToSyncQueue(filePath: string): void {
    this.syncQueue.push({
      path: filePath,
      timestamp: new Date().getTime()
    });
    
    // 如果在线，尝试同步
    if (this.isOnline) {
      this.syncWithServer();
    }
  }

  /**
   * 与服务器同步文件队列
   * 一次处理一个文件，直到队列为空或发生错误
   * 支持双向同步（上传本地更改，下载服务器更改）
   * @returns Promise<void>
   * @public
   */
  public async syncWithServer(): Promise<void> {
    // 如果已经在同步、队列为空或离线，则退出
    if (this.isSyncing || this.syncQueue.length === 0 || !this.isOnline) return;
    
    this.isSyncing = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue[0];
        const fileContent = fs.readFileSync(item.path, 'utf8');
        const fileName = path.basename(item.path);
        
        // 从安全存储获取认证令牌
        const token = await this.getAuthToken();
        
        // 发送同步请求到服务器
        const response: AxiosResponse<SyncResponse> = await axios.post(
          `${this.baseUrl}/api/sync`, 
          {
            fileName,
            content: JSON.parse(fileContent),
            timestamp: item.timestamp
          }, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.status === 200 && response.data.success) {
          this.syncQueue.shift(); // 成功后从队列中移除
          
          // 如果服务器有更新的版本，则更新本地文件
          if (response.data.serverData && response.data.serverTimestamp && 
              response.data.serverTimestamp > item.timestamp) {
            fs.writeFileSync(item.path, JSON.stringify(response.data.serverData, null, 2));
            this.timestamps[item.path] = response.data.serverTimestamp;
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * 初始化同步服务
   * 扫描数据目录中的所有JSON文件并设置监视
   * @public
   */
  public initializeSync(): void {
    try {
      const files = fs.readdirSync(this.dataDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.dataDir, file);
          this.watchFile(filePath);
          
          // 设置文件系统监视器来监测实时变化
          fs.watch(filePath, () => this.watchFile(filePath));
        }
      });
    } catch (error) {
      console.error('Error initializing sync:', error);
    }
  }

  /**
   * 获取认证令牌
   * 用于向服务器验证身份
   * @returns Promise<string> 认证令牌
   * @private
   */
  private async getAuthToken(): Promise<string> {
    try {
      // 这里应替换为您的安全存储方法
      // 例如，使用 electron-store 或 keytar
      return ''; // 占位符
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }

  /**
   * 清理资源
   * 释放定时器和其他占用资源
   * 应用退出前调用
   * @public
   */
  public dispose(): void {
    if (this.onlineStatusInterval) {
      clearInterval(this.onlineStatusInterval);
      this.onlineStatusInterval = null;
    }
  }
}

export default SyncService;