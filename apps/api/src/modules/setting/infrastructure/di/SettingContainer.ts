import type { ISettingRepository } from '@dailyuse/domain-server';
import { PrismaSettingRepository } from '../repositories/PrismaSettingRepository';
import { prisma } from '@/config/prisma';

/**
 * Setting Module DI Container
 * 管理 Setting 模块的所有仓储实例
 */
export class SettingContainer {
  private static instance: SettingContainer;
  private settingRepository: ISettingRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): SettingContainer {
    if (!SettingContainer.instance) {
      SettingContainer.instance = new SettingContainer();
    }
    return SettingContainer.instance;
  }

  /**
   * 获取 Setting 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getSettingRepository(): ISettingRepository {
    if (!this.settingRepository) {
      this.settingRepository = new PrismaSettingRepository(prisma);
    }
    return this.settingRepository!;
  }

  /**
   * 设置 Setting 仓储（用于测试）
   */
  setSettingRepository(repository: ISettingRepository): void {
    this.settingRepository = repository;
  }
}
