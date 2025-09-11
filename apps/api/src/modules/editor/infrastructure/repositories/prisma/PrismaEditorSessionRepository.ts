/**
 * Prisma Editor Session Repository Implementation
 * Prisma编辑器会话仓储实现 - 数据库访问层
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// 简化的编辑器会话接口
interface IEditorSession {
  uuid: string;
  name: string;
  activeGroupId?: string;
  activityBarWidth: number;
  sidebarWidth: number;
  minSidebarWidth: number;
  resizeHandleWidth: number;
  minEditorWidth: number;
  editorTabWidth: number;
  windowWidth: number;
  windowHeight: number;
  autoSave: boolean;
  autoSaveInterval: number;
  lastSavedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaEditorSessionRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据库实体到DTO的转换 =====

  private mapEditorSessionToDTO(session: any): IEditorSession {
    return {
      uuid: session.uuid,
      name: session.name,
      activeGroupId: session.activeGroupId,
      activityBarWidth: session.activityBarWidth,
      sidebarWidth: session.sidebarWidth,
      minSidebarWidth: session.minSidebarWidth,
      resizeHandleWidth: session.resizeHandleWidth,
      minEditorWidth: session.minEditorWidth,
      editorTabWidth: session.editorTabWidth,
      windowWidth: session.windowWidth,
      windowHeight: session.windowHeight,
      autoSave: session.autoSave,
      autoSaveInterval: session.autoSaveInterval,
      lastSavedAt: session.lastSavedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
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
      orderBy: { lastSavedAt: 'desc' },
    });

    return sessions.map((session) => this.mapEditorSessionToDTO(session));
  }

  async findActiveSession(accountUuid: string): Promise<IEditorSession | null> {
    const session = await this.prisma.editorSession.findFirst({
      where: {
        accountUuid,
        activeGroupId: { not: null },
      },
    });

    return session ? this.mapEditorSessionToDTO(session) : null;
  }

  async findRecentSessions(accountUuid: string, limit = 10): Promise<IEditorSession[]> {
    const sessions = await this.prisma.editorSession.findMany({
      where: { accountUuid },
      orderBy: { lastSavedAt: 'desc' },
      take: limit,
    });

    return sessions.map((session) => this.mapEditorSessionToDTO(session));
  }

  async save(accountUuid: string, editorSession: IEditorSession): Promise<void> {
    const data = {
      accountUuid,
      name: editorSession.name,
      activeGroupId: editorSession.activeGroupId,
      activityBarWidth: editorSession.activityBarWidth,
      sidebarWidth: editorSession.sidebarWidth,
      minSidebarWidth: editorSession.minSidebarWidth,
      resizeHandleWidth: editorSession.resizeHandleWidth,
      minEditorWidth: editorSession.minEditorWidth,
      editorTabWidth: editorSession.editorTabWidth,
      windowWidth: editorSession.windowWidth,
      windowHeight: editorSession.windowHeight,
      autoSave: editorSession.autoSave,
      autoSaveInterval: editorSession.autoSaveInterval,
      lastSavedAt: editorSession.lastSavedAt || new Date(),
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
    // 首先将所有会话的activeGroupId设为null
    await this.prisma.editorSession.updateMany({
      where: { accountUuid },
      data: { activeGroupId: null },
    });

    // 然后设置指定会话为活跃（这里需要指定一个活跃的组ID）
    // 注意：这个方法可能需要重新设计，因为activeGroupId是具体的组ID
    await this.prisma.editorSession.update({
      where: { uuid: sessionUuid },
      data: {
        lastSavedAt: new Date(),
      },
    });
  }

  async updateLastSaved(uuid: string): Promise<void> {
    await this.prisma.editorSession.update({
      where: { uuid },
      data: { lastSavedAt: new Date() },
    });
  }

  async updateLayoutConfig(
    uuid: string,
    layoutConfig: {
      activityBarWidth?: number;
      sidebarWidth?: number;
      windowWidth?: number;
      windowHeight?: number;
    },
  ): Promise<void> {
    await this.prisma.editorSession.update({
      where: { uuid },
      data: {
        ...layoutConfig,
        lastSavedAt: new Date(),
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
        activeGroupId: { not: null },
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
        activeGroupId: null,
        lastSavedAt: { lt: cutoffDate },
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
        activeGroupId: { not: null },
        lastSavedAt: { lt: cutoffDate },
      },
      data: { activeGroupId: null },
    });

    return result.count;
  }
}
