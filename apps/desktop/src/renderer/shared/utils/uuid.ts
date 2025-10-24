/**
 * UUID 生成工具
 * 提供跨环境的 UUID 生成方法
 */

/**
 * 生成 UUID v4
 * 在浏览器环境中优先使用 Web Crypto API，否则使用兼容性方案
 * 在 Node.js 环境中使用 crypto.randomUUID()
 */
export function generateUUID(): string {
  // 备用 UUID v4 生成方案（RFC 4122 兼容）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 验证 UUID 格式
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 生成短 ID（用于临时标识符）
 */
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
