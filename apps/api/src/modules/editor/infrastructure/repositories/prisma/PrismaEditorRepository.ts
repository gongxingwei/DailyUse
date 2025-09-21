/**
 * Prisma Editor Repository Implementation
 * Prisma编辑器仓储实现 - 完整的编辑器数据访问层
 *
 * 实现编辑器模块的完整仓储接口，支持会话、组、标签页和布局的CRUD操作
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { EditorContracts } from '@dailyuse/contracts';
import type { IEditorRepository } from '@dailyuse/domain-server';

export class PrismaEditorRepository implements IEditorRepository {
  constructor(private prisma: PrismaClient) {}

  // ============ 编辑器会话操作 ============

  async createEditorSession(
    accountUuid: string,
    data: Omit<EditorContracts.EditorSessionDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<EditorContracts.EditorSessionDTO> {
    const uuid = randomUUID();
    const now = Date.now();

    const session = await this.prisma.editorSession.create({
      data: {
        uuid,
        accountUuid,
        name: data.name,
        activeGroupId: data.activeGroupId,
        layoutUuid: data.layoutUuid,
        autoSave: data.autoSave,
        autoSaveInterval: data.autoSaveInterval,
        lastSavedAt: data.lastSavedAt ? new Date(data.lastSavedAt) : null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    });

    return this.mapSessionToDTO(session);
  }

  async getEditorSessionByUuid(
    accountUuid: string,
    sessionUuid: string,
  ): Promise<EditorContracts.EditorSessionDTO | null> {
    const session = await this.prisma.editorSession.findFirst({
      where: {
        uuid: sessionUuid,
        accountUuid,
      },
    });

    return session ? this.mapSessionToDTO(session) : null;
  }

  async updateEditorSession(
    accountUuid: string,
    sessionUuid: string,
    updates: Partial<EditorContracts.EditorSessionDTO>,
  ): Promise<void> {
    const data: any = { updatedAt: new Date() };

    if (updates.name !== undefined) data.name = updates.name;
    if (updates.activeGroupId !== undefined) data.activeGroupId = updates.activeGroupId;
    if (updates.layoutUuid !== undefined) data.layoutUuid = updates.layoutUuid;
    if (updates.autoSave !== undefined) data.autoSave = updates.autoSave;
    if (updates.autoSaveInterval !== undefined) data.autoSaveInterval = updates.autoSaveInterval;
    if (updates.lastSavedAt !== undefined) {
      data.lastSavedAt =
        typeof updates.lastSavedAt === 'number'
          ? new Date(updates.lastSavedAt)
          : updates.lastSavedAt;
    }

    await this.prisma.editorSession.update({
      where: { uuid: sessionUuid },
      data,
    });
  }

  async getCurrentActiveSession(
    accountUuid: string,
  ): Promise<EditorContracts.EditorSessionDTO | null> {
    // 这里需要一种方式来标识当前活跃的会话
    // 可以通过最近访问时间或者专门的标记来实现
    const session = await this.prisma.editorSession.findFirst({
      where: { accountUuid },
      orderBy: { updatedAt: 'desc' },
    });

    return session ? this.mapSessionToDTO(session) : null;
  }

  async setCurrentActiveSession(accountUuid: string, sessionUuid: string): Promise<void> {
    // 更新会话的访问时间来标记为当前活跃
    await this.prisma.editorSession.update({
      where: { uuid: sessionUuid },
      data: { updatedAt: new Date() },
    });
  }

  // ============ 编辑器组操作 ============

  async createEditorGroup(
    accountUuid: string,
    data: Omit<EditorContracts.EditorGroupDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<EditorContracts.EditorGroupDTO> {
    const uuid = randomUUID();
    const now = Date.now();

    const group = await this.prisma.editorGroup.create({
      data: {
        uuid,
        accountUuid,
        sessionUuid: data.sessionUuid,
        active: data.active,
        width: data.width,
        height: data.height,
        activeTabId: data.activeTabId,
        title: data.title,
        order: data.order,
        lastAccessed: data.lastAccessed ? new Date(data.lastAccessed) : null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    });

    return this.mapGroupToDTO(group);
  }

  async getEditorGroupByUuid(
    accountUuid: string,
    groupUuid: string,
  ): Promise<EditorContracts.EditorGroupDTO | null> {
    const group = await this.prisma.editorGroup.findFirst({
      where: {
        uuid: groupUuid,
        accountUuid,
      },
    });

    return group ? this.mapGroupToDTO(group) : null;
  }

  async getEditorGroupsBySessionUuid(
    accountUuid: string,
    sessionUuid: string,
  ): Promise<EditorContracts.EditorGroupDTO[]> {
    const groups = await this.prisma.editorGroup.findMany({
      where: {
        sessionUuid,
        accountUuid,
      },
      orderBy: { order: 'asc' },
    });

    return groups.map((group) => this.mapGroupToDTO(group));
  }

  async updateEditorGroup(
    accountUuid: string,
    groupUuid: string,
    updates: Partial<EditorContracts.EditorGroupDTO>,
  ): Promise<void> {
    const data: any = { updatedAt: new Date() };

    if (updates.active !== undefined) data.active = updates.active;
    if (updates.width !== undefined) data.width = updates.width;
    if (updates.height !== undefined) data.height = updates.height;
    if (updates.activeTabId !== undefined) data.activeTabId = updates.activeTabId;
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.order !== undefined) data.order = updates.order;
    if (updates.lastAccessed !== undefined) {
      data.lastAccessed =
        typeof updates.lastAccessed === 'number'
          ? new Date(updates.lastAccessed)
          : updates.lastAccessed;
    }

    await this.prisma.editorGroup.update({
      where: { uuid: groupUuid },
      data,
    });
  }

  // ============ 编辑器标签页操作 ============

  async createEditorTab(
    accountUuid: string,
    data: Omit<EditorContracts.EditorTabDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<EditorContracts.EditorTabDTO> {
    const uuid = randomUUID();
    const now = Date.now();

    const tab = await this.prisma.editorTab.create({
      data: {
        uuid,
        accountUuid,
        groupUuid: data.groupUuid,
        title: data.title,
        path: data.path,
        active: data.active,
        isPreview: data.isPreview,
        fileType: data.fileType,
        isDirty: data.isDirty,
        content: data.content,
        lastModified: data.lastModified ? new Date(data.lastModified) : null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    });

    return this.mapTabToDTO(tab);
  }

  async getEditorTabByPath(
    accountUuid: string,
    path: string,
  ): Promise<EditorContracts.EditorTabDTO | null> {
    const tab = await this.prisma.editorTab.findFirst({
      where: {
        path,
        accountUuid,
      },
    });

    return tab ? this.mapTabToDTO(tab) : null;
  }

  async getEditorTabsByGroupUuid(
    accountUuid: string,
    groupUuid: string,
  ): Promise<EditorContracts.EditorTabDTO[]> {
    const tabs = await this.prisma.editorTab.findMany({
      where: {
        groupUuid,
        accountUuid,
      },
      orderBy: { createdAt: 'asc' },
    });

    return tabs.map((tab) => this.mapTabToDTO(tab));
  }

  async updateEditorTab(
    accountUuid: string,
    tabUuid: string,
    updates: Partial<EditorContracts.EditorTabDTO>,
  ): Promise<void> {
    const data: any = { updatedAt: new Date() };

    if (updates.title !== undefined) data.title = updates.title;
    if (updates.active !== undefined) data.active = updates.active;
    if (updates.isPreview !== undefined) data.isPreview = updates.isPreview;
    if (updates.isDirty !== undefined) data.isDirty = updates.isDirty;
    if (updates.content !== undefined) data.content = updates.content;
    if (updates.lastModified !== undefined) {
      data.lastModified =
        typeof updates.lastModified === 'number'
          ? new Date(updates.lastModified)
          : updates.lastModified;
    }

    await this.prisma.editorTab.update({
      where: { uuid: tabUuid },
      data,
    });
  }

  async getUnsavedTabs(accountUuid: string): Promise<EditorContracts.EditorTabDTO[]> {
    const tabs = await this.prisma.editorTab.findMany({
      where: {
        accountUuid,
        isDirty: true,
      },
    });

    return tabs.map((tab) => this.mapTabToDTO(tab));
  }

  // ============ 编辑器布局操作 ============

  async createEditorLayout(
    accountUuid: string,
    data: Omit<EditorContracts.EditorLayoutDTO, 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<EditorContracts.EditorLayoutDTO> {
    const uuid = randomUUID();
    const now = Date.now();

    const layout = await this.prisma.editorLayout.create({
      data: {
        uuid,
        accountUuid,
        name: data.name,
        activityBarWidth: data.activityBarWidth,
        sidebarWidth: data.sidebarWidth,
        minSidebarWidth: data.minSidebarWidth,
        resizeHandleWidth: data.resizeHandleWidth,
        minEditorWidth: data.minEditorWidth,
        editorTabWidth: data.editorTabWidth,
        windowWidth: data.windowWidth,
        windowHeight: data.windowHeight,
        isDefault: data.isDefault,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    });

    return this.mapLayoutToDTO(layout);
  }

  // ============ 聚合加载 ============

  async loadEditorSessionAggregate(
    accountUuid: string,
    sessionUuid: string,
  ): Promise<EditorContracts.EditorSessionAggregateDTO | null> {
    const session = await this.getEditorSessionByUuid(accountUuid, sessionUuid);
    if (!session) return null;

    const groups = await this.getEditorGroupsBySessionUuid(accountUuid, sessionUuid);

    // 获取所有组的标签页
    const tabs: EditorContracts.EditorTabDTO[] = [];
    for (const group of groups) {
      const groupTabs = await this.getEditorTabsByGroupUuid(accountUuid, group.uuid);
      tabs.push(...groupTabs);
    }

    // 获取布局（如果有）
    let layout: EditorContracts.EditorLayoutDTO | null = null;
    if (session.layoutUuid) {
      const layoutRecord = await this.prisma.editorLayout.findUnique({
        where: { uuid: session.layoutUuid },
      });
      if (layoutRecord) {
        layout = this.mapLayoutToDTO(layoutRecord);
      }
    }

    return {
      session,
      groups,
      tabs,
      layout,
    };
  }

  // ============ 私有映射方法 ============

  private mapSessionToDTO(session: any): EditorContracts.EditorSessionDTO {
    return {
      uuid: session.uuid,
      accountUuid: session.accountUuid,
      name: session.name,
      activeGroupId: session.activeGroupId,
      layoutUuid: session.layoutUuid,
      autoSave: session.autoSave,
      autoSaveInterval: session.autoSaveInterval,
      lastSavedAt: session.lastSavedAt?.getTime(),
      createdAt: session.createdAt.getTime(),
      updatedAt: session.updatedAt.getTime(),
    };
  }

  private mapGroupToDTO(group: any): EditorContracts.EditorGroupDTO {
    return {
      uuid: group.uuid,
      accountUuid: group.accountUuid,
      sessionUuid: group.sessionUuid,
      active: group.active,
      width: group.width,
      height: group.height,
      activeTabId: group.activeTabId,
      title: group.title,
      order: group.order,
      lastAccessed: group.lastAccessed?.getTime(),
      createdAt: group.createdAt.getTime(),
      updatedAt: group.updatedAt.getTime(),
    };
  }

  private mapTabToDTO(tab: any): EditorContracts.EditorTabDTO {
    return {
      uuid: tab.uuid,
      accountUuid: tab.accountUuid,
      groupUuid: tab.groupUuid,
      title: tab.title,
      path: tab.path,
      active: tab.active,
      isPreview: tab.isPreview,
      fileType: tab.fileType as EditorContracts.SupportedFileType,
      isDirty: tab.isDirty,
      content: tab.content,
      lastModified: tab.lastModified?.getTime(),
      createdAt: tab.createdAt.getTime(),
      updatedAt: tab.updatedAt.getTime(),
    };
  }

  private mapLayoutToDTO(layout: any): EditorContracts.EditorLayoutDTO {
    return {
      uuid: layout.uuid,
      accountUuid: layout.accountUuid,
      name: layout.name,
      activityBarWidth: layout.activityBarWidth,
      sidebarWidth: layout.sidebarWidth,
      minSidebarWidth: layout.minSidebarWidth,
      resizeHandleWidth: layout.resizeHandleWidth,
      minEditorWidth: layout.minEditorWidth,
      editorTabWidth: layout.editorTabWidth,
      windowWidth: layout.windowWidth,
      windowHeight: layout.windowHeight,
      isDefault: layout.isDefault,
      createdAt: layout.createdAt.getTime(),
      updatedAt: layout.updatedAt.getTime(),
    };
  }
}
