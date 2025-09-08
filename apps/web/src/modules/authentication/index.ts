/**
 * Authentication Module Entry Point
 * 认证模块统一导出入口
 *
 * 提供完整的认证功能，包括用户登录、注册、密码管理、会话管理等
 * 基于DDD架构模式实现，包含Domain、Application、Infrastructure、Presentation四个层次
 *
 * @version 1.0.0
 * @author DailyUse Team
 * @since 2024
 */

// ============================================================================
// Domain Layer Exports - 领域层导出
// ============================================================================

// Domain Models - 领域模型
export {} from './domain/entities';

// Domain Repository Interfaces - 领域仓储接口
export type {
  IAuthRepository,
  IRegistrationRepository,
} from './domain/repositories/IAuthRepository';

// Domain Services - 领域服务

// ============================================================================
// Application Layer Exports - 应用层导出
// ============================================================================

// Application Services - 应用服务
export { AuthApplicationService } from './application/services/AuthApplicationService';

// Initialization Functions - 初始化函数
export { registerAuthenticationInitializationTasks } from './initialization/authenticationInitialization';

// Event System - 事件系统
export {
  AUTH_EVENTS,
  publishUserLoggedInEvent,
  publishUserLoggedOutEvent,
  publishAuthStateChangedEvent,
  publishTokenRefreshedEvent,
} from './application/events/authEvents';

export type {
  UserLoggedInEventPayload,
  UserLoggedOutEventPayload,
  AuthStateChangedEventPayload,
  TokenRefreshedEventPayload,
} from './application/events/authEvents';

// ============================================================================
// Infrastructure Layer Exports - 基础设施层导出
// ============================================================================

// API Clients - API客户端
export { ApiClient } from './infrastructure/api/ApiClient';

// Repository Implementations - 仓储实现
// 暂不考虑

// ============================================================================
// Presentation Layer Exports - 表现层导出
// ============================================================================

// Pinia Stores - 状态管理
export { useAuthStore } from './presentation/stores/useAuthStore';

// Vue Components - Vue组件

// ============================================================================
// Module Configuration & Factory Functions
// ============================================================================

/**
 * Authentication Module Configuration
 * 认证模块配置接口
 */
export interface AuthModuleConfig {
  /** API base URL */
  apiBaseUrl?: string;

  /** API request timeout in milliseconds */
  apiTimeout?: number;

  /** Enable debug logging */
  enableLogging?: boolean;

  /** JWT token expiration buffer in minutes */
  tokenExpirationBuffer?: number;

  /** Maximum login attempts before lockout */
  maxLoginAttempts?: number;

  /** Session timeout in minutes */
  sessionTimeout?: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if user has specific permission
 * 检查用户是否具有特定权限
 */
export const hasPermission = (permission: string, userRoles: string[] = []): boolean => {
  // TODO: Implement permission checking logic
  return userRoles.some((role) => role.includes(permission));
};

/**
 * Format authentication error message
 * 格式化认证错误消息
 */
export const formatAuthError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.errors?.length > 0) return error.errors[0];
  return 'An unknown authentication error occurred';
};

/**
 * Generate device fingerprint for session security
 * 生成设备指纹用于会话安全
 */
export const generateDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    userAgent,
    platform,
    language,
    screenResolution,
    timezone,
    browserName: getBrowserName(userAgent),
    osName: getOSName(platform, userAgent),
  };
}; // Helper functions for device info
function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOSName(platform: string, userAgent: string): string {
  if (platform.includes('Win')) return 'Windows';
  if (platform.includes('Mac')) return 'macOS';
  if (platform.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

// ============================================================================
// Module Metadata
// ============================================================================

export const MODULE_INFO = {
  name: 'Authentication',
  version: '1.0.0',
  description: 'Complete authentication module with login, registration, and session management',
  author: 'DailyUse Team',
  architecture: 'DDD (Domain-Driven Design)',
  layers: ['Domain', 'Application', 'Infrastructure', 'Presentation'],
  features: [
    'User Login & Registration',
    'JWT Token Management',
    'Password Reset & Change',
    'Email Verification',
    'Session Management',
    'Security Validation',
    'Error Handling',
    'State Management',
  ],
} as const;
