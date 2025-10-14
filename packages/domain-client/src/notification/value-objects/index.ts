/**
 * Notification 模块值对象导出 (Client)
 *
 * 注意：客户端可能不需要所有值对象的完整实现
 * 这里只导出必要的值对象
 */

export { NotificationActionClient } from './NotificationActionClient';
export { NotificationMetadataClient } from './NotificationMetadataClient';

// 其他值对象（CategoryPreference, DoNotDisturbConfig 等）
// 主要用于服务端，客户端通常直接使用 DTO
