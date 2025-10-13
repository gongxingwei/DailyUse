/**
 * @dailyuse/domain-core 打包配置
 *
 * 包类型：核心域模型库 (前后端共享)
 * 打包工具：tsup (基于 esbuild)
 *
 * 选择原因：
 * - 共享核心域模型，无运行时特定依赖
 * - 需要高效的 tree-shaking
 * - 支持前后端环境
 */

import { domainConfig } from '../../tools/build/tsup.base.config';

export default domainConfig('@dailyuse/domain-core');
