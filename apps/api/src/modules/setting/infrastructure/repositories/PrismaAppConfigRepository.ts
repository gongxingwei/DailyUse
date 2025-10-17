import { PrismaClient } from '@prisma/client';
import type { IAppConfigRepository } from '@dailyuse/domain-server';
import { AppConfigServer } from '@dailyuse/domain-server';

/**
 * AppConfig Prisma 仓储实现
 * 负责 AppConfig 聚合根的持久化
 *
 * 注意：Prisma schema 使用单个 config JSON 字段存储所有配置，
 * 需要在映射时进行转换
 */
export class PrismaAppConfigRepository implements IAppConfigRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 AppConfig 聚合根
   */
  private mapToEntity(data: any): AppConfigServer {
    // Prisma schema 使用单个 config JSON 字段
    const config = typeof data.config === 'string' ? JSON.parse(data.config) : data.config;

    return AppConfigServer.fromPersistenceDTO({
      uuid: data.uuid,
      version: data.version,
      app: JSON.stringify(config.app || {}),
      features: JSON.stringify(config.features || {}),
      limits: JSON.stringify(config.limits || {}),
      api: JSON.stringify(config.api || {}),
      security: JSON.stringify(config.security || {}),
      notifications: JSON.stringify(config.notifications || {}),
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    });
  }

  /**
   * 转换时间戳为 Date 对象
   */
  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  // ===== IAppConfigRepository 接口实现 =====

  async save(config: AppConfigServer): Promise<void> {
    const persistence = config.toPersistenceDTO();

    // 将分散的 JSON 字段合并为单个 config 对象
    const configData = {
      app: JSON.parse(persistence.app),
      features: JSON.parse(persistence.features),
      limits: JSON.parse(persistence.limits),
      api: JSON.parse(persistence.api),
      security: JSON.parse(persistence.security),
      notifications: JSON.parse(persistence.notifications),
    };

    await this.prisma.appConfig.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        version: persistence.version,
        config: JSON.stringify(configData),
        description: undefined, // Prisma schema 有 description 但 PersistenceDTO 没有
        isCurrent: false, // 默认不是当前配置
        createdAt: this.toDate(persistence.createdAt) ?? new Date(),
        updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
      },
      update: {
        version: persistence.version,
        config: JSON.stringify(configData),
        updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
      },
    });
  }

  async findById(uuid: string): Promise<AppConfigServer | null> {
    const data = await this.prisma.appConfig.findUnique({
      where: { uuid },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async getCurrent(): Promise<AppConfigServer | null> {
    const data = await this.prisma.appConfig.findFirst({
      where: { isCurrent: true },
      orderBy: { createdAt: 'desc' },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findByVersion(version: string): Promise<AppConfigServer | null> {
    const data = await this.prisma.appConfig.findUnique({
      where: { version },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async findAllVersions(): Promise<AppConfigServer[]> {
    const data = await this.prisma.appConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item) => this.mapToEntity(item));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.appConfig.delete({
      where: { uuid },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.appConfig.count({ where: { uuid } });
    return count > 0;
  }

  async existsByVersion(version: string): Promise<boolean> {
    const count = await this.prisma.appConfig.count({ where: { version } });
    return count > 0;
  }
}
