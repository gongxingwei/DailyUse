// 测试 setting 模块的导入
try {
  console.log('Testing setting module import...');

  // 测试从主入口导入
  import('@dailyuse/contracts')
    .then((contracts) => {
      console.log('Main contracts imported');
      console.log('Available exports:', Object.keys(contracts));

      // 检查是否有 setting 相关的导出
      const settingExports = Object.keys(contracts).filter((key) =>
        key.toLowerCase().includes('setting'),
      );
      console.log('Setting-related exports:', settingExports);
    })
    .catch((err) => {
      console.error('Failed to import contracts:', err);
    });

  // 测试模块命名空间导入
  import('@dailyuse/contracts').then((contracts) => {
    const moduleContracts = (contracts as any).ModuleContracts;
    if (moduleContracts) {
      console.log('Module contracts available');
      console.log('Module exports:', Object.keys(moduleContracts));

      if (moduleContracts.Setting) {
        console.log('Setting module found!');
        console.log('Setting exports:', Object.keys(moduleContracts.Setting));
      } else {
        console.log('Setting module NOT found');
      }
    } else {
      console.log('ModuleContracts NOT available');
    }
  });
} catch (error) {
  console.error('Error during import test:', error);
}
