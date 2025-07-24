import type { Database } from "better-sqlite3";

export class ReminderTables {
  static createTables(db: Database) {
    // db.exec(`DROP TABLE IF EXISTS reminders;`);
    // db.exec(`DROP TABLE IF EXISTS reminder_groups;`);
    db.exec(`
            CREATE TABLE IF NOT EXISTS reminder_groups (
            account_uuid TEXT NOT NULL,
            uuid TEXT NOT NULL,
            name TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            enable_mode TEXT NOT NULL DEFAULT 'group',
            PRIMARY KEY (account_uuid, uuid),
            FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
            );
        `);

    db.exec(`
            CREATE TABLE IF NOT EXISTS reminders (
                account_uuid TEXT NOT NULL,
                uuid TEXT PRIMARY KEY,
                group_uuid TEXT,
                name TEXT NOT NULL,
                description TEXT,
                importance_level INTEGER NOT NULL,
                self_enabled INTEGER DEFAULT 1,
                enabled INTEGER DEFAULT 0,
                notification_sound INTEGER DEFAULT 0,
                notification_vibration INTEGER DEFAULT 0,
                notification_popup INTEGER DEFAULT 0,
                time_config TEXT NOT NULL, -- JSON 字符串，存储时间配置
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
            );
        `);
  }
}
