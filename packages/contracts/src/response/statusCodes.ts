/**
 * 响应状态码与HTTP状态码的映射关系
 * 提供业务状态码到HTTP状态码的转换
 */

/**
 * 响应状态码枚举（与 index.ts 保持一致）
 */
const ResponseCode = {
  // 成功状态 (200)
  SUCCESS: 200,

  // 客户端错误 (400-499)
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,

  // 服务器错误 (500-599)
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,

  // 业务逻辑错误 (1000-1999)
  BUSINESS_ERROR: 1000,
  DOMAIN_ERROR: 1001,
  DATABASE_ERROR: 1002,
  EXTERNAL_SERVICE_ERROR: 1003,
} as const;

type ResponseCode = (typeof ResponseCode)[keyof typeof ResponseCode];

/**
 * 响应码到HTTP状态码的映射
 */
export const RESPONSE_CODE_TO_HTTP_STATUS: Record<number, number> = {
  // 成功状态
  [ResponseCode.SUCCESS]: 200,

  // 客户端错误 4xx
  [ResponseCode.BAD_REQUEST]: 400,
  [ResponseCode.UNAUTHORIZED]: 401,
  [ResponseCode.FORBIDDEN]: 403,
  [ResponseCode.NOT_FOUND]: 404,
  [ResponseCode.CONFLICT]: 409,
  [ResponseCode.VALIDATION_ERROR]: 422,
  [ResponseCode.TOO_MANY_REQUESTS]: 429,

  // 服务器错误 5xx
  [ResponseCode.INTERNAL_ERROR]: 500,
  [ResponseCode.BAD_GATEWAY]: 502,
  [ResponseCode.SERVICE_UNAVAILABLE]: 503,
  [ResponseCode.GATEWAY_TIMEOUT]: 504,

  // 业务逻辑错误（映射到400）
  [ResponseCode.BUSINESS_ERROR]: 400,
  [ResponseCode.DOMAIN_ERROR]: 400,
  [ResponseCode.DATABASE_ERROR]: 500,
  [ResponseCode.EXTERNAL_SERVICE_ERROR]: 502,
};

/**
 * 根据响应码获取HTTP状态码
 * @param code 业务响应码
 * @returns HTTP状态码，默认500
 */
export function getHttpStatusCode(code: ResponseCode): number {
  return RESPONSE_CODE_TO_HTTP_STATUS[code] || 500;
}

/**
 * 判断响应码是否为成功状态
 * @param code 业务响应码
 * @returns 是否成功
 */
export function isSuccessCode(code: ResponseCode): boolean {
  return code === ResponseCode.SUCCESS;
}

/**
 * 判断响应码是否为客户端错误
 * @param code 业务响应码
 * @returns 是否为客户端错误（4xx）
 */
export function isClientError(code: ResponseCode): boolean {
  const httpStatus = getHttpStatusCode(code);
  return httpStatus >= 400 && httpStatus < 500;
}

/**
 * 判断响应码是否为服务器错误
 * @param code 业务响应码
 * @returns 是否为服务器错误（5xx）
 */
export function isServerError(code: ResponseCode): boolean {
  const httpStatus = getHttpStatusCode(code);
  return httpStatus >= 500;
}

/**
 * 判断响应码是否为业务逻辑错误
 * @param code 业务响应码
 * @returns 是否为业务逻辑错误（1000-1999）
 */
export function isBusinessError(code: ResponseCode): boolean {
  return code >= 1000 && code < 2000;
}

/**
 * 响应码描述映射
 */
export const RESPONSE_CODE_MESSAGES: Record<number, string> = {
  // 成功状态
  [ResponseCode.SUCCESS]: '操作成功',

  // 客户端错误
  [ResponseCode.BAD_REQUEST]: '请求参数错误',
  [ResponseCode.UNAUTHORIZED]: '未授权访问',
  [ResponseCode.FORBIDDEN]: '禁止访问',
  [ResponseCode.NOT_FOUND]: '资源不存在',
  [ResponseCode.CONFLICT]: '资源冲突',
  [ResponseCode.VALIDATION_ERROR]: '参数验证失败',
  [ResponseCode.TOO_MANY_REQUESTS]: '请求过于频繁',

  // 服务器错误
  [ResponseCode.INTERNAL_ERROR]: '服务器内部错误',
  [ResponseCode.BAD_GATEWAY]: '网关错误',
  [ResponseCode.SERVICE_UNAVAILABLE]: '服务暂时不可用',
  [ResponseCode.GATEWAY_TIMEOUT]: '网关超时',

  // 业务逻辑错误
  [ResponseCode.BUSINESS_ERROR]: '业务逻辑错误',
  [ResponseCode.DOMAIN_ERROR]: '领域逻辑错误',
  [ResponseCode.DATABASE_ERROR]: '数据库错误',
  [ResponseCode.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
};

/**
 * 获取响应码的默认消息
 * @param code 业务响应码
 * @returns 默认消息
 */
export function getResponseCodeMessage(code: ResponseCode): string {
  return RESPONSE_CODE_MESSAGES[code] || '未知错误';
}
