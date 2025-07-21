import { Token } from "../valueObjects/token";
import type { ITokenRepository } from "../repositories/authenticationRepository";

export class TokenService {
  private static instance: TokenService;

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * 保存令牌
   */
  async saveToken(token: Token, tokenRepository: ITokenRepository): Promise<void> {
    try {
      await tokenRepository.save(token);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }

  /**
   * 验证 Token 是否合法
   * @param accountUuid 用户ID
   * @param tokenValue Token字符串
   * @param tokenRepository Token仓库
   * @returns 合法返回 true，否则 false
   */
  async isTokenValid(accountUuid: string, tokenValue: string, tokenRepository: ITokenRepository): Promise<boolean> {
    try {
      const token = await tokenRepository.findByValue(tokenValue);
      if (!token) return false;
      // 检查 token 是否属于该用户、未撤销、未过期
      if (token.accountUuid !== accountUuid) return false;
      if (token.isRevoked) return false;
      if (token.isExpired()) return false;
      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      return false;
    }
  }
}

export const tokenService = TokenService.getInstance();