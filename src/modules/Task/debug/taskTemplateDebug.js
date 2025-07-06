/**
 * 任务模板创建流程调试测试
 * 用于手动测试和调试任务模板创建过程中的序列化问题
 */

// 这个文件用于在开发者工具的控制台中手动执行测试

/**
 * 测试用的任务模板数据
 */
const testTaskTemplateData = {
  id: 'test-template-' + Date.now(),
  title: '测试任务模板',
  description: '这是一个用于调试的测试任务模板',
  timeConfig: {
    duration: 30,
    unit: 'minutes',
    startTime: null,
    endTime: null,
    timeSlots: []
  },
  reminderConfig: {
    enabled: true,
    advanceTime: 10,
    advanceUnit: 'minutes',
    sound: true,
    popup: true
  },
  schedulingPolicy: {
    allowReschedule: true,
    maxDelayDays: 3,
    skipWeekends: false,
    skipHolidays: false,
    workingHoursOnly: false
  },
  metadata: {
    category: '测试',
    tags: ['调试', '测试'],
    priority: 'medium',
    difficulty: 'easy',
    estimatedDuration: 30,
    location: '办公室'
  },
  lifecycle: {
    status: 'draft',
    createdAt: {
      isoString: new Date().toISOString(),
      timestamp: Date.now()
    },
    updatedAt: {
      isoString: new Date().toISOString(),
      timestamp: Date.now()
    }
  },
  analytics: {
    completionRate: 0,
    averageCompletionTime: 0,
    totalCompletions: 0,
    lastCompletedAt: null
  },
  keyResultLinks: [],
  version: 1
};

/**
 * 测试序列化功能
 */
function testSerialization() {
  console.log('🧪 开始测试序列化功能');
  
  try {
    const serialized = JSON.stringify(testTaskTemplateData);
    console.log('✅ 测试数据可序列化，字符串长度:', serialized.length);
    
    const deserialized = JSON.parse(serialized);
    console.log('✅ 测试数据可反序列化');
    
    return true;
  } catch (error) {
    console.error('❌ 序列化测试失败:', error);
    return false;
  }
}

/**
 * 测试任务模板创建流程
 */
async function testTaskTemplateCreation() {
  console.log('🧪 开始测试任务模板创建流程');
  
  // 首先测试序列化
  if (!testSerialization()) {
    console.error('❌ 序列化测试失败，终止测试');
    return;
  }
  
  try {
    // 获取任务IPC客户端（假设已经初始化）
    if (!window.taskIpcClient) {
      console.error('❌ taskIpcClient 未初始化');
      return;
    }
    
    console.log('🔄 调用任务模板创建API');
    const result = await window.taskIpcClient.createTaskTemplate(testTaskTemplateData);
    
    console.log('📋 任务模板创建结果:', result);
    
    if (result.success) {
      console.log('✅ 任务模板创建成功');
    } else {
      console.error('❌ 任务模板创建失败:', result.message);
    }
    
  } catch (error) {
    console.error('❌ 任务模板创建过程中发生错误:', error);
    
    // 检查是否是克隆错误
    if (error instanceof Error && error.message.includes('could not be cloned')) {
      console.error('🚨 检测到克隆错误 - 这表明存在不可序列化的对象');
      console.error('💡 建议检查：');
      console.error('  1. 主进程返回的数据是否包含函数或循环引用');
      console.error('  2. TaskTemplate 实体类的 toDTO() 方法是否正确');
      console.error('  3. 数据库仓库返回的对象是否纯净');
    }
  }
}

/**
 * 分步调试函数
 */
async function debugStepByStep() {
  console.log('🧪 开始分步调试');
  
  // 步骤1：测试序列化
  console.log('📋 步骤1：测试基础序列化');
  testSerialization();
  
  // 步骤2：测试serializeForIpc函数
  console.log('📋 步骤2：测试serializeForIpc函数');
  try {
    if (window.serializeForIpc) {
      const serialized = window.serializeForIpc(testTaskTemplateData);
      console.log('✅ serializeForIpc 调用成功:', serialized);
    } else {
      console.log('⚠️ serializeForIpc 函数不可用');
    }
  } catch (error) {
    console.error('❌ serializeForIpc 调用失败:', error);
  }
  
  // 步骤3：测试IPC客户端
  console.log('📋 步骤3：测试IPC客户端');
  if (window.taskIpcClient) {
    console.log('✅ taskIpcClient 可用');
    
    // 可以在这里添加更多具体的测试
  } else {
    console.error('❌ taskIpcClient 不可用');
  }
}

// 将测试函数暴露到全局作用域，方便在控制台中调用
if (typeof window !== 'undefined') {
  window.debugTaskTemplate = {
    testSerialization,
    testTaskTemplateCreation,
    debugStepByStep,
    testData: testTaskTemplateData
  };
  
  console.log('🧪 任务模板调试工具已加载');
  console.log('💡 使用方法：');
  console.log('  - window.debugTaskTemplate.testSerialization() - 测试序列化');
  console.log('  - window.debugTaskTemplate.testTaskTemplateCreation() - 测试完整创建流程');
  console.log('  - window.debugTaskTemplate.debugStepByStep() - 分步调试');
  console.log('  - window.debugTaskTemplate.testData - 查看测试数据');
}
