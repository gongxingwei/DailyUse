import type { Database } from "better-sqlite3";

/**
 * 任务模块数据表管理
 * 负责任务模板、任务实例、任务元模板等
 */
export class TaskTables {
  /**
   * 创建任务相关表
   */
  static createTables(db: Database): void {
    // 任务分类表
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_categories (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        parent_uuid TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_system BOOLEAN NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (parent_uuid) REFERENCES task_categories(uuid) ON DELETE CASCADE
      )
    `);

    // 任务元模板表 - 预定义的任务类型
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_meta_templates (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category_uuid TEXT,
        icon TEXT,
        color TEXT,
        -- 默认配置
        default_time_config TEXT NOT NULL, -- JSON 格式存储默认时间配置
        default_reminder_config TEXT NOT NULL, -- JSON 格式存储默认提醒配置
        default_metadata TEXT NOT NULL, -- JSON 格式存储默认元数据
        -- 模板属性
        is_system BOOLEAN NOT NULL DEFAULT 0,
        is_enabled BOOLEAN NOT NULL DEFAULT 1,
        usage_count INTEGER NOT NULL DEFAULT 0,
        -- 生命周期
        lifecycle TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (category_uuid) REFERENCES task_categories(uuid) ON DELETE SET NULL
      )
    `);

