// 任务模板功能测试脚本
// 这个文件可以帮助开发者了解功能的使用方式和验证修复

import { getTaskDomainApplicationService } from '@/modules/Task/application/services/taskDomainApplicationService';

/**
 * 测试删除所有任务模板功能
 */
export async function testDeleteAllTaskTemplates() {
  try {
    console.log('🧪 开始测试删除所有任务模板功能');
    
    // 获取服务实例
    const taskService = getTaskDomainApplicationService();
    
    // 1. 先查看当前有多少任务模板
    const templates = await taskService.getAllTaskTemplates();
    console.log(`📊 当前任务模板数量: ${templates.length}`);
    
    if (templates.length === 0) {
      console.log('⚠️ 没有任务模板需要删除');
      return;
    }
    
    // 2. 执行删除所有任务模板
    console.log('🔄 开始删除所有任务模板...');
    const result = await taskService.deleteAllTaskTemplates();
    
    // 3. 检查结果
    if (result.success) {
      console.log('✅ 删除成功:', result.message);
      
      // 验证删除结果
      const remainingTemplates = await taskService.getAllTaskTemplates();
      console.log(`📊 删除后剩余模板数量: ${remainingTemplates.length}`);
      
      if (remainingTemplates.length === 0) {
        console.log('✅ 验证通过：所有模板已成功删除');
      } else {
        console.log('❌ 验证失败：仍有模板残留');
      }
    } else {
      console.error('❌ 删除失败:', result.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

/**
 * 测试重复保存问题修复
 */
export async function testDuplicateSaveFix() {
  try {
    console.log('🧪 开始测试重复保存问题修复');
    
    const taskService = getTaskDomainApplicationService();
    
    // 1. 记录初始模板数量
    const initialTemplates = await taskService.getAllTaskTemplates();
    console.log(`📊 初始模板数量: ${initialTemplates.length}`);
    
    // 2. 从元模板创建任务模板（现在只创建不保存）
    console.log('🔄 从元模板创建任务模板（不保存）...');
    const newTemplate = await taskService.createTaskTemplateFromMetaTemplate(
      'daily-routine',
      '测试模板重复保存修复',
      {
        description: '测试重复保存问题是否已修复',
        priority: 3,
        tags: ['测试']
      }
    );
    
    console.log('✅ 模板创建成功（但未保存）:', newTemplate.title);
    
    // 3. 检查模板数量是否保持不变（因为还没保存）
    const afterCreateTemplates = await taskService.getAllTaskTemplates();
    console.log(`📊 创建后模板数量: ${afterCreateTemplates.length}`);
    
    if (afterCreateTemplates.length === initialTemplates.length) {
      console.log('✅ 创建成功，模板未自动保存（符合预期）');
    } else {
      console.log(`❌ 意外：模板可能被自动保存了，初始: ${initialTemplates.length}, 现在: ${afterCreateTemplates.length}`);
    }
    
    // 4. 手动保存模板（应该会增加模板数量）
    console.log('🔄 手动保存模板...');
    const saveResult = await taskService.createTaskTemplate(newTemplate.toDTO());
    
    if (saveResult.success) {
      console.log('✅ 保存成功');
      
      // 5. 检查模板数量是否增加了1
      const afterSaveTemplates = await taskService.getAllTaskTemplates();
      console.log(`📊 保存后模板数量: ${afterSaveTemplates.length}`);
      
      const expectedCount = initialTemplates.length + 1;
      if (afterSaveTemplates.length === expectedCount) {
        console.log('✅ 保存成功，模板数量正确增加');
      } else {
        console.log(`❌ 保存后数量异常，期望: ${expectedCount}, 实际: ${afterSaveTemplates.length}`);
      }
    } else {
      console.log('❌ 保存失败:', saveResult.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

/**
 * 修复说明和测试指南
 */
export const FIX_GUIDE = {
  title: '重复保存问题修复',
  description: '修复了从元模板创建任务模板时可能出现的重复保存问题',
  
  problem: {
    description: '原问题：从元模板创建任务模板时会立即保存到数据库',
    steps: [
      '1. createTaskTemplateFromMetaTemplate 调用主进程创建并立即保存模板',
      '2. 前端设置 isEditMode = false，表示这是新创建的模板',
      '3. 用户编辑后保存时，会再次调用 createTaskTemplate',
      '4. 导致重复创建/保存模板，或者用户以为没保存而产生困惑'
    ]
  },
  
  solution: {
    description: '修复方案：延迟保存，让用户明确控制保存时机',
    changes: [
      '1. 修改主进程 createTaskTemplateFromMetaTemplate，只创建模板对象不保存',
      '2. 修改渲染进程，不自动同步状态到 Pinia store',
      '3. 前端保持 isEditMode = false，表示这是待保存的新模板',
      '4. 用户编辑后保存时，调用 createTaskTemplate 进行真正的保存'
    ]
  },
  
  benefits: {
    description: '修复后的优势',
    points: [
      '✅ 用户流程更清晰：创建→编辑→保存',
      '✅ 避免重复保存和数据混乱',
      '✅ 用户可以取消而不留下垃圾数据',
      '✅ 保存时机由用户明确控制'
    ]
  },
  
  testing: {
    description: '如何测试修复效果',
    steps: [
      '1. 记录初始模板数量',
      '2. 从元模板创建新模板（应该不会增加数量）',
      '3. 检查数量是否保持不变',
      '4. 手动保存模板',
      '5. 检查数量是否正确增加1'
    ]
  }
};

/**
 * 功能说明和使用指南
 */
export const FEATURE_GUIDE = {
  title: '删除所有任务模板功能',
  description: '此功能允许用户一次性删除所有任务模板及其相关的任务实例',
  
  usage: {
    frontend: {
      description: '在前端TaskTemplateManagement.vue组件中',
      steps: [
        '1. 打开任务模板管理页面',
        '2. 确认当前有任务模板存在',
        '3. 点击"删除所有模板"按钮（红色轮廓按钮）',
        '4. 在确认对话框中查看删除详情',
        '5. 点击"确认删除所有"完成操作'
      ]
    },
    
    backend: {
      description: '在后端通过服务调用',
      steps: [
        '1. 获取taskDomainApplicationService实例',
        '2. 调用deleteAllTaskTemplates()方法',
        '3. 检查返回结果的success字段',
        '4. 根据需要处理成功或失败的情况'
      ]
    }
  },
  
  implementation: {
    mainProcess: 'MainTaskApplicationService.deleteAllTaskTemplates()',
    ipcHandler: 'task:templates:delete-all',
    renderProcess: 'TaskDomainApplicationService.deleteAllTaskTemplates()',
    frontend: 'TaskTemplateManagement.vue - confirmDeleteAll()'
  },
  
  safety: {
    warnings: [
      '⚠️ 此操作不可恢复',
      '⚠️ 会同时删除所有相关的任务实例',
      '⚠️ 会删除所有状态的模板（活跃、草稿、暂停、归档）',
      '⚠️ 执行前会显示确认对话框'
    ],
    
    protections: [
      '✅ 批量删除使用事务处理',
      '✅ 详细的错误日志记录',
      '✅ 前端状态自动同步',
      '✅ 分步骤执行，可追踪进度'
    ]
  }
};

// 如果要在开发环境中测试，可以在浏览器控制台中运行：
// import('./test-delete-all-templates.ts').then(module => module.testDeleteAllTaskTemplates())
