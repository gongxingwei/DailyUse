import { ipcMain, dialog } from 'electron';
import { localAccountStorageService } from '../services/localAccountStorageService';

/**
 * 设置用户存储相关的 IPC 处理程序
 * 处理用户数据的读取、写入、迁移等操作
 */
export function setupUserStoreHandlers() {
    // 读取用户特定存储数据
    ipcMain.handle('userStore:read', async (_, userId: string, storeName: string) => {
        try {
            return await localAccountStorageService.readUserStore(userId, storeName);
        } catch (error) {
            console.error(`读取用户存储失败 (${storeName}):`, error);
            if (error instanceof Error) {
                throw new Error(`读取用户数据失败: ${error.message}`);
            }
            throw new Error('读取用户数据失败: 未知错误');
        }
    });

    // 写入用户特定存储数据
    ipcMain.handle('userStore-write', async (_, userId: string, storeName: string, data: any) => {
        try {
            await localAccountStorageService.writeUserStore(userId, storeName, data);
        } catch (error) {
            console.error(`写入用户存储失败 (${storeName}):`, error);
            if (error instanceof Error) {
                throw new Error(`读取用户数据失败: ${error.message}`);
            }
            throw new Error('读取用户数据失败: 未知错误');
        }
    });

    // 迁移用户数据
    ipcMain.handle('userStore:migrate', async (_, fromUserId: string, toUserId: string) => {
        try {
            await localAccountStorageService.migrateUserData(fromUserId, toUserId);
        } catch (error) {
            console.error('迁移用户数据失败:', error);
            if (error instanceof Error) {
                throw new Error(`读取用户数据失败: ${error.message}`);
            }
            throw new Error('读取用户数据失败: 未知错误');
        }
    });

    // 获取用户数据路径
    ipcMain.handle('userStore:getPath', (_, userId: string) => {
        try {
            return localAccountStorageService.getUserDataPath(userId);
        } catch (error) {
            console.error('获取用户数据路径失败:', error);
            if (error instanceof Error) {
                throw new Error(`读取用户数据失败: ${error.message}`);
            }
            throw new Error('读取用户数据失败: 未知错误');
        }
    });

    // 创建用户目录
    ipcMain.handle('userStore:createDirectory', async (_, userId: string) => {
        try {
            await localAccountStorageService.createUserDirectory(userId);
        } catch (error) {
            console.error('创建用户目录失败:', error);
            if (error instanceof Error) {
                throw new Error(`读取用户数据失败: ${error.message}`);
            }
            throw new Error('读取用户数据失败: 未知错误');
        }
    });
    // 导出用户数据
    ipcMain.handle('userStore:export', async (_, userId: string) => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                properties: ['openDirectory', 'createDirectory'],
                title: '选择导出目录',
                buttonLabel: '导出到此处'
            });

            if (filePaths.length > 0) {
                await localAccountStorageService.exportUserData(userId, filePaths[0]);
                return { success: true, path: filePaths[0] };
            }
            return { success: false, reason: 'cancelled' };
        } catch (error) {
            console.error('导出用户数据失败:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : '未知错误' 
            };
        }
    });

    // 导入用户数据
    ipcMain.handle('userStore:import', async (_, userId: string) => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                properties: ['openDirectory'],
                title: '选择导入目录',
                buttonLabel: '从此处导入'
            });

            if (filePaths.length > 0) {
                await localAccountStorageService.importUserData(userId, filePaths[0]);
                return { success: true };
            }
            return { success: false, reason: 'cancelled' };
        } catch (error) {
            console.error('导入用户数据失败:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : '未知错误' 
            };
        }
    });
    // 清除用户数据
    ipcMain.handle('userData:clear', async (_event, userId: string) => {
        try {
            await localAccountStorageService.clearUserData(userId);
            return { success: true };
        } catch (error) {
            console.error('清除用户数据失败:', error);
            return { success: false, error: error instanceof Error ? error.message : '未知错误' };
        }
    });

    // 获取用户数据大小
    ipcMain.handle('userData:getSize', async (_event, userId: string) => {
        try {
            const size = await localAccountStorageService.getUserDataSize(userId);
            return { success: true, size };
        } catch (error) {
            console.error('获取用户数据大小失败:', error);
            return { success: false, error: error instanceof Error ? error.message : '未知错误' };
        }
    });
}