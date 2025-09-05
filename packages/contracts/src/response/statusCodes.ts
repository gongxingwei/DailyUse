/**
 * 响应状态码与HTTP状态码的映射关系
 */

// 引入响应状态常量
const ResponseStatusValues = {
  SUCCESS: 'SUCCESS',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  DOMAIN_ERROR: 'DOMAIN_ERROR',
} as const;

export const HTTP_STATUS_MAP: Record<string, number> = {
  // 成功状态
  [ResponseStatusValues.SUCCESS]: 200,

  // 客户端错误 4xx
  [ResponseStatusValues.BAD_REQUEST]: 400,
  [ResponseStatusValues.UNAUTHORIZED]: 401,
  [ResponseStatusValues.FORBIDDEN]: 403,
  [ResponseStatusValues.NOT_FOUND]: 404,
  [ResponseStatusValues.VALIDATION_ERROR]: 422,
  [ResponseStatusValues.CONFLICT]: 409,

  // 服务器错误 5xx
  [ResponseStatusValues.INTERNAL_ERROR]: 500,
  [ResponseStatusValues.SERVICE_UNAVAILABLE]: 503,
  [ResponseStatusValues.DATABASE_ERROR]: 500,
  [ResponseStatusValues.EXTERNAL_SERVICE_ERROR]: 502,

  // 业务逻辑错误
  [ResponseStatusValues.BUSINESS_ERROR]: 400,
  [ResponseStatusValues.DOMAIN_ERROR]: 400,
};

/**
 * 根据响应状态获取HTTP状态码
 */
export function getHttpStatusCode(status: string): number {
  return HTTP_STATUS_MAP[status] || 500;
}

/**
 * 判断响应状态是否为成功状态
 */
export function isSuccessStatus(status: string): boolean {
  return status === ResponseStatusValues.SUCCESS;
}

/**
 * 判断响应状态是否为客户端错误
 */
export function isClientError(status: string): boolean {
  const code = getHttpStatusCode(status);
  return code >= 400 && code < 500;
}

/**
 * 判断响应状态是否为服务器错误
 */
export function isServerError(status: string): boolean {
  const code = getHttpStatusCode(status);
  return code >= 500;
}
