// Jest 设置文件
// 在这里可以配置全局的测试设置

// 全局设置
global.console = {
  ...console,
  // 在测试中禁用 console.log，但保留 console.error 和 console.warn
  log: (): void => {},
  debug: (): void => {},
  info: (): void => {},
  warn: console.warn,
  error: console.error,
};

// 设置测试超时
setTimeout(() => {}, 10000);
