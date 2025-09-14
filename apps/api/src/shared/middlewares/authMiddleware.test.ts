import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../authMiddleware';

/**
 * JWT认证中间件测试
 * 这是一个简单的测试文件，用于验证认证中间件的功能
 */

// 模拟Express的res对象
const createMockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// 模拟Express的next函数
const createMockNext = () => jest.fn();

describe('JWT认证中间件测试', () => {
  const JWT_SECRET = 'test-secret';
  const ACCOUNT_UUID = 'test-account-uuid-123';

  // 设置环境变量
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  // 创建测试用的有效JWT token
  const createValidToken = (accountUuid = ACCOUNT_UUID) => {
    return jwt.sign(
      {
        accountUuid,
        type: 'ACCESS_TOKEN',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
      },
      JWT_SECRET,
    );
  };

  // 创建测试用的过期JWT token
  const createExpiredToken = (accountUuid = ACCOUNT_UUID) => {
    return jwt.sign(
      {
        accountUuid,
        type: 'ACCESS_TOKEN',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1小时前过期
      },
      JWT_SECRET,
    );
  };

  describe('成功认证场景', () => {
    test('应该成功验证有效的JWT token', () => {
      const token = createValidToken();
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user?.accountUuid).toBe(ACCOUNT_UUID);
      expect(req.accountUuid).toBe(ACCOUNT_UUID);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('认证失败场景', () => {
    test('应该拒绝没有Authorization header的请求', () => {
      const req = {
        headers: {},
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少认证令牌，请提供有效的Authorization header',
      });
    });

    test('应该拒绝不是Bearer格式的Authorization header', () => {
      const req = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz', // Basic认证格式
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少认证令牌，请提供有效的Authorization header',
      });
    });

    test('应该拒绝空的token', () => {
      const req = {
        headers: {
          authorization: 'Bearer ',
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌不能为空',
      });
    });

    test('应该拒绝无效的JWT token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '无效的认证令牌，请重新登录',
      });
    });

    test('应该拒绝过期的JWT token', () => {
      const expiredToken = createExpiredToken();
      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '认证令牌已过期，请重新登录',
      });
    });

    test('应该拒绝缺少accountUuid的token', () => {
      const tokenWithoutAccountUuid = jwt.sign(
        {
          type: 'ACCESS_TOKEN',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        JWT_SECRET,
      );

      const req = {
        headers: {
          authorization: `Bearer ${tokenWithoutAccountUuid}`,
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '无效的认证令牌：缺少用户信息',
      });
    });
  });

  describe('边界条件测试', () => {
    test('应该处理非常长的token', () => {
      const longAccountUuid = 'a'.repeat(1000); // 1000个字符的UUID
      const token = createValidToken(longAccountUuid);

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.accountUuid).toBe(longAccountUuid);
    });

    test('应该处理包含特殊字符的accountUuid', () => {
      const specialAccountUuid = 'user-123_test@domain.com';
      const token = createValidToken(specialAccountUuid);

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.accountUuid).toBe(specialAccountUuid);
    });
  });
});

// 使用示例测试
describe('中间件使用示例', () => {
  test('控制器中使用认证信息的示例', () => {
    const token = jwt.sign(
      {
        accountUuid: 'example-user-uuid',
        type: 'ACCESS_TOKEN',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret',
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        name: '测试目标',
        description: '这是一个测试目标',
      },
    } as AuthenticatedRequest;

    const res = createMockResponse();
    const next = createMockNext();

    // 应用认证中间件
    authMiddleware(req, res, next);

    // 验证中间件设置了用户信息
    expect(req.accountUuid).toBe('example-user-uuid');
    expect(req.user?.accountUuid).toBe('example-user-uuid');

    // 模拟控制器逻辑
    const accountUuid = req.accountUuid!; // 从中间件获取
    const requestData = req.body;

    expect(accountUuid).toBe('example-user-uuid');
    expect(requestData.name).toBe('测试目标');

    // 注意：请求数据中不需要包含accountUuid
    expect(requestData.accountUuid).toBeUndefined();
  });
});
