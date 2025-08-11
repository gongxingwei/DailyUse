import type { Request, Response } from 'express';
import type { TResponse } from '../../types/index';
import type { LoginRequest } from '../users/types/user';
import { AccountRepository } from '../../adapters/auth/account.repository';
import { BcryptHasher } from '../../adapters/auth/hasher.adapter';
import { JwtAdapter, RefreshJwtAdapter } from '../../adapters/auth/jwt.adapter';
import {
  loginUseCase,
  registerUseCase,
  refreshTokenUseCase,
  logoutUseCase,
} from '@dailyuse/domain';
import { PrismaAuthTokenRepository } from '../../adapters/auth/token.repository';

export class AuthController {
  static async refreshToken(
    req: Request<object, object, { refreshToken: string }>,
    res: Response<TResponse<{ accessToken: string }>>,
  ): Promise<void> {
    try {
      const uc = refreshTokenUseCase({
        accessJwt: new JwtAdapter(),
        refreshJwt: new RefreshJwtAdapter(),
        tokens: new PrismaAuthTokenRepository(),
        accounts: new AccountRepository(),
      });
      const result = await uc({ refreshToken: req.body.refreshToken });
      res.json({ success: true, data: result, message: '刷新成功' });
    } catch (e) {
      res
        .status(400)
        .json({ success: false, message: e instanceof Error ? e.message : '刷新失败' });
    }
  }

  static async register(
    req: Request<
      object,
      object,
      { username: string; password: string; email?: string; phone?: string }
    >,
    res: Response<TResponse>,
  ) {
    try {
      const uc = registerUseCase({ accounts: new AccountRepository(), hasher: new BcryptHasher() });
      const user = await uc(req.body);
      res.status(201).json({ success: true, data: user, message: '注册成功' });
    } catch (e) {
      res
        .status(400)
        .json({ success: false, message: e instanceof Error ? e.message : '注册失败' });
    }
  }

  /**
   * 处理用户登录请求（领域用例）
   */
  static async login(
    req: Request<object, object, LoginRequest>,
    res: Response<TResponse>,
  ): Promise<void> {
    try {
      const uc = loginUseCase({
        accounts: new AccountRepository(),
        hasher: new BcryptHasher(),
        accessJwt: new JwtAdapter(),
        refreshJwt: new RefreshJwtAdapter(),
        tokens: new PrismaAuthTokenRepository(),
      });
      const result = await uc({ username: req.body.username, password: req.body.password });
      res.json({
        success: true,
        data: {
          userWithoutPassword: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        message: '登录成功',
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '登录失败',
      });
    }
  }

  static async logout(
    req: Request<object, object, { userId: string; refreshToken: string }>,
    res: Response<TResponse>,
  ): Promise<void> {
    try {
      const uc = logoutUseCase({ tokens: new PrismaAuthTokenRepository() });
      await uc({ userId: req.body.userId, refreshToken: req.body.refreshToken });
      res.json({ success: true, message: '登出成功' });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '登出失败',
      });
    }
  }
}
