import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTable() {
  try {
    const result = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'key_result_weight_snapshots'
    `;
    
    console.log('✅ Query result:', result);
    
    if (result.length > 0) {
      console.log('✅ key_result_weight_snapshots table EXISTS!');
      
      // 获取表结构
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'key_result_weight_snapshots'
        ORDER BY ordinal_position
      `;
      
      console.log('\n📋 Table structure:');
      console.table(columns);
    } else {
      console.log('❌ key_result_weight_snapshots table does NOT exist');
      console.log('📝 Need to run migration!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkTable();
