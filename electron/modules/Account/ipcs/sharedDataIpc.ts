import { ipcMain } from "electron";
import { sharedDataService } from "../services/sharedDataService";

export async function setupSharedDataHandlers() {
    // 获取所有保存的账号信息
    ipcMain.handle("sharedData:get-all-saved-account-info", async () => {
        try {
            const response = await sharedDataService.getAllSavedAccountInfo();
            return response;
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "获取账号信息失败"
            };
        }
    });

    // 添加保存的账号信息
    ipcMain.handle("sharedData:add-saved-account-info", async (_event, key: string, value: any) => {
        try {
            const response = await sharedDataService.addSavedAccountInfo(key, value);
            return response;
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "添加账号信息失败"
            };
        }
    });

    // 移除保存的账号信息
    ipcMain.handle("sharedData:remove-saved-account-info", async (_event, key: string) => {
        try {
            const response = await sharedDataService.removeSavedAccountInfo(key);
            return response;
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "删除账号信息失败"
            };
        }
    });

    // 更新保存的账号信息
    ipcMain.handle("sharedData:update-saved-account-info", async (_event, key: string, value: any) => {
        try {
            const response = await sharedDataService.updateSavedAccountInfo(key, value);
            return response;
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "更新账号信息失败"
            };
        }
    });
}