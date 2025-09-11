/**
 * Prisma Editor Session Repository Implementation
 * Prisma编辑器会话仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// 简化的编辑器会话接口
interface IEditorSession {
  uuid: string;
  sessionName: string;
  description?: string;
  isActive: boolean;
  windowState: any;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export class PrismaEditorSessionRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapEditorSessionToDTO(session: any): IEditorSession {
    return {
      uuid: session.uuid,
      sessionName: session.sessionName,
      description: session.description,
      isActive: session.isActive,
      windowState: session.windowState ? JSON.parse(session.windowState) : null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastAccessedAt: session.lastAccessedAt,
    };
  }

  // ===== CRUD 操作 =====

  async findById(uuid: string): Promise<IEditorSession | null> {
    const session = await this.prisma.editorSession.findUnique({
      where: { uuid },
    });

    return session ? this.mapEditorSessionToDTO(session) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<IEditorSession[]> {
    const sessions = await this.prisma.editorSession.findMany({
      where: { accountUuid },
      orderBy: { lastAccessedAt: 'desc' },
    });

    return sessions.map((session) => this.mapEditorSessionToDTO(session));
  }

  async findActiveSession(accountUuid: string): Promise<IEditorSession | null> {
    const session = await this.prisma.editorSession.findFirst({
      where: {
        accountUuid,
        isActive: true,
      },
    });

    return session ? this.mapEditorSessionToDTO(session) : null;
  }

  async findRecentSessions(accountUuid: string, limit = 10): Promise<IEditorSession[]> {
    const sessions = await this.prisma.editorSession.findMany({
      where: { accountUuid },
      orderBy: { lastAccessedAt: 'desc' },
      take: limit,
    });

    return sessions.map((session) => this.mapEditorSessionToDTO(session));
  }

  async save(accountUuid: string, editorSession: IEditorSession): Promise<void> {
    const data = {
      accountUuid,
      sessionName: editorSession.sessionName,
      description: editorSession.description,
      isActive: editorSession.isActive,
      windowState: JSON.stringify(editorSession.windowState),
      lastAccessedAt: editorSession.lastAccessedAt,
    };

    await this.prisma.editorSession.upsert({
      where: { uuid: editorSession.uuid },
      update: data,
      create: {
        uuid: editorSession.uuid,
        ...data,
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.editorSession.delete({
      where: { uuid },
    });
  }

  async setActiveSession(accountUuid: string, sessionUuid: string): Promise<void> {
    // 首先将所有会话设为非活跃
    await this.prisma.editorSession.updateMany({
      where: { accountUuid },
      data: { isActive: false },
    });

    // 然后设置指定会话为活跃
    await this.prisma.editorSession.update({
      where: { uuid: sessionUuid },
      data: {
        isActive: true,
        lastAccessedAt: new Date(),
      },
    });
  }

  async updateLastAccessed(uuid: string): Promise<void> {
    await this.prisma.editorSession.update({
      where: { uuid },
      data: { lastAccessedAt: new Date() },
    });
  }

  async updateWindowState(uuid: string, windowState: any): Promise<void> {
    await this.prisma.editorSession.update({
      where: { uuid },
      data: {
        windowState: JSON.stringify(windowState),
        lastAccessedAt: new Date(),
      },
    });
  }

  // ===== 统计查询 =====

  async getTotalCount(accountUuid: string): Promise<number> {
    return await this.prisma.editorSession.count({
      where: { accountUuid },
    });
  }

  async getActiveCount(accountUuid: string): Promise<number> {
    return await this.prisma.editorSession.count({
      where: {
        accountUuid,
        isActive: true,
      },
    });
  }

  // ===== 清理操作 =====

  async cleanupOldSessions(accountUuid: string, daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.editorSession.deleteMany({
      where: {
        accountUuid,
        isActive: false,
        lastAccessedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  async archiveInactiveSessions(accountUuid: string, daysInactive = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await this.prisma.editorSession.updateMany({
      where: {
        accountUuid,
        isActive: true,
        lastAccessedAt: { lt: cutoffDate },
      },
      data: { isActive: false },
    });

    return result.count;
  }
}
