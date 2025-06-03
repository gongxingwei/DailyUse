import { ipcMain, dialog } from "electron";
import { storeService } from "../services/storeService";
import type { UserDataExport } from "../services/storeService";

/**
 * 用户存储数据相关的 IPC 处理程序
 */
export class StoreIpc {
  /**
   * 注册所有 Store 相关的 IPC 处理程序
   */
  public static registerHandlers(): void {
    // 基础操作
    ipcMain.handle("store:read", this.handleReadUserStore.bind(this));
    ipcMain.handle("store:write", this.handleWriteUserStore.bind(this));
    ipcMain.handle("store:delete", this.handleDeleteUserStore.bind(this));
    ipcMain.handle("store:has", this.handleHasUserStore.bind(this));

    // 管理操作
    ipcMain.handle("store:list", this.handleGetUserStoreList.bind(this));
    ipcMain.handle("store:clear", this.handleClearUserData.bind(this));
    ipcMain.handle("store:stats", this.handleGetUserDataStats.bind(this));

    // 导入导出
    ipcMain.handle("store:export", this.handleExportUserData.bind(this));
    ipcMain.handle("store:export-to-file", this.handleExportUserDataToFile.bind(this));
    ipcMain.handle("store:import", this.handleImportUserData.bind(this));
    ipcMain.handle("store:import-from-file", this.handleImportUserDataFromFile.bind(this));
  }

  /**
   * 移除所有 Store 相关的 IPC 处理程序
   */
  public static removeHandlers(): void {
    const channels = [
      "store:read",
      "store:write", 
      "store:delete",
      "store:has",
      "store:list",
      "store:clear",
      "store:stats",
      "store:export",
      "store:export-to-file",
      "store:import",
      "store:import-from-file"
    ];

    channels.forEach(channel => {
      ipcMain.removeAllListeners(channel);
    });
  }

  /**
   * 读取用户存储数据
   */
  private static async handleReadUserStore(
    _event: Electron.IpcMainInvokeEvent,
    username: string,
    storeName: string
  ) {
    try {
      return await storeService.readUserStore(username, storeName);
    } catch (error) {
      console.error("IPC: 读取用户存储数据失败:", error);
      return {
        success: false,
        data: null,
        message: `读取失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 写入用户存储数据
   */
  private static async handleWriteUserStore(
    _event: Electron.IpcMainInvokeEvent,
    username: string,
    storeName: string,
    data: any
  ) {
    try {
      return await storeService.writeUserStore(username, storeName, data);
    } catch (error) {
      console.error("IPC: 写入用户存储数据失败:", error);
      return {
        success: false,
        data: undefined,
        message: `写入失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除用户存储数据
   */
  private static async handleDeleteUserStore(
    _event: Electron.IpcMainInvokeEvent,
    username: string,
    storeName: string
  ) {
    try {
      return await storeService.deleteUserStore(username, storeName);
    } catch (error) {
      console.error("IPC: 删除用户存储数据失败:", error);
      return {
        success: false,
        data: undefined,
        message: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 检查用户存储数据是否存在
   */
  private static async handleHasUserStore(
    _event: Electron.IpcMainInvokeEvent,
    username: string,
    storeName: string
  ) {
    try {
      return await storeService.hasUserStore(username, storeName);
    } catch (error) {
      console.error("IPC: 检查用户存储数据失败:", error);
      return {
        success: false,
        data: false,
        message: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取用户所有存储数据列表
   */
  private static async handleGetUserStoreList(
    _event: Electron.IpcMainInvokeEvent,
    username: string
  ) {
    try {
      return await storeService.getUserStoreList(username);
    } catch (error) {
      console.error("IPC: 获取用户存储列表失败:", error);
      return {
        success: false,
        data: [],
        message: `获取列表失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 清除用户所有数据
   */
  private static async handleClearUserData(
    _event: Electron.IpcMainInvokeEvent,
    username: string
  ) {
    try {
      return await storeService.clearUserData(username);
    } catch (error) {
      console.error("IPC: 清除用户数据失败:", error);
      return {
        success: false,
        data: 0,
        message: `清除失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取用户数据统计信息
   */
  private static async handleGetUserDataStats(
    _event: Electron.IpcMainInvokeEvent,
    username: string
  ) {
    try {
      return await storeService.getUserDataStats(username);
    } catch (error) {
      console.error("IPC: 获取用户数据统计失败:", error);
      return {
        success: false,
        data: {
          totalStores: 0,
          totalSize: 0,
          lastUpdated: null,
          storeDetails: []
        },
        message: `获取统计失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 导出用户数据（仅返回数据，不写入文件）
   */
  private static async handleExportUserData(
    _event: Electron.IpcMainInvokeEvent,
    username: string
  ) {
    try {
      return await storeService.exportUserData(username);
    } catch (error) {
      console.error("IPC: 导出用户数据失败:", error);
      return {
        success: false,
        data: {} as UserDataExport,
        message: `导出失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 导出用户数据到文件（显示保存对话框）
   */
  private static async handleExportUserDataToFile(
    _event: Electron.IpcMainInvokeEvent,
    username: string
  ) {
    try {
      // 显示保存对话框
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: "导出用户数据",
        defaultPath: `${username}_data_${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: "JSON 文件", extensions: ["json"] },
          { name: "所有文件", extensions: ["*"] }
        ]
      });

      if (canceled || !filePath) {
        return {
          success: false,
          data: {} as UserDataExport,
          message: "用户取消了导出操作"
        };
      }

      return await storeService.exportUserData(username, filePath);
    } catch (error) {
      console.error("IPC: 导出用户数据到文件失败:", error);
      return {
        success: false,
        data: {} as UserDataExport,
        message: `导出失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 导入用户数据
   */
  private static async handleImportUserData(
    _event: Electron.IpcMainInvokeEvent,
    username: string,
    importData: UserDataExport,
    overwrite: boolean = false
  ) {
    try {
      return await storeService.importUserData(username, importData, overwrite);
    } catch (error) {
      console.error("IPC: 导入用户数据失败:", error);
      return {
        success: false,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 从文件导入用户数据（显示打开对话框）
   */
  private static async handleImportUserDataFromFile(
    _event: Electron.IpcMainInvokeEvent,
    username: string,
    overwrite: boolean = false
  ) {
    try {
      // 显示打开对话框
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "选择导入文件",
        filters: [
          { name: "JSON 文件", extensions: ["json"] },
          { name: "所有文件", extensions: ["*"] }
        ],
        properties: ["openFile"]
      });

      if (canceled || filePaths.length === 0) {
        return {
          success: false,
          data: { imported: 0, skipped: 0, errors: 0 },
          message: "用户取消了导入操作"
        };
      }

      const filePath = filePaths[0];
      
      // 读取文件内容
      const fs = await import("fs/promises");
      const fileContent = await fs.readFile(filePath, "utf-8");
      const importData: UserDataExport = JSON.parse(fileContent);

      // 验证数据格式
      if (!importData.username || !importData.stores) {
        return {
          success: false,
          data: { imported: 0, skipped: 0, errors: 0 },
          message: "无效的数据格式"
        };
      }

      return await storeService.importUserData(username, importData, overwrite);
    } catch (error) {
      console.error("IPC: 从文件导入用户数据失败:", error);
      return {
        success: false,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}

// // 自动注册处理程序
// StoreIpc.registerHandlers();
