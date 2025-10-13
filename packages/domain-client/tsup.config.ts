/**
 * @dailyuse/domain-client 打包配置
 *
 * 包类型：前端域模型库
 * 打包工具：tsup (基于 esbuild)
 *
 * 选择原因：
 * - 前端域模型，需要优秀的 tree-shaking
 * - tsup 打包速度快，支持代码分割
 * - 支持 ESM 格式，适合现代前端
 */

import { domainConfig } from '../../tools/build/tsup.base.config';

export default domainConfig('@dailyuse/domain-client');
