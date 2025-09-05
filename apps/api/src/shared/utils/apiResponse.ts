/**
 * API项目响应工具
 * 基于新的响应系统重构
 */

import type { Response } from 'express';
import { createResponseBuilder, createExpressResponseHelper } from '@dailyuse/utils';
import type { ResponseBuilderOptions } from '@dailyuse/contracts';

/**
 * 创建响应助手，用于API路由
 */
export function createApiResponseHelper(res: Response, options?: ResponseBuilderOptions) {
  return createExpressResponseHelper(res, createResponseBuilder(options));
}

/**
 * 成功响应
 */
export const ok = <T>(res: Response, data?: T, message = 'ok') => {
  const helper = createApiResponseHelper(res);
  return helper.success(data, message);
};

/**
 * 创建成功响应
 */
export const created = <T>(res: Response, data?: T, message = 'created') => {
  const helper = createApiResponseHelper(res);
  return helper.created(data, message);
};

/**
 * 请求参数错误响应
 */
export const badRequest = (res: Response, message = 'bad request', errors?: any[]) => {
  const helper = createApiResponseHelper(res);
  return helper.badRequest(message, errors);
};

/**
 * 未授权响应
 */
export const unauthorized = (res: Response, message = 'unauthorized') => {
  const helper = createApiResponseHelper(res);
  return helper.unauthorized(message);
};

/**
 * 禁止访问响应
 */
export const forbidden = (res: Response, message = 'forbidden') => {
  const helper = createApiResponseHelper(res);
  return helper.forbidden(message);
};

/**
 * 资源未找到响应
 */
export const notFound = (res: Response, message = 'not found') => {
  const helper = createApiResponseHelper(res);
  return helper.notFound(message);
};

/**
 * 内部错误响应
 */
export const error = (res: Response, message = 'internal error', status = 500, debug?: any) => {
  const helper = createApiResponseHelper(res);
  return helper.internalError(message, debug);
};

/**
 * 验证错误响应
 */
export const validationError = (res: Response, message = 'validation failed', errors?: any[]) => {
  const helper = createApiResponseHelper(res);
  return helper.validationError(message, errors);
};

/**
 * 业务逻辑错误响应
 */
export const businessError = (res: Response, message: string, errorCode?: string) => {
  const helper = createApiResponseHelper(res);
  return helper.businessError(message, errorCode);
};