    // 任务模板表 - 用户创建的可重用任务模板
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_templates (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        meta_template_uuid TEXT,
        title TEXT NOT NULL,
        description TEXT,
        category_uuid TEXT,
        -- 时间配置
        time_config TEXT NOT NULL, -- JSON 格式存储时间配置
        estimated_duration INTEGER, -- 预估时长（分钟）
        -- 提醒配置
        reminder_config TEXT NOT NULL, -- JSON 格式存储提醒配置
        -- 调度策略
        scheduling_policy TEXT NOT NULL, -- JSON 格式存储调度策略
        -- 关联配置
        key_result_links TEXT, -- JSON 格式存储关键结果链接
        -- 元数据
        metadata TEXT NOT NULL, -- JSON 格式存储元数据
        tags TEXT, -- JSON 格式存储标签
        -- 统计信息
        usage_count INTEGER NOT NULL DEFAULT 0,
        completion_rate REAL, -- 完成率
        average_duration INTEGER, -- 平均完成时长（分钟）
        -- 生命周期
        lifecycle TEXT NOT NULL DEFAULT 'active',
        analytics TEXT NOT NULL DEFAULT '{}', -- JSON 格式存储分析数据
        version INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (meta_template_uuid) REFERENCES task_meta_templates(uuid) ON DELETE SET NULL,
        FOREIGN KEY (category_uuid) REFERENCES task_categories(uuid) ON DELETE SET NULL
      )
    `);

    // 任务实例表 - 具体的任务执行实例
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_instances (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        template_uuid TEXT,
        parent_uuid TEXT, -- 父任务（子任务支持）
        -- 基本信息
        title TEXT NOT NULL,
        description TEXT,
        category_uuid TEXT,
        -- 时间信息
        time_config TEXT NOT NULL, -- JSON 格式存储时间配置
        planned_start_time INTEGER,
        planned_end_time INTEGER,
        actual_start_time INTEGER,
        actual_end_time INTEGER,
        estimated_duration INTEGER, -- 预估时长（分钟）
        actual_duration INTEGER, -- 实际时长（分钟）
        -- 优先级和状态
        priority INTEGER CHECK(priority BETWEEN 1 AND 5) DEFAULT 3,
        status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue', 'paused')) NOT NULL DEFAULT 'pending',
        completion_percentage INTEGER CHECK(completion_percentage BETWEEN 0 AND 100) DEFAULT 0,
        completed_at INTEGER,
        -- 提醒状态
        reminder_status TEXT NOT NULL DEFAULT 'pending',
        last_reminder_at INTEGER,
        -- 关联信息
        key_result_links TEXT, -- JSON 格式存储关键结果链接
        -- 扩展信息
        tags TEXT, -- JSON 格式存储标签
        notes TEXT, -- 任务备注
        attachments TEXT, -- JSON 格式存储附件信息
        -- 元数据
        metadata TEXT NOT NULL DEFAULT '{}',
        -- 生命周期
        lifecycle TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (template_uuid) REFERENCES task_templates(uuid) ON DELETE SET NULL,
        FOREIGN KEY (parent_uuid) REFERENCES task_instances(uuid) ON DELETE CASCADE,
        FOREIGN KEY (category_uuid) REFERENCES task_categories(uuid) ON DELETE SET NULL
      )
    `);

    // 任务执行记录表 - 记录任务的执行历史
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_execution_logs (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        task_instance_uuid TEXT NOT NULL,
        -- 执行信息
        execution_type TEXT NOT NULL CHECK(execution_type IN ('start', 'pause', 'resume', 'complete', 'cancel', 'update')),
        execution_status TEXT NOT NULL CHECK(execution_status IN ('success', 'failure', 'partial')),
        -- 时间信息
        start_time INTEGER,
        end_time INTEGER,
        duration INTEGER, -- 执行时长（分钟）
        -- 变更信息
        changes TEXT, -- JSON 格式存储变更内容
        previous_status TEXT,
        new_status TEXT,
        -- 环境信息
        device_info TEXT,
        app_version TEXT,
        -- 备注
        notes TEXT,
        error_message TEXT,
        -- 元数据
        metadata TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (task_instance_uuid) REFERENCES task_instances(uuid) ON DELETE CASCADE
      )
    `);

    // 任务依赖关系表
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        predecessor_uuid TEXT NOT NULL, -- 前置任务
        successor_uuid TEXT NOT NULL,   -- 后置任务
        dependency_type TEXT NOT NULL CHECK(dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
        lag_time INTEGER DEFAULT 0, -- 滞后时间（分钟）
        is_critical BOOLEAN NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (predecessor_uuid) REFERENCES task_instances(uuid) ON DELETE CASCADE,
        FOREIGN KEY (successor_uuid) REFERENCES task_instances(uuid) ON DELETE CASCADE,
        UNIQUE(predecessor_uuid, successor_uuid)
      )
    `);
  }

  /**
   * 创建任务相关索引
   */
  static createIndexes(db: Database): void {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_task_categories_account_uuid ON task_categories(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_categories_parent_uuid ON task_categories(parent_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_categories_sort_order ON task_categories(sort_order);
      CREATE INDEX IF NOT EXISTS idx_task_categories_is_system ON task_categories(is_system);
      
      CREATE INDEX IF NOT EXISTS idx_task_meta_templates_account_uuid ON task_meta_templates(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_meta_templates_category_uuid ON task_meta_templates(category_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_meta_templates_is_system ON task_meta_templates(is_system);
      CREATE INDEX IF NOT EXISTS idx_task_meta_templates_is_enabled ON task_meta_templates(is_enabled);
      CREATE INDEX IF NOT EXISTS idx_task_meta_templates_usage_count ON task_meta_templates(usage_count);
      CREATE INDEX IF NOT EXISTS idx_task_meta_templates_lifecycle ON task_meta_templates(lifecycle);
      
      CREATE INDEX IF NOT EXISTS idx_task_templates_account_uuid ON task_templates(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_templates_meta_template_uuid ON task_templates(meta_template_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_templates_category_uuid ON task_templates(category_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_templates_lifecycle ON task_templates(lifecycle);
      CREATE INDEX IF NOT EXISTS idx_task_templates_usage_count ON task_templates(usage_count);
      CREATE INDEX IF NOT EXISTS idx_task_templates_completion_rate ON task_templates(completion_rate);
      CREATE INDEX IF NOT EXISTS idx_task_templates_created_at ON task_templates(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_task_instances_account_uuid ON task_instances(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_instances_template_uuid ON task_instances(template_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_instances_parent_uuid ON task_instances(parent_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_instances_category_uuid ON task_instances(category_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
      CREATE INDEX IF NOT EXISTS idx_task_instances_priority ON task_instances(priority);
      CREATE INDEX IF NOT EXISTS idx_task_instances_planned_start_time ON task_instances(planned_start_time);
      CREATE INDEX IF NOT EXISTS idx_task_instances_planned_end_time ON task_instances(planned_end_time);
      CREATE INDEX IF NOT EXISTS idx_task_instances_actual_start_time ON task_instances(actual_start_time);
      CREATE INDEX IF NOT EXISTS idx_task_instances_actual_end_time ON task_instances(actual_end_time);
      CREATE INDEX IF NOT EXISTS idx_task_instances_completed_at ON task_instances(completed_at);
      CREATE INDEX IF NOT EXISTS idx_task_instances_reminder_status ON task_instances(reminder_status);
      CREATE INDEX IF NOT EXISTS idx_task_instances_lifecycle ON task_instances(lifecycle);
      CREATE INDEX IF NOT EXISTS idx_task_instances_created_at ON task_instances(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_task_execution_logs_account_uuid ON task_execution_logs(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_execution_logs_task_instance_uuid ON task_execution_logs(task_instance_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_execution_logs_execution_type ON task_execution_logs(execution_type);
      CREATE INDEX IF NOT EXISTS idx_task_execution_logs_execution_status ON task_execution_logs(execution_status);
      CREATE INDEX IF NOT EXISTS idx_task_execution_logs_start_time ON task_execution_logs(start_time);
      CREATE INDEX IF NOT EXISTS idx_task_execution_logs_created_at ON task_execution_logs(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_task_dependencies_account_uuid ON task_dependencies(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor_uuid ON task_dependencies(predecessor_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor_uuid ON task_dependencies(successor_uuid);
      CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependency_type ON task_dependencies(dependency_type);
      CREATE INDEX IF NOT EXISTS idx_task_dependencies_is_critical ON task_dependencies(is_critical);
    `);
  }
}
