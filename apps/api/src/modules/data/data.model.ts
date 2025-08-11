import { prisma } from '../../config/prisma';

export interface Data {
  id: string;
  user_id: string;
  file_name: string;
  file_content: any;
  version: number;
  last_modified: Date;
  created_at: Date;
}

export interface CreateDataDto {
  file_name: string;
  file_content: any;
  user_id: string;
}

export interface UpdateDataDto {
  file_content: any;
  version: number;
}

export class DataModel {
  static async findAllByUserId(userId: string): Promise<Data[]> {
    const rows = await prisma.userData.findMany({
      where: { userId },
      orderBy: { lastModified: 'desc' },
    });
    return rows.map((r: any) => ({
      id: r.id,
      user_id: r.userId,
      file_name: r.fileName,
      file_content: r.fileContent as any,
      version: r.version,
      last_modified: r.lastModified,
      created_at: r.createdAt,
    }));
  }

  static async findByUserIdAndFileName(userId: string, fileName: string): Promise<Data | null> {
    const r = await prisma.userData.findFirst({
      where: { userId, fileName },
    });
    if (!r) return null;
    return {
      id: r.id,
      user_id: r.userId,
      file_name: r.fileName,
      file_content: r.fileContent as any,
      version: r.version,
      last_modified: r.lastModified,
      created_at: r.createdAt,
    };
  }

  static async create(data: CreateDataDto): Promise<string> {
    const r = await prisma.userData.create({
      data: {
        userId: data.user_id,
        fileName: data.file_name,
        fileContent: data.file_content as any,
      },
      select: { id: true },
    });
    return r.id;
  }

  // optimistic update by version; also updates last_modified automatically
  static async update(userId: string, fileName: string, data: UpdateDataDto): Promise<boolean> {
    const updated = await prisma.userData.updateMany({
      where: { userId, fileName, version: data.version },
      data: {
        fileContent: data.file_content as any,
        version: { increment: 1 },
      },
    });
    return updated.count > 0;
  }

  static async delete(userId: string, fileName: string): Promise<boolean> {
    const deleted = await prisma.userData.deleteMany({ where: { userId, fileName } });
    return deleted.count > 0;
  }

  static async upsert(data: CreateDataDto): Promise<{ id: string; isNew: boolean }> {
    const existing = await this.findByUserIdAndFileName(data.user_id, data.file_name);
    if (existing) {
      const success = await this.update(data.user_id, data.file_name, {
        file_content: data.file_content,
        version: existing.version,
      });
      return { id: existing.id, isNew: false };
    } else {
      const id = await this.create(data);
      return { id, isNew: true };
    }
  }

  static async updateWithTimestamp(
    userId: string,
    fileName: string,
    fileContent: any,
    clientTimestamp: number,
  ): Promise<{ updated: boolean; serverData?: Data; conflict: boolean }> {
    const existing = await this.findByUserIdAndFileName(userId, fileName);
    if (!existing) {
      const id = await this.create({
        user_id: userId,
        file_name: fileName,
        file_content: fileContent,
      });
      return { updated: true, conflict: false };
    }
    const serverTimestamp = new Date(existing.last_modified).getTime();
    if (clientTimestamp > serverTimestamp) {
      const success = await this.update(userId, fileName, {
        file_content: fileContent,
        version: existing.version,
      });
      return { updated: success, conflict: false };
    } else if (serverTimestamp > clientTimestamp) {
      return { updated: false, serverData: existing, conflict: true };
    } else {
      return { updated: false, conflict: false };
    }
  }
}
