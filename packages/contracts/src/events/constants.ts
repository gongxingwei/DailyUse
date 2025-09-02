/**
 * 所有事件类型的常量定义
 * 这样可以避免字符串拼写错误，并提供类型提示
 */
export const EVENT_TYPES = {
  ACCOUNT: {
    /** 账户注册事件 */
    REGISTERED: 'AccountRegistered' as const,
    /** 账户创建事件 */
    CREATED: 'AccountCreated' as const,
    /** 账户状态变更事件 */
    STATUS_CHANGED: 'AccountStatusChanged' as const,
    /** 账户信息更新事件 */
    UPDATED: 'AccountUpdated' as const,
    /** 账户状态验证响应事件 */
    STATUS_VERIFICATION_RESPONSE: 'AccountStatusVerificationResponse' as const,
    /** 账户UUID获取响应事件 */
    UUID_GETTER_RESPONSE: 'AccountUuidGetterResponse' as const,
    /** 通过用户名获取账户信息响应事件 */
    INFO_GETTER_BY_USERNAME_RESPONSE: 'AccountInfoGetterByUsernameResponse' as const,
    /** 通过UUID获取账户信息响应事件 */
    INFO_GETTER_BY_UUID_RESPONSE: 'AccountInfoGetterByUuidResponse' as const,
  },
  AUTH: {
    /** 通过UUID获取账户信息请求事件 */
    ACCOUNT_INFO_GETTER_BY_UUID_REQUESTED: 'AccountInfoGetterByUuidRequested' as const,
    /** 通过用户名获取账户信息请求事件 */
    ACCOUNT_INFO_GETTER_BY_USERNAME_REQUESTED: 'AccountInfoGetterByUsernameRequested' as const,
    /** 账户状态验证请求事件 */
    ACCOUNT_STATUS_VERIFICATION_REQUESTED: 'AccountStatusVerificationRequested' as const,
    /** 登录凭证验证事件 */
    LOGIN_CREDENTIAL_VERIFICATION: 'LoginCredentialVerification' as const,
    /** 登录尝试事件 */
    LOGIN_ATTEMPT: 'LoginAttempt' as const,
    /** 用户登录成功事件 */
    USER_LOGGED_IN: 'UserLoggedIn' as const,
    /** 账户注销验证请求事件 */
    ACCOUNT_DEACTIVATION_VERIFICATION_REQUESTED:
      'AccountDeactivationVerificationRequested' as const,
    /** 账户注销验证响应事件 */
    ACCOUNT_DEACTIVATION_VERIFICATION_RESPONSE: 'AccountDeactivationVerificationResponse' as const,
    /** 账户注销确认事件 */
    ACCOUNT_DEACTIVATION_CONFIRMED: 'AccountDeactivationConfirmed' as const,
    /** 用户登出事件 */
    USER_LOGGED_OUT: 'UserLoggedOut' as const,
    /** 会话终止事件 */
    SESSION_TERMINATED: 'SessionTerminated' as const,
    /** 全部会话终止事件 */
    ALL_SESSIONS_TERMINATED: 'AllSessionsTerminated' as const,
  },
} as const;

/**
 * 从常量中提取所有事件类型的联合类型
 */
export type AllEventTypes =
  | (typeof EVENT_TYPES.ACCOUNT)[keyof typeof EVENT_TYPES.ACCOUNT]
  | (typeof EVENT_TYPES.AUTH)[keyof typeof EVENT_TYPES.AUTH];
