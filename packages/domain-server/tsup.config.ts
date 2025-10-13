/**
 * @dailyuse/domain-server 打包配置
 *
 * 包类型：服务端域模型库
 * 打包工具：tsup (基于 esbuild)
 *
 * 选择原因：
 * - Node.js 环境下的域模型
 * - tsup 对 Node.js 支持好
 * - 支持 tree-shaking 和代码分割
 */

import { domainConfig } from '../../tools/build/tsup.base.config';

export default domainConfig('@dailyuse/domain-server');
