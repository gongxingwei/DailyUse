// 测试数据库连接脚本
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

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // 方法 1: 执行简单查询
    console.log('📊 Method 1: Raw SQL query');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);
    console.log('');
    
    // 方法 2: 检查数据库连接
    console.log('📊 Method 2: Database connection check');
    await prisma.$connect();
    console.log('✅ Connection successful');
    console.log('');
    
    // 方法 3: 列出所有表 (PostgreSQL)
    console.log('📊 Method 3: List tables');
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.log('✅ Tables found:', tables);
    console.log('');
    
    // 方法 4: 检查 Schedule 表是否存在
    console.log('📊 Method 4: Check Schedule table');
    const scheduleTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Schedule'
      );
    `;
    console.log('✅ Schedule table exists:', scheduleTableExists);
    console.log('');
    
    // 方法 5: 获取数据库版本
    console.log('📊 Method 5: Database version');
    const version = await prisma.$queryRaw`SELECT version();`;
    console.log('✅ Database version:', version);
    
    console.log('\n✅ All connection tests passed!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
    
    // 常见错误提示
    if (error.message.includes("Can't reach database server")) {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check if DATABASE_URL is set correctly in .env');
      console.error('  2. Verify network connection');
      console.error('  3. Check if database server is running');
      console.error('  4. Verify firewall/security group settings');
      console.error('  5. For Neon: Check if project is active and not paused');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testConnection();
