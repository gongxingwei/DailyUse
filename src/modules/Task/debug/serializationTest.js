/**
 * 任务模板创建快速测试脚本
 * 用于验证序列化问题的修复效果
 */

console.log('🧪 [测试脚本] 开始验证序列化修复效果');

// 创建测试用的任务模板数据
const createTestTaskTemplate = () => {
  return {
    id: 'test-' + Date.now(),
    title: '序列化测试任务模板',
    description: '用于验证序列化问题修复的测试模板',
    timeConfig: {
      type: 'timed',
      baseTime: {
        start: { 
          date: { year: 2025, month: 7, day: 6 },
          time: { hour: 8, minute: 0 }
        },
        end: { 
          date: { year: 2025, month: 7, day: 6 },
          time: { hour: 9, minute: 0 }
        },
        duration: 60
      },
      recurrence: { type: 'none' },
      timezone: 'Asia/Shanghai',
      dstHandling: 'ignore'
    },
    reminderConfig: {
      enabled: false,
      alerts: [],
      snooze: { enabled: false, interval: 5, maxCount: 1 }
    },
    schedulingPolicy: {
      allowReschedule: true,
      maxDelayDays: 7,
      skipWeekends: false,
      skipHolidays: false,
      workingHoursOnly: false
    },
    metadata: {
      category: 'test',
      tags: ['测试', '序列化'],
      priority: 3,
      difficulty: 3,
      estimatedDuration: 60
    },
    lifecycle: {
      status: 'draft',
      createdAt: {
        date: { year: 2025, month: 7, day: 6 },
        time: { hour: 11, minute: 33 },
        timestamp: Date.now(),
        isoString: new Date().toISOString()
      },
      updatedAt: {
        date: { year: 2025, month: 7, day: 6 },
        time: { hour: 11, minute: 33 },
        timestamp: Date.now(),
        isoString: new Date().toISOString()
      }
    },
    analytics: {
      totalInstances: 0,
      completedInstances: 0,
      successRate: 0
    },
    keyResultLinks: [],
    version: 1
  };
};

// 测试序列化函数
const testSerialization = (data, name) => {
  console.log(`🧪 [测试脚本] 测试 ${name} 的序列化`);
  try {
    const serialized = JSON.stringify(data);
    console.log(`✅ [测试脚本] ${name} 序列化成功，长度: ${serialized.length}`);
    return true;
  } catch (error) {
    console.error(`❌ [测试脚本] ${name} 序列化失败:`, error);
    return false;
  }
};

// 主测试函数
const runSerializationTest = async () => {
  console.log('🧪 [测试脚本] 开始完整的序列化测试');
  
  const testData = createTestTaskTemplate();
  
  // 测试原始数据
  if (!testSerialization(testData, '原始测试数据')) {
    console.error('❌ [测试脚本] 原始数据序列化失败，测试终止');
    return false;
  }
  
  // 测试基础序列化
  if (window.serializeForIpc) {
    try {
      const basicSerialized = window.serializeForIpc(testData);
      if (!testSerialization(basicSerialized, '基础序列化数据')) {
        console.error('❌ [测试脚本] 基础序列化失败');
      }
    } catch (error) {
      console.error('❌ [测试脚本] 基础序列化函数调用失败:', error);
    }
  }
  
  // 测试深度序列化
  if (window.deepSerializeForIpc) {
    try {
      const deepSerialized = window.deepSerializeForIpc(testData);
      if (!testSerialization(deepSerialized, '深度序列化数据')) {
        console.error('❌ [测试脚本] 深度序列化失败');
      }
    } catch (error) {
      console.error('❌ [测试脚本] 深度序列化函数调用失败:', error);
    }
  }
  
  // 测试任务模板创建
  if (window.taskIpcClient) {
    try {
      console.log('🧪 [测试脚本] 开始测试任务模板创建');
      const result = await window.taskIpcClient.createTaskTemplate(testData);
      console.log('✅ [测试脚本] 任务模板创建测试成功:', result);
      return true;
    } catch (error) {
      console.error('❌ [测试脚本] 任务模板创建测试失败:', error);
      
      // 检查是否是克隆错误
      if (error.message && error.message.includes('could not be cloned')) {
        console.error('🚨 [测试脚本] 仍然存在克隆错误！需要进一步修复');
      }
      return false;
    }
  } else {
    console.log('⚠️ [测试脚本] taskIpcClient 不可用，跳过创建测试');
    return true;
  }
};

// 暴露测试函数到全局作用域
if (typeof window !== 'undefined') {
  window.testTaskTemplateSerialization = runSerializationTest;
  window.createTestTaskTemplate = createTestTaskTemplate;
  
  console.log('🧪 [测试脚本] 测试函数已加载');
  console.log('💡 使用方法:');
  console.log('  - window.testTaskTemplateSerialization() - 运行完整测试');
  console.log('  - window.createTestTaskTemplate() - 创建测试数据');
}
