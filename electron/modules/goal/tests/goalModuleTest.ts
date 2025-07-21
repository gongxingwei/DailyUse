/**
 * Goal 模块集成测试
 * 测试依赖注入、仓库、应用服务是否正常工作
 */

import { MainGoalApplicationService } from '../application/mainGoalApplicationService';
import { GoalContainer } from '../infrastructure/di/goalContainer';
import type { IGoalCreateDTO, IGoalDir } from '@/modules/Goal/domain/types/goal';
import { initializeDatabase } from '../../../config/database';

/**
 * 创建测试用户
 */
async function createTestUser(): Promise<void> {
  const db = await initializeDatabase();
  
  // 检查用户是否已存在
  const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get('test-user');
  
  if (!existingUser) {
    // 创建测试用户
    const stmt = db.prepare(`
      INSERT INTO users (uid, username, password, accountType, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      'test-uid-' + Date.now(),
      'test-user',
      'test-password',
      'local',
      Date.now()
    );
    
    console.log('✅ 测试用户创建成功');
  } else {
    console.log('✅ 测试用户已存在');
  }
}

/**
 * 测试 Goal 模块基本功能
 */
export async function testGoalModule(): Promise<void> {
  console.log('🧪 开始测试 Goal 模块...');
  
  try {
    // 首先创建测试用户
    await createTestUser();
    
    // 初始化服务
    const goalService = new MainGoalApplicationService();
    await goalService.setUsername('test-user');
    
    console.log('✅ Goal 服务初始化成功');
    
    // 测试创建目标目录
    const testGoalDir: IGoalDir = {
      name: '测试目录',
      icon: '📁'
    };
    
    const dirResult = await goalService.createGoalDir(testGoalDir);
    if (!dirResult.success) {
      throw new Error(`创建目录失败: ${dirResult.message}`);
    }
    
    console.log('✅ 目标目录创建成功:', dirResult.data?.id);
    
    // 测试创建目标
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后
    
    const testGoal: IGoalCreateDTO = {
      title: '测试目标',
      description: '这是一个测试目标',
      color: '#FF6B6B',
      dirId: dirResult.data!.uuid,
      startTime: {
        date: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate()
        },
        timestamp: now.getTime(),
        isoString: now.toISOString()
      },
      endTime: {
        date: {
          year: endDate.getFullYear(),
          month: endDate.getMonth() + 1,
          day: endDate.getDate()
        },
        timestamp: endDate.getTime(),
        isoString: endDate.toISOString()
      },
      note: '测试备注',
      keyResults: [
        {
          name: '测试关键结果',
          startValue: 0,
          targetValue: 100,
          currentValue: 0,
          calculationMethod: 'sum' as const,
          weight: 10
        }
      ],
      analysis: {
        motive: '测试动机',
        feasibility: '测试可行性'
      }
    };
    
    const goalResult = await goalService.createGoal(testGoal);
    if (!goalResult.success) {
      throw new Error(`创建目标失败: ${goalResult.message}`);
    }
    
    console.log('✅ 目标创建成功:', goalResult.data?.id);
    
    // 测试获取所有目标
    const allGoalsResult = await goalService.getAllGoals();
    if (!allGoalsResult.success) {
      throw new Error(`获取目标失败: ${allGoalsResult.message}`);
    }
    
    console.log('✅ 获取目标成功，数量:', allGoalsResult.data?.length);
    
    // 测试获取所有目录
    const allDirsResult = await goalService.getAllGoalDirs();
    if (!allDirsResult.success) {
      throw new Error(`获取目录失败: ${allDirsResult.message}`);
    }
    
    console.log('✅ 获取目录成功，数量:', allDirsResult.data?.length);
    
    // 清理测试数据
    if (goalResult.data?.id) {
      await goalService.deleteGoal(goalResult.data.uuid);
      console.log('✅ 测试目标已清理');
    }
    
    if (dirResult.data?.id) {
      await goalService.deleteGoalDir(dirResult.data.uuid);
      console.log('✅ 测试目录已清理');
    }
    
    console.log('🎉 Goal 模块测试完成！');
    
  } catch (error) {
    console.error('❌ Goal 模块测试失败:', error);
    throw error;
  }
}

/**
 * 测试容器和依赖注入
 */
export async function testGoalContainer(): Promise<void> {
  console.log('🧪 测试 Goal 容器...');
  
  try {
    const container = GoalContainer.getInstance();
    
    // 测试设置用户
    await container.setCurrentUser('test-user');
    console.log('✅ 用户设置成功');
    
    // 测试获取仓库
    const repository = await container.getGoalRepository();
    console.log('✅ 仓库获取成功:', repository.constructor.name);
    
    console.log('🎉 Goal 容器测试完成！');
    
  } catch (error) {
    console.error('❌ Goal 容器测试失败:', error);
    throw error;
  }
}

/**
 * 运行所有测试
 */
export async function runGoalModuleTests(): Promise<void> {
  console.log('🚀 开始运行 Goal 模块完整测试...');
  
  try {
    await testGoalContainer();
    await testGoalModule();
    
    console.log('🎊 所有 Goal 模块测试通过！');
    
  } catch (error) {
    console.error('💥 Goal 模块测试失败:', error);
    process.exit(1);
  }
}
