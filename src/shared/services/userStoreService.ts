import { StoreApi } from "@/shared/apis/storeApi";
import type { TResponse } from "@/shared/types/response";
import { useAccountStore } from "@/modules/Account/index";

/**
 * 用户存储服务 - 业务逻辑层
 * 结合当前用户信息，提供更便捷的存储操作
 */
export class UserStoreService {
  /**
   * 获取当前用户名
   * @returns 当前用户名，如果没有则返回 null
   */
  private static getCurrentUsername(): void {
    console.log("getCurrentUsername")
  }

  /**
   * 检查用户是否已登录
   * @returns 检查结果
   */
  private static checkUserAuth(): void{
    console.log("checkUserAuth")
  }

}