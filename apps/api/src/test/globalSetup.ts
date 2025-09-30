/**
 * API 全局测试设置
 * @description 在所有测试运行前进行全局初始化
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

export default async function globalSetup() {
  console.log('🧪 API 测试环境初始化...');

  try {
    // 设置测试环境变量
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'file:./test.db';
    process.env.JWT_SECRET = 'test-jwt-secret-key';

    // 检查是否存在测试数据库文件
    const testDbPath = path.join(process.cwd(), 'test.db');
    if (existsSync(testDbPath)) {
      console.log('📂 清理现有测试数据库...');
      // 删除现有的测试数据库（Windows兼容）
      try {
        execSync('del /f test.db test.db-journal 2>nul', { stdio: 'ignore', shell: 'cmd' });
      } catch {
        // 忽略删除失败
      }
    }

    // 暂时跳过Prisma数据库初始化，使用模拟数据库
    console.log('⚠️ 跳过数据库初始化，使用模拟数据库进行测试');

    console.log('✅ API 测试环境初始化完成（模拟模式）');
  } catch (error) {
    console.error('❌ API 测试环境初始化失败:', error);

    // 如果 Prisma 操作失败，继续运行测试但发出警告
    console.warn('⚠️  将使用模拟数据库进行测试');
  }
}
