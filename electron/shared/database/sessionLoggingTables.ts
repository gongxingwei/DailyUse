import type { Database } from "better-sqlite3";

/**
 * 会话记录模块数据表管理
 * 负责会话日志、审计轨迹、风险监控等
 */
export class SessionLoggingTables {
  /**
   * 创建会话记录相关表
   */
  static createTables(db: Database): void {
    // 会话日志表
    db.exec(`
      CREATE TABLE IF NOT EXISTS session_logs (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        session_uuid TEXT,
        operation_type TEXT NOT NULL CHECK(operation_type IN ('login', 'logout', 'expired', 'forced_logout', 'session_refresh', 'mfa_verification', 'password_change', 'account_locked', 'suspicious_activity')),
        operation_status TEXT NOT NULL CHECK(operation_status IN ('success', 'failure', 'warning', 'info')),
        device_info TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        -- 地理位置信息
        ip_country TEXT,
        ip_region TEXT,
        ip_city TEXT,
        ip_latitude REAL,
        ip_longitude REAL,
        ip_timezone TEXT,
        ip_isp TEXT,
        -- 浏览器信息
        user_agent TEXT,
        browser_name TEXT,
        browser_version TEXT,
        os_name TEXT,
        os_version TEXT,
        -- 会话时间信息
        login_time INTEGER,
        logout_time INTEGER,
        session_duration INTEGER, -- 会话持续时间（秒）
        -- 风险评估
        risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
        risk_score INTEGER CHECK(risk_score BETWEEN 0 AND 100),
        risk_factors TEXT, -- JSON 格式存储风险因素数组
        is_anomalous BOOLEAN NOT NULL DEFAULT 0,
        anomaly_reasons TEXT, -- JSON 格式存储异常原因
        -- 响应信息
        response_time INTEGER, -- 响应时间（毫秒）
        response_size INTEGER, -- 响应大小（字节）
        -- 元数据
        metadata TEXT, -- JSON 格式存储额外信息
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (session_uuid) REFERENCES auth_sessions(uuid) ON DELETE SET NULL
      )
    `);

    // 审计轨迹表
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_trails (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        session_log_uuid TEXT,
        -- 操作信息
        operation_type TEXT NOT NULL,
        operation_category TEXT NOT NULL CHECK(operation_category IN ('authentication', 'authorization', 'data_access', 'data_modification', 'system_configuration', 'security_event')),
        operation_description TEXT NOT NULL,
        -- 资源信息
        resource_type TEXT, -- 操作的资源类型
        resource_id TEXT, -- 操作的资源ID
        resource_name TEXT, -- 操作的资源名称
        -- 风险评估
        risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
        risk_score INTEGER CHECK(risk_score BETWEEN 0 AND 100),
        -- 位置信息
        ip_address TEXT NOT NULL,
        ip_country TEXT,
        ip_region TEXT,
        ip_city TEXT,
        ip_latitude REAL,
        ip_longitude REAL,
        ip_timezone TEXT,
        ip_isp TEXT,
        -- 设备信息
        user_agent TEXT,
        device_fingerprint TEXT,
        -- 结果信息
        operation_result TEXT NOT NULL CHECK(operation_result IN ('success', 'failure', 'partial_success', 'blocked')),
        failure_reason TEXT,
        -- 影响评估
        impact_level TEXT CHECK(impact_level IN ('none', 'low', 'medium', 'high', 'critical')),
        affected_records INTEGER,
        -- 告警信息
        is_alert_triggered BOOLEAN NOT NULL DEFAULT 0,
        alert_level TEXT CHECK(alert_level IN ('info', 'warning', 'error', 'critical')),
        alert_message TEXT,
        -- 合规性
        compliance_tags TEXT, -- JSON 格式存储合规标签
        retention_period INTEGER, -- 保留期限（天）
        -- 元数据
        metadata TEXT, -- JSON 格式存储元数据
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (session_log_uuid) REFERENCES session_logs(uuid) ON DELETE SET NULL
      )
    `);

    // 风险评估规则表
    db.exec(`
      CREATE TABLE IF NOT EXISTS risk_assessment_rules (
        uuid TEXT PRIMARY KEY,
        rule_name TEXT NOT NULL,
        rule_type TEXT NOT NULL CHECK(rule_type IN ('ip_location', 'device_fingerprint', 'behavior_pattern', 'time_based', 'frequency_based', 'geolocation', 'custom')),
        rule_description TEXT,
        rule_conditions TEXT NOT NULL, -- JSON 格式存储规则条件
        risk_score INTEGER NOT NULL CHECK(risk_score BETWEEN 1 AND 100),
        is_enabled BOOLEAN NOT NULL DEFAULT 1,
        priority INTEGER NOT NULL DEFAULT 1,
        created_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // 异常行为检测表
    db.exec(`
      CREATE TABLE IF NOT EXISTS anomaly_detections (
        uuid TEXT PRIMARY KEY,
        account_uuid TEXT NOT NULL,
        session_log_uuid TEXT,
        detection_type TEXT NOT NULL CHECK(detection_type IN ('unusual_location', 'unusual_time', 'unusual_device', 'suspicious_behavior', 'multiple_failures', 'velocity_check')),
        detection_description TEXT NOT NULL,
        confidence_score REAL NOT NULL CHECK(confidence_score BETWEEN 0.0 AND 1.0),
        severity_level TEXT NOT NULL CHECK(severity_level IN ('low', 'medium', 'high', 'critical')),
        detection_data TEXT, -- JSON 格式存储检测数据
        is_false_positive BOOLEAN NOT NULL DEFAULT 0,
        reviewed_by TEXT,
        reviewed_at INTEGER,
        review_notes TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE,
        FOREIGN KEY (session_log_uuid) REFERENCES session_logs(uuid) ON DELETE SET NULL
      )
    `);
  }

  /**
   * 创建会话记录相关索引
   */
  static createIndexes(db: Database): void {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_session_logs_account_uuid ON session_logs(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_session_logs_session_uuid ON session_logs(session_uuid);
      CREATE INDEX IF NOT EXISTS idx_session_logs_operation_type ON session_logs(operation_type);
      CREATE INDEX IF NOT EXISTS idx_session_logs_operation_status ON session_logs(operation_status);
      CREATE INDEX IF NOT EXISTS idx_session_logs_risk_level ON session_logs(risk_level);
      CREATE INDEX IF NOT EXISTS idx_session_logs_risk_score ON session_logs(risk_score);
      CREATE INDEX IF NOT EXISTS idx_session_logs_is_anomalous ON session_logs(is_anomalous);
      CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_session_logs_login_time ON session_logs(login_time);
      CREATE INDEX IF NOT EXISTS idx_session_logs_ip_address ON session_logs(ip_address);
      CREATE INDEX IF NOT EXISTS idx_session_logs_ip_country ON session_logs(ip_country);
      CREATE INDEX IF NOT EXISTS idx_session_logs_device_info ON session_logs(device_info);
      
      CREATE INDEX IF NOT EXISTS idx_audit_trails_account_uuid ON audit_trails(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_session_log_uuid ON audit_trails(session_log_uuid);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_operation_type ON audit_trails(operation_type);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_operation_category ON audit_trails(operation_category);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_risk_level ON audit_trails(risk_level);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_risk_score ON audit_trails(risk_score);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_is_alert_triggered ON audit_trails(is_alert_triggered);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_alert_level ON audit_trails(alert_level);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_timestamp ON audit_trails(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_ip_address ON audit_trails(ip_address);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_resource_type ON audit_trails(resource_type);
      CREATE INDEX IF NOT EXISTS idx_audit_trails_operation_result ON audit_trails(operation_result);
      
      CREATE INDEX IF NOT EXISTS idx_risk_rules_type ON risk_assessment_rules(rule_type);
      CREATE INDEX IF NOT EXISTS idx_risk_rules_enabled ON risk_assessment_rules(is_enabled);
      CREATE INDEX IF NOT EXISTS idx_risk_rules_priority ON risk_assessment_rules(priority);
      CREATE INDEX IF NOT EXISTS idx_risk_rules_created_at ON risk_assessment_rules(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_anomaly_detections_account_uuid ON anomaly_detections(account_uuid);
      CREATE INDEX IF NOT EXISTS idx_anomaly_detections_session_log_uuid ON anomaly_detections(session_log_uuid);
      CREATE INDEX IF NOT EXISTS idx_anomaly_detections_type ON anomaly_detections(detection_type);
      CREATE INDEX IF NOT EXISTS idx_anomaly_detections_severity ON anomaly_detections(severity_level);
      CREATE INDEX IF NOT EXISTS idx_anomaly_detections_confUuidence ON anomaly_detections(confidence_score);
      CREATE INDEX IF NOT EXISTS idx_anomaly_detections_false_positive ON anomaly_detections(is_false_positive);
      CREATE INDEX IF NOT EXISTS idx_anomaly_detections_created_at ON anomaly_detections(created_at);
    `);
  }
}
