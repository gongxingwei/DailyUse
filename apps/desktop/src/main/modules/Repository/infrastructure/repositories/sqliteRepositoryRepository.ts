import { Database } from 'better-sqlite3';
import { getDatabase } from '../../../../shared/database/index';
import { Repository } from '../../domain/aggregates/repository';
import { IRepositoryRepository } from '../../domain/repositories/iRepositoryRepository';

/**
 * SQLite 仓库存储库实现
 * 负责仓库数据的持久化和查询
 */
export class SqliteRepositoryRepository implements IRepositoryRepository {
  private db: Database | null = null;

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async addRepository(accountUuid: string, repository: Repository): Promise<void> {
    try {
      const db = await this.getDb();
      db.prepare(
        `INSERT INTO repositories (account_uuid, uuid, name, path, description, createdAt, updatedAt, relatedGoals) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        accountUuid,
        repository.uuid,
        repository.name,
        repository.path,
        repository.description,
        repository.createdAt.toISOString(),
        repository.updatedAt.toISOString(),
        JSON.stringify(repository.relatedGoals || []),
      );
    } catch (error) {
      console.error('添加仓库失败:', error);
      throw error;
    }
  }

  async updateRepository(accountUuid: string, repository: Repository): Promise<void> {
    try {
      const db = await this.getDb();
      db.prepare(
        `UPDATE repositories SET name = ?, path = ?, description = ?, updatedAt = ?, relatedGoals = ? WHERE account_uuid = ? AND uuid = ?`,
      ).run(
        repository.name,
        repository.path,
        repository.description,
        repository.updatedAt.toISOString(),
        JSON.stringify(repository.relatedGoals || []),
        accountUuid,
        repository.uuid,
      );
    } catch (error) {
      console.error('更新仓库失败:', error);
      throw error;
    }
  }

  async removeRepository(accountUuid: string, repositoryId: string): Promise<void> {
    try {
      const db = await this.getDb();
      db.prepare(`DELETE FROM repositories WHERE account_uuid = ? AND id = ?`).run(
        accountUuid,
        repositoryId,
      );
    } catch (error) {
      console.error('删除仓库失败:', error);
      throw error;
    }
  }

  async getRepositoryById(accountUuid: string, repositoryId: string): Promise<Repository | null> {
    try {
      const db = await this.getDb();
      const row = db
        .prepare(`SELECT * FROM repositories WHERE account_uuid = ? AND id = ?`)
        .get(accountUuid, repositoryId) as Record<string, any>;
      if (!row) return null;
      return this.mapRowToRepository(row);
    } catch (error) {
      console.error('查找仓库失败:', error);
      throw error;
    }
  }

  async findAllRepositories(accountUuid: string): Promise<Repository[]> {
    try {
      const db = await this.getDb();
      const rows = db
        .prepare(`SELECT * FROM repositories WHERE account_uuid = ?`)
        .all(accountUuid) as Record<string, any>[];
      return rows.map((row) => this.mapRowToRepository(row));
    } catch (error) {
      console.error('查找所有仓库失败:', error);
      throw error;
    }
  }

  private mapRowToRepository(row: Record<string, any>): Repository {
    const repository = Repository.fromDTO({
      uuid: row.uuid,
      name: row.name,
      path: row.path,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      relatedGoals: row.relatedGoals ? JSON.parse(row.relatedGoals) : [],
    });
    return repository;
  }
}
