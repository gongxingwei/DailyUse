/**
 * Theme Module - Enums
 * 主题模块 - 枚举类型定义
 */

/**
 * 主题模式枚举
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * 主题状态枚举
 */
export enum ThemeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * 主题类型枚举
 */
export enum ThemeType {
  SYSTEM = 'system', // 系统内置主题
  CUSTOM = 'custom', // 用户自定义主题
}

/**
 * 颜色模式枚举
 */
export enum ColorMode {
  /** RGB模式 */
  RGB = 'rgb',
  /** HSL模式 */
  HSL = 'hsl',
  /** 十六进制模式 */
  HEX = 'hex',
}

/**
 * 字体家族枚举
 */
export enum FontFamily {
  /** 系统默认 */
  SYSTEM = 'system',
  /** Sans Serif */
  SANS_SERIF = 'sans-serif',
  /** Serif */
  SERIF = 'serif',
  /** 等宽字体 */
  MONOSPACE = 'monospace',
  /** 自定义字体 */
  CUSTOM = 'custom',
}
