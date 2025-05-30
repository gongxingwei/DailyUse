import { myaxios } from "@/shared/axios/request";
import { TRegisterData } from "../types/account";
import type { TResponse } from "../../../shared/types/response";

class RemoteUserService {
  static async register(form: TRegisterData): Promise<TResponse> {
    try {
      const response = await myaxios.post<TResponse>("/api/register", form);
      return response as TResponse;
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "注册失败",
        data: undefined,
      };
    }
  }

  

  static async getUserInfo(): Promise<TResponse> {
    try {
      const response = await myaxios.get("/api/info");
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

  static async getCurrentUser(): Promise<TResponse> {
    try {
      const response = await myaxios.get("/api/current");
      return response as TResponse;
    } catch (error) {
      console.error("Get current user error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取当前用户失败",
        data: null,
      };
    }
  }

  
}

export const remoteUserService = RemoteUserService;
