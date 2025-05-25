import { myaxios } from "@/shared/axios/request";
import { TLoginData, TRegisterData } from "../types/user";
import type { TResponse } from "../../../shared/types/response";
class RemoteAuthService  {

    static async register(form: TRegisterData): Promise<TResponse> {
        try {
            const response = await myaxios.post<TResponse>('/api/register', form);
            return response as TResponse;
        } catch (error) {
            console.error("Registration error:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "注册失败",
                data: null,
            };
        }
    }

    static async login(loginForm: TLoginData): Promise<TResponse> {
        try {
            const response = await myaxios.post<TResponse>('/api/login', loginForm);
            if (response.success) {
                localStorage.setItem('token', response.data.token);

            }
            return response as TResponse;
        } catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "登录失败",
                data: null,
            };
        }
    }

    static async getUserInfo(): Promise<TResponse> {
        try {
            const response = await myaxios.get('/api/info');
            return response as TResponse;
        } catch (error) {
            console.error("Get user info error:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "获取用户信息失败",
                data: null,
            };
        }
    }

    static async logout(): Promise<TResponse> {
        try {
            const response = await myaxios.post('/auth/logout');
            localStorage.removeItem('token');
            return response as TResponse;
        } catch (error) {
            console.error("Logout error:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "登出失败",
                data: null,
            };
        }
    }
}

export const remoteAuthService = RemoteAuthService;