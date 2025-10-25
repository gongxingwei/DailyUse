// 优化版数据库连接测试脚本 - 带重试机制
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// 加载 .env 文件
config();

console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Found' : '❌ Not found');
if (process.env.DATABASE_URL) {
  const urlParts = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (urlParts) {
    console.log('   Host:', urlParts[3]);
    console.log('   Port:', urlParts[4]);
    console.log('   Database:', urlParts[5]);
  }
}
console.log('');

// 增加连接超时和池配置
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

/**
 * 重试包装器 - 用于处理不稳定的网络连接
 */
async function withRetry(operation, maxRetries = 5, delayMs = 2000, operationName = 'Operation') {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} - Attempt ${attempt}/${maxRetries}`);
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} - Succeeded on attempt ${attempt} (${duration}ms)\n`);
      } else {
        console.log(`✅ ${operationName} - Success (${duration}ms)\n`);
      }
      return result;
    } catch (error) {
      lastError = error;
      console.log(`⚠️  ${operationName} - Attempt ${attempt}/${maxRetries} failed:`);
      console.log(`    ${error.message}`);
      
      if (attempt < maxRetries) {
        const waitTime = delayMs * attempt; // 指数退避
        console.log(`⏳ Waiting ${waitTime}ms before retry...\n`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.log('');
      }
    }
  }
  
  console.error(`❌ ${operationName} - All ${maxRetries} attempts failed\n`);
  throw lastError;
}

async function testConnection() {
  console.log('🔍 Testing database connection with retry logic...\n');
  console.log('⚙️  Configuration:');
  console.log('   - Max retries: 5');
  console.log('   - Initial delay: 2000ms');
  console.log('   - Backoff strategy: Exponential (2s, 4s, 6s, 8s, 10s)');
  console.log('');
  
  try {
    // 方法 1: 执行简单查询（带重试）
    console.log('📊 Method 1: Raw SQL query with retry');
    const result = await withRetry(
      async () => await prisma.$queryRaw`SELECT 1 as test, NOW() as server_time`,
      5,
      2000,
      'Raw SQL query'
    );
    console.log('   Result:', result);
    console.log('');
    
    // 方法 2: 检查数据库连接（带重试）
    console.log('📊 Method 2: Database connection check with retry');
    await withRetry(
      async () => await prisma.$connect(),
      5,
      2000,
      'Connection check'
    );
    
    // 方法 3: 列出所有表（带重试）
    console.log('📊 Method 3: List tables with retry');
    const tables = await withRetry(
      async () => await prisma.$queryRaw`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `,
      5,
      2000,
      'List tables'
    );
    console.log(`   Found ${tables.length} table(s):`);
    tables.forEach(t => console.log(`   - ${t.tablename}`));
    console.log('');
    
    // 方法 4: 检查 Schedule 表（带重试）
    console.log('📊 Method 4: Check Schedule table with retry');
    const scheduleTableExists = await withRetry(
      async () => {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'schedules'
          );
        `;
        return result[0].exists;
      },
      5,
      2000,
      'Check Schedule table'
    );
    console.log(`   Schedule table exists: ${scheduleTableExists ? '✅ Yes' : '❌ No'}`);
    console.log('');
    
    // 方法 5: 获取数据库版本（带重试）
    console.log('📊 Method 5: Get database version with retry');
    const version = await withRetry(
      async () => await prisma.$queryRaw`SELECT version()`,
      5,
      2000,
      'Get database version'
    );
    console.log('   Version:', version[0].version.split(',')[0]);
    console.log('');
    
    console.log('🎉 All tests passed! Database connection is stable.\n');
    
    // 输出总结
    console.log('📝 Summary:');
    console.log('   ✅ Database is reachable');
    console.log('   ✅ Connection is stable with retry mechanism');
    console.log('   ✅ All queries executed successfully');
    console.log('   ✅ Ready for Prisma migrations');
    console.log('');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('  1. Check if DATABASE_URL is set correctly in .env');
    console.log('  2. Verify network connection');
    console.log('  3. Check if database server is running');
    console.log('  4. Verify firewall/security group settings');
    console.log('  5. For Neon: Check if project is active and not paused');
    console.log('  6. Try increasing retry delay or max retries');
    console.log('');
    console.log('🔧 Current retry settings:');
    console.log('   - Retries attempted: 5 per operation');
    console.log('   - Total time: ~30 seconds per operation');
    console.log('   - Consider checking Neon Console for project status');
    console.log('');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
