import { PrismaClient } from '@prisma/client';
import type { IAppConfigRepository } from '@dailyuse/domain-server';
import { AppConfigServer } from '@dailyuse/domain-server';

/**
 * AppConfig Prisma 仓储实现
 * 负责 AppConfig 聚合根的持久化
 */
export class PrismaAppConfigRepository implements IAppConfigRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据映射方法 =====

  /**
   * 将 Prisma 数据映射为 AppConfig 聚合根
   */
  private mapToEntity(data: any): AppConfigServer {
    return AppConfigServer.fromPersistenceDTO({
      uuid: data.uuid,
      version: data.version,
      config: data.config,
      description: data.description,
      is_current: data.isCurrent,
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

    await this.prisma.appConfig.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        version: persistence.version,
        config: persistence.config,
        description: persistence.description,
        isCurrent: persistence.is_current,
        createdAt: this.toDate(persistence.created_at) ?? new Date(),
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
      },
      update: {
        version: persistence.version,
        config: persistence.config,
        description: persistence.description,
        isCurrent: persistence.is_current,
        updatedAt: this.toDate(persistence.updated_at) ?? new Date(),
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
