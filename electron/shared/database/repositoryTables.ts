import type { Database } from "better-sqlite3";

export class RepositoryTables {
    static createTables(db: Database): void {
        db.prepare(`CREATE TABLE IF NOT EXISTS repositories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            description TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            relatedGoals TEXT
        )`).run();
    }

    static dropTables(db: Database): void {
        db.prepare(`DROP TABLE IF EXISTS repositories`).run();
    }
}
