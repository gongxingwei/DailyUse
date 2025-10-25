import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScheduleTable() {
  try {
    // 检查表是否存在
    const result = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'schedules'
    `;
    
    console.log('✅ Query result:', result);
    
    if (result.length > 0) {
      console.log('✅ schedules table EXISTS!');
      
      // 获取表结构
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'schedules'
        ORDER BY ordinal_position
      `;
      
      console.log('\n📋 Table structure:');
      console.table(columns);
      
      // 获取索引
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'schedules'
      `;
      
      console.log('\n🔍 Indexes:');
      console.table(indexes);
      
    } else {
      console.log('❌ schedules table does NOT exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkScheduleTable();
