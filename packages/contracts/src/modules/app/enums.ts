/**
 * App 模块枚举定义
 */

export enum AppStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export enum AppEnvironment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  PRODUCTION = 'production',
}

export enum WindowState {
  NORMAL = 'normal',
  MINIMIZED = 'minimized',
  MAXIMIZED = 'maximized',
  FULLSCREEN = 'fullscreen',
}
