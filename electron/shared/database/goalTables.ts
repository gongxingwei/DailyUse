import type { Database } from "better-sqlite3";

/**
 * 目标模块数据表管理
 * 负责目标目录、目标、关键结果、目标记录等
 */
export class GoalTables {
  /**
   * 创建目标相关表
   */
  static createTables(db: Database): void {
    // 目标分类表
    db.exec(`
      CREATE TABLE IF NOT EXISTS goal_categories (
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
        FOREIGN KEY (parent_uuid) REFERENCES goal_categories(uuid) ON DELETE CASCADE
      )
    `);

    // 目标目录表 - 组织目标的层级结构
    db.exec(`
      CREATE TABLE IF NOT EXISTS goal_directories (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT NOT NULL,
        color TEXT,
        parent_uuid TEXT,
        category_uuid TEXT,
        -- 目录属性
        is_archived BOOLEAN NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        -- 统计信息
        goal_count INTEGER NOT NULL DEFAULT 0,
        active_goal_count INTEGER NOT NULL DEFAULT 0,
        completed_goal_count INTEGER NOT NULL DEFAULT 0,
        -- 生命周期
        lifecycle TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (parent_uuid) REFERENCES goal_directories(uuid) ON DELETE CASCADE,
        FOREIGN KEY (category_uuid) REFERENCES goal_categories(uuid) ON DELETE SET NULL
      )
    `);

    // 目标表 - 核心目标信息
    db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        directory_uuid TEXT NOT NULL,
        category_uuid TEXT,
        -- 基本信息
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        icon TEXT,
        -- 时间信息
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        created_time INTEGER NOT NULL,
        updated_time INTEGER NOT NULL,
        -- 状态信息
        status TEXT NOT NULL CHECK(status IN ('draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived')) DEFAULT 'draft',
        progress_percentage REAL NOT NULL DEFAULT 0.0 CHECK(progress_percentage BETWEEN 0.0 AND 100.0),
        -- 优先级
        priority INTEGER CHECK(priority BETWEEN 1 AND 5) DEFAULT 3,
        -- 目标类型
        goal_type TEXT NOT NULL CHECK(goal_type IN ('personal', 'professional', 'health', 'education', 'financial', 'other')) DEFAULT 'personal',
        -- 测量方式
        measurement_method TEXT CHECK(measurement_method IN ('binary', 'percentage', 'count', 'value', 'custom')) DEFAULT 'binary',
        -- 扩展信息
        tags TEXT, -- JSON 格式存储标签
        notes TEXT, -- 目标备注
        attachments TEXT, -- JSON 格式存储附件信息
        -- 分析数据
        analysis TEXT NOT NULL DEFAULT '{}', -- JSON 格式存储分析数据
        -- 生命周期
        lifecycle TEXT NOT NULL DEFAULT 'active',
        analytics TEXT NOT NULL DEFAULT '{}', -- JSON 格式存储分析数据
        version INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (directory_uuid) REFERENCES goal_directories(uuid) ON DELETE CASCADE,
        FOREIGN KEY (category_uuid) REFERENCES goal_categories(uuid) ON DELETE SET NULL
      )
    `);

    // 关键结果表 - OKR 中的关键结果
    db.exec(`
      CREATE TABLE IF NOT EXISTS key_results (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        goal_uuid TEXT NOT NULL,
        -- 基本信息
        name TEXT NOT NULL,
        description TEXT,
        -- 数值信息
        start_value REAL NOT NULL DEFAULT 0,
        target_value REAL NOT NULL,
        current_value REAL NOT NULL DEFAULT 0,
        unit TEXT, -- 单位
        -- 计算方式
        calculation_method TEXT CHECK(calculation_method IN ('sum', 'average', 'max', 'min', 'custom', 'percentage')) NOT NULL DEFAULT 'sum',
        -- 权重和优先级
        weight INTEGER CHECK(weight BETWEEN 0 AND 10) NOT NULL DEFAULT 5,
        priority INTEGER CHECK(priority BETWEEN 1 AND 5) DEFAULT 3,
        -- 状态
        status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
        progress_percentage REAL NOT NULL DEFAULT 0.0 CHECK(progress_percentage BETWEEN 0.0 AND 100.0),
        -- 时间信息
        deadline INTEGER,
        completed_at INTEGER,
        -- 扩展信息
        tags TEXT, -- JSON 格式存储标签
        notes TEXT, -- 关键结果备注
        -- 生命周期
        lifecycle TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE
      )
    `);

    // 目标记录表 - 记录目标进度的历史数据
    db.exec(`
      CREATE TABLE IF NOT EXISTS goal_records (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        goal_uuid TEXT NOT NULL,
        key_result_uuid TEXT,
        -- 记录信息
        record_type TEXT NOT NULL CHECK(record_type IN ('progress_update', 'milestone', 'note', 'review', 'adjustment')) DEFAULT 'progress_update',
        value REAL, -- 记录的数值
        previous_value REAL, -- 之前的数值
        delta_value REAL, -- 变化值
        -- 时间信息
        record_date INTEGER NOT NULL,
        -- 内容信息
        title TEXT,
        description TEXT,
        notes TEXT,
        -- 关联信息
        related_task_uuid TEXT, -- 关联的任务
        -- 元数据
        metadata TEXT, -- JSON 格式存储元数据
        -- 审核信息
        is_verified BOOLEAN NOT NULL DEFAULT 0,
        verified_by TEXT,
        verified_at INTEGER,
        -- 生命周期
        lifecycle TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE,
        FOREIGN KEY (key_result_uuid) REFERENCES key_results(uuid) ON DELETE SET NULL
      )
    `);

    // 目标审查表 - 定期审查记录
    db.exec(`
      CREATE TABLE IF NOT EXISTS goal_reviews (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        goal_uuid TEXT NOT NULL,
        -- 审查信息
        review_type TEXT NOT NULL CHECK(review_type IN ('weekly', 'monthly', 'quarterly', 'annual', 'milestone', 'ad_hoc')) DEFAULT 'weekly',
        review_date INTEGER NOT NULL,
        -- 审查结果
        overall_rating INTEGER CHECK(overall_rating BETWEEN 1 AND 5),
        progress_rating INTEGER CHECK(progress_rating BETWEEN 1 AND 5),
        satisfaction_rating INTEGER CHECK(satisfaction_rating BETWEEN 1 AND 5),
        -- 审查内容
        achievements TEXT, -- JSON 格式存储成就
        challenges TEXT, -- JSON 格式存储挑战
        learnings TEXT, -- JSON 格式存储学习
        next_steps TEXT, -- JSON 格式存储下一步计划
        -- 调整建议
        adjustment_recommendations TEXT, -- JSON 格式存储调整建议
        -- 备注
        notes TEXT,
        -- 元数据
        metadata TEXT, -- JSON 格式存储元数据
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE
      )
    `);

    // 目标关系表 - 目标之间的关系
    db.exec(`
      CREATE TABLE IF NOT EXISTS goal_relationships (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        source_goal_uuid TEXT NOT NULL,
        target_goal_uuid TEXT NOT NULL,
        relationship_type TEXT NOT NULL CHECK(relationship_type IN ('depends_on', 'supports', 'conflicts_with', 'similar_to', 'parent_of', 'child_of')),
        strength REAL CHECK(strength BETWEEN 0.0 AND 1.0) DEFAULT 1.0,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (source_goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE,
        FOREIGN KEY (target_goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE,
        UNIQUE(source_goal_uuid, target_goal_uuid, relationship_type)
      )
    `);
  }

  /**
   * 创建目标相关索引
   */
  static createIndexes(db: Database): void {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_goal_categories_account_uuid ON goal_categories(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_categories_parent_uuid ON goal_categories(parent_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_categories_sort_order ON goal_categories(sort_order);
      CREATE INDEX IF NOT EXISTS idx_goal_categories_is_system ON goal_categories(is_system);
      
      CREATE INDEX IF NOT EXISTS idx_goal_directories_account_uuid ON goal_directories(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_directories_parent_uuid ON goal_directories(parent_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_directories_category_uuid ON goal_directories(category_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_directories_is_archived ON goal_directories(is_archived);
      CREATE INDEX IF NOT EXISTS idx_goal_directories_sort_order ON goal_directories(sort_order);
      CREATE INDEX IF NOT EXISTS idx_goal_directories_lifecycle ON goal_directories(lifecycle);
      
      CREATE INDEX IF NOT EXISTS idx_goals_account_uuid ON goals(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_goals_directory_uuid ON goals(directory_uuid);
      CREATE INDEX IF NOT EXISTS idx_goals_category_uuid ON goals(category_uuid);
      CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
      CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
      CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);
      CREATE INDEX IF NOT EXISTS idx_goals_start_time ON goals(start_time);
      CREATE INDEX IF NOT EXISTS idx_goals_end_time ON goals(end_time);
      CREATE INDEX IF NOT EXISTS idx_goals_progress_percentage ON goals(progress_percentage);
      CREATE INDEX IF NOT EXISTS idx_goals_lifecycle ON goals(lifecycle);
      CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_key_results_account_uuid ON key_results(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_key_results_goal_uuid ON key_results(goal_uuid);
      CREATE INDEX IF NOT EXISTS idx_key_results_status ON key_results(status);
      CREATE INDEX IF NOT EXISTS idx_key_results_priority ON key_results(priority);
      CREATE INDEX IF NOT EXISTS idx_key_results_weight ON key_results(weight);
      CREATE INDEX IF NOT EXISTS idx_key_results_progress_percentage ON key_results(progress_percentage);
      CREATE INDEX IF NOT EXISTS idx_key_results_deadline ON key_results(deadline);
      CREATE INDEX IF NOT EXISTS idx_key_results_completed_at ON key_results(completed_at);
      CREATE INDEX IF NOT EXISTS idx_key_results_lifecycle ON key_results(lifecycle);
      CREATE INDEX IF NOT EXISTS idx_key_results_created_at ON key_results(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_goal_records_account_uuid ON goal_records(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_records_goal_uuid ON goal_records(goal_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_records_key_result_uuid ON goal_records(key_result_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_records_record_type ON goal_records(record_type);
      CREATE INDEX IF NOT EXISTS idx_goal_records_record_date ON goal_records(record_date);
      CREATE INDEX IF NOT EXISTS idx_goal_records_is_verified ON goal_records(is_verified);
      CREATE INDEX IF NOT EXISTS idx_goal_records_lifecycle ON goal_records(lifecycle);
      CREATE INDEX IF NOT EXISTS idx_goal_records_created_at ON goal_records(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_goal_reviews_account_uuid ON goal_reviews(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_reviews_goal_uuid ON goal_reviews(goal_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_reviews_review_type ON goal_reviews(review_type);
      CREATE INDEX IF NOT EXISTS idx_goal_reviews_review_date ON goal_reviews(review_date);
      CREATE INDEX IF NOT EXISTS idx_goal_reviews_overall_rating ON goal_reviews(overall_rating);
      CREATE INDEX IF NOT EXISTS idx_goal_reviews_created_at ON goal_reviews(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_goal_relationships_account_uuid ON goal_relationships(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_relationships_source_goal_uuid ON goal_relationships(source_goal_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_relationships_target_goal_uuid ON goal_relationships(target_goal_uuid);
      CREATE INDEX IF NOT EXISTS idx_goal_relationships_relationship_type ON goal_relationships(relationship_type);
      CREATE INDEX IF NOT EXISTS idx_goal_relationships_is_active ON goal_relationships(is_active);
      CREATE INDEX IF NOT EXISTS idx_goal_relationships_strength ON goal_relationships(strength);
    `);
  }
}
