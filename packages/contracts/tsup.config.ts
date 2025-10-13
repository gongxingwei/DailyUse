/**
 * @dailyuse/contracts 打包配置
 *
 * 包类型：纯类型定义库
 * 打包工具：tsup (基于 esbuild)
 *
 * 选择原因：
 * - 纯类型定义包，无运行时依赖
 * - tsup 打包速度极快，支持 tree-shaking
 * - 无需处理 CSS/资源文件
 */

import { baseLibraryConfig } from '../../tools/build/tsup.base.config';

export default baseLibraryConfig('@dailyuse/contracts');
