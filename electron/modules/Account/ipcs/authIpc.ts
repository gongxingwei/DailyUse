import { ipcMain } from "electron";

import { IRegisterForm, ILoginForm } from "@/modules/Account/types/auth";
import { authService } from "../services/authService";


export async function setupAuthHandlers() {

    ipcMain.handle("auth:register", async (_event, form: IRegisterForm) => {
        try {
            const response = await authService.register(form);
            return response;
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });

    ipcMain.handle("auth:login", async (_event, credentials: ILoginForm) => {
        try {
            const response = await authService.login(credentials);
            return response;
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });

    ipcMain.handle("auth:login-with-token", async (_event, userName: string, token: string) => {
        try {
            const response = await authService.loginWithToken(userName, token);
            return response;
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });

    ipcMain.handle("auth:logout", async (_event, userId: string) => {
        try {
            const response = await authService.logout(userId);
            return response;
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });

    ipcMain.handle("auth:check", async (_event, userId: string) => {
        try {
            const response = await authService.checkAuth(userId);
            return response;
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });
}