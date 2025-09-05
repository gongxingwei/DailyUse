/**
 * 新响应系统使用示例
 * 这个文件展示了如何使用新的响应系统
 */

import {
  createResponseBuilder,
  createExpressResponseHelper,
  type ResponseBuilderOptions,
  type ApiResponse,
  type SuccessResponse,
  type ApiErrorResponse,
  ResponseStatus,
  ResponseSeverity,
} from '@dailyuse/utils';

// === 基础使用示例 ===

/**
 * 1. 创建成功响应
 */
function createSuccessExample() {
  const responseBuilder = createResponseBuilder();

  // 简单成功响应
  const response = responseBuilder.success({ id: 1, name: '用户' }, '获取用户成功');

  console.log('成功响应:', response);
  // 输出:
  // {
  //   status: 'SUCCESS',
  //   success: true,
  //   message: '获取用户成功',
  //   data: { id: 1, name: '用户' },
  //   metadata: {
  //     requestId: 'uuid-here',
  //     timestamp: 1234567890,
  //     version: '1.0.0',
  //     duration: 10,
  //     nodeId: 'default'
  //   }
  // }
}

/**
 * 2. 创建错误响应
 */
function createErrorExample() {
  const responseBuilder = createResponseBuilder({
    requestId: 'custom-request-id',
    includeDebug: true,
  });

  // 验证错误
  const validationError = responseBuilder.validationError('用户数据验证失败', [
    {
      field: 'email',
      code: 'INVALID_EMAIL',
      message: '邮箱格式不正确',
      value: 'invalid-email',
    },
  ]);

  console.log('验证错误响应:', validationError);
}

/**
 * 3. 创建列表响应
 */
function createListExample() {
  const responseBuilder = createResponseBuilder();

  const users = [
    { id: 1, name: '用户1' },
    { id: 2, name: '用户2' },
  ];

  const pagination = {
    page: 1,
    pageSize: 20,
    total: 100,
    totalPages: 5,
    hasNext: true,
    hasPrev: false,
  };

  const listResponse = responseBuilder.list(users, pagination, '获取用户列表成功');

  console.log('列表响应:', listResponse);
}

/**
 * 4. 创建批量操作响应
 */
function createBatchExample() {
  const responseBuilder = createResponseBuilder();

  const batchResult = {
    successCount: 8,
    failureCount: 2,
    totalCount: 10,
    successes: [
      { id: 1, name: '用户1' },
      { id: 2, name: '用户2' },
    ],
    failures: [
      {
        item: { id: 3, name: '用户3' },
        error: {
          code: 'DUPLICATE_EMAIL',
          message: '邮箱已存在',
        },
      },
    ],
  };

  const batchResponse = responseBuilder.batch(batchResult, '批量创建用户完成');

  console.log('批量操作响应:', batchResponse);
}

// === Express 集成示例 ===

/**
 * Express 路由处理器示例
 */
function expressRouterExample() {
  // 这是伪代码，展示如何在 Express 路由中使用
  const routeHandler = (req: any, res: any) => {
    const responseHelper = createExpressResponseHelper(
      res,
      createResponseBuilder({
        requestId: req.headers['x-request-id'],
        startTime: Date.now(),
      }),
    );

    try {
      // 业务逻辑
      const userData = { id: 1, name: '新用户' };

      // 返回成功响应
      return responseHelper.success(userData, '用户创建成功');
    } catch (error) {
      // 返回错误响应
      if (error instanceof Error) {
        return responseHelper.internalError('服务器内部错误', {
          stack: error.stack,
          message: error.message,
        });
      }

      return responseHelper.internalError('未知错误');
    }
  };

  console.log('Express 路由处理器已定义');
}

// === 错误处理示例 ===

/**
 * 业务错误处理示例
 */
function businessErrorExample() {
  const responseBuilder = createResponseBuilder();

  // 业务逻辑错误
  const businessError = responseBuilder.businessError('用户账户余额不足', 'INSUFFICIENT_BALANCE');

  // 领域错误
  const domainError = responseBuilder.domainError('用户年龄必须大于18岁', 'INVALID_AGE');

  console.log('业务错误:', businessError);
  console.log('领域错误:', domainError);
}

// === 自定义配置示例 ===

/**
 * 自定义配置示例
 */
function customConfigExample() {
  const customOptions: ResponseBuilderOptions = {
    requestId: 'custom-id-123',
    version: '2.0.0',
    startTime: Date.now() - 1000, // 1秒前开始
    nodeId: 'server-node-01',
    includeDebug: process.env.NODE_ENV === 'development',
  };

  const responseBuilder = createResponseBuilder(customOptions);

  const response = responseBuilder.success({ test: 'data' }, '自定义配置测试');

  console.log('自定义配置响应:', response);
}

// === 运行示例 ===
export function runExamples() {
  console.log('=== 新响应系统使用示例 ===\n');

  console.log('1. 成功响应示例:');
  createSuccessExample();

  console.log('\n2. 错误响应示例:');
  createErrorExample();

  console.log('\n3. 列表响应示例:');
  createListExample();

  console.log('\n4. 批量操作响应示例:');
  createBatchExample();

  console.log('\n5. Express 集成示例:');
  expressRouterExample();

  console.log('\n6. 业务错误处理示例:');
  businessErrorExample();

  console.log('\n7. 自定义配置示例:');
  customConfigExample();
}

// 如果直接运行此文件
if (require.main === module) {
  runExamples();
}
