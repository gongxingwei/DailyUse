/**
 * Theme Module Usage Example
 * @description 主题模块使用示例
 * @author DailyUse Team
 * @date 2025-09-29
 */

import { ThemeDefinition, ThemeConfig, ThemeService } from './index';
import { ThemeType } from '@dailyuse/contracts';

/**
 * 演示主题模块的基本使用
 */
async function demoThemeModule() {
  console.log('=== 主题模块演示 ===');

  // 创建主题服务实例
  const themeService = new ThemeService();

  // 1. 获取所有默认主题
  console.log('\n1. 获取所有主题:');
  const allThemes = await themeService.getAllThemes();
  console.log('可用主题:', allThemes.themes);

  // 2. 创建自定义主题
  console.log('\n2. 创建自定义主题:');
  const createResult = await themeService.createTheme({
    name: 'My Custom Theme',
    description: '我的自定义主题',
    type: ThemeType.CUSTOM, // Changed from LIGHT to CUSTOM
    author: 'User',
  });
  console.log('创建结果:', createResult);

  // 3. 应用主题
  if (createResult.success && createResult.theme) {
    console.log('\n3. 应用主题:');
    const applyResult = await themeService.applyTheme({
      themeId: createResult.theme.id,
    });
    console.log('应用结果:', applyResult);

    if (applyResult.success) {
      console.log('生成的CSS变量:', applyResult.appliedVariables);
      console.log('生成的CSS代码:', applyResult.css);
    }
  }

  // 4. 获取主题配置
  console.log('\n4. 获取主题配置:');
  const configResult = await themeService.getThemeConfig();
  console.log('配置结果:', configResult);

  // 5. 更新主题配置
  console.log('\n5. 更新主题配置:');
  const updateConfigResult = await themeService.updateThemeConfig({
    activeThemeId: 'light',
    followSystemTheme: true,
    enableTransitions: true,
    transitionDuration: 300,
  });
  console.log('更新配置结果:', updateConfigResult);

  // 6. 直接使用主题定义类
  console.log('\n6. 直接创建主题定义:');
  const customTheme = ThemeDefinition.create({
    name: 'Direct Theme',
    description: '直接创建的主题',
    type: ThemeType.SYSTEM, // Changed from DARK to SYSTEM
    author: 'Developer',
  });

  console.log('主题信息:');
  console.log('- ID:', customTheme.id);
  console.log('- 名称:', customTheme.name);
  console.log('- 类型:', customTheme.type);
  console.log('- 版本:', customTheme.version);

  // 验证主题
  const validation = customTheme.validate();
  console.log('验证结果:', validation);

  // 生成CSS
  const css = customTheme.generateCSS();
  console.log('生成的CSS:\n', css);

  console.log('\n=== 演示完成 ===');
}

// 导出演示函数
export { demoThemeModule };

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  demoThemeModule().catch(console.error);
}
