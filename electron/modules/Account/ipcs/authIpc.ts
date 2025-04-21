import { ipcMain } from "electron";

import { IRegisterForm, ILoginForm } from "@/modules/Account/types/auth";
import { authService } from "../services/authService";


export async function setupAuthHandlers() {

    ipcMain.handle("auth:register", async (_event, form: IRegisterForm) => {
        try {
            const user = await authService.register(form);
            return { success: true, user };
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });

    ipcMain.handle("auth:login", async (_event, credentials: ILoginForm) => {
        try {
            const user = await authService.login(credentials);
            return { success: true, user };
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });

    ipcMain.handle("auth:logout", async () => {
        try {
            await authService.logout();
            return { success: true };
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });

    ipcMain.handle("auth:check", async () => {
        try {
            const user = await authService.checkAuth();
            return { success: true, user };
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
        }
    });
}