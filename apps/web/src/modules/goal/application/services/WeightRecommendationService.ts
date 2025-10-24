import type { KeyResult } from '@dailyuse/domain-client';

/**
 * 权重分配策略
 */
export interface WeightStrategy {
  name: 'balanced' | 'focused' | 'stepped';
  label: string;
  description: string;
  weights: number[];
  reasoning: string;
  confidence: number; // 0-100，推荐置信度
}

/**
 * AI 权重推荐服务（基于规则引擎）
 * 
 * 职责：
 * - 分析 KeyResult 标题关键词
 * - 生成 3 种权重分配策略
 * - 提供推荐理由
 */
export class WeightRecommendationService {
  /**
   * 高优先级关键词（权重 +20）
   */
  private readonly HIGH_PRIORITY_KEYWORDS = [
    'critical', 'urgent', 'important', 'key', 'core', 'essential',
    'critical', 'vital', 'primary', 'main',
    '关键', '核心', '重要', '紧急', '主要', '首要'
  ];

  /**
   * 业务价值关键词（权重 +15）
   */
  private readonly BUSINESS_VALUE_KEYWORDS = [
    'revenue', 'sales', 'customer', 'user', 'profit', 'growth',
    'market', 'conversion', 'retention',
    '收入', '营收', '销售', '客户', '用户', '增长', '市场', '转化'
  ];

  /**
   * 效率提升关键词（权重 +10）
   */
  private readonly EFFICIENCY_KEYWORDS = [
    'reduce', 'improve', 'optimize', 'automate', 'streamline',
    'efficiency', 'performance', 'speed',
    '减少', '改进', '优化', '自动化', '提升', '效率', '性能'
  ];

  /**
   * 创新探索关键词（权重 +5）
   */
  private readonly INNOVATION_KEYWORDS = [
    'new', 'innovation', 'experiment', 'pilot', 'explore',
    'research', 'prototype', 'poc',
    '新', '创新', '试验', '探索', '研究', '原型'
  ];

  /**
   * 推荐权重分配策略
   */
  recommendWeights(keyResults: KeyResult[]): WeightStrategy[] {
    if (!keyResults || keyResults.length === 0) {
      return [];
    }

    // 计算每个 KR 的优先级分数
    const priorities = this.calculatePriorities(keyResults);

    return [
      this.balancedStrategy(keyResults.length),
      this.focusedStrategy(keyResults, priorities),
      this.steppedStrategy(keyResults, priorities),
    ];
  }

  /**
   * 计算 KeyResult 优先级分数（基于关键词分析）
   */
  private calculatePriorities(keyResults: KeyResult[]): number[] {
    return keyResults.map(kr => {
      let score = 50; // 基础分数
      const title = kr.title.toLowerCase();

      // 高优先级关键词
      if (this.containsKeywords(title, this.HIGH_PRIORITY_KEYWORDS)) {
        score += 20;
      }

      // 业务价值关键词
      if (this.containsKeywords(title, this.BUSINESS_VALUE_KEYWORDS)) {
        score += 15;
      }

      // 效率提升关键词
      if (this.containsKeywords(title, this.EFFICIENCY_KEYWORDS)) {
        score += 10;
      }

      // 创新探索关键词
      if (this.containsKeywords(title, this.INNOVATION_KEYWORDS)) {
        score += 5;
      }

      return Math.min(100, score);
    });
  }

  /**
   * 检查文本是否包含关键词
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * 策略 1: 均衡分配
   * 适用场景：所有 KR 同等重要
   */
  private balancedStrategy(count: number): WeightStrategy {
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 - (baseWeight * count);

    const weights = Array(count).fill(baseWeight);
    weights[0] += remainder; // 余数加到第一个

    return {
      name: 'balanced',
      label: '均衡策略',
      description: '所有 KeyResult 权重相等，适合目标优先级相近的场景',
      weights,
      reasoning: `每个 KR 分配约 ${baseWeight}% 权重，确保所有目标均衡推进`,
      confidence: 80,
    };
  }

  /**
   * 策略 2: 聚焦策略
   * 适用场景：根据关键词识别核心 KR
   */
  private focusedStrategy(
    keyResults: KeyResult[],
    priorities: number[]
  ): WeightStrategy {
    // 按优先级分数分配权重
    const total = priorities.reduce((sum, p) => sum + p, 0);
    const weights = priorities.map(p => Math.round((p / total) * 100));

    // 调整确保总和为 100
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      weights[0] += (100 - sum);
    }

    // 找出最高权重的 KR 索引
    const maxWeightIndex = weights.indexOf(Math.max(...weights));
    const topKRTitle = keyResults[maxWeightIndex]?.title || 'KR';

    return {
      name: 'focused',
      label: '聚焦策略',
      description: '根据关键词分析，重点关注高优先级 KeyResult',
      weights,
      reasoning: `基于标题关键词分析，"${topKRTitle.slice(0, 30)}${topKRTitle.length > 30 ? '...' : ''}" 识别为核心 KR，分配更多权重`,
      confidence: this.calculateConfidence(priorities),
    };
  }

  /**
   * 策略 3: 阶梯策略
   * 适用场景：明确的优先级顺序
   */
  private steppedStrategy(
    keyResults: KeyResult[],
    priorities: number[]
  ): WeightStrategy {
    const count = keyResults.length;

    // 创建优先级排序映射
    const priorityIndexes = priorities
      .map((p, i) => ({ priority: p, index: i }))
      .sort((a, b) => b.priority - a.priority);

    // 使用等差数列分配权重：第一名最多，逐级递减
    const step = Math.floor(100 / (count * (count + 1) / 2));
    const tempWeights = priorityIndexes.map((_, i) =>
      (count - i) * step
    );

    // 调整确保总和为 100
    const sum = tempWeights.reduce((a, b) => a + b, 0);
    tempWeights[0] += (100 - sum);

    // 映射回原始顺序
    const weights = new Array(count).fill(0);
    priorityIndexes.forEach((item, i) => {
      weights[item.index] = tempWeights[i];
    });

    // 找出排名
    const topRank = priorityIndexes.findIndex(
      item => item.index === priorityIndexes[0].index
    );

    return {
      name: 'stepped',
      label: '阶梯策略',
      description: '按优先级梯度分配权重，适合明确优先级顺序的场景',
      weights,
      reasoning: `按优先级创建阶梯式分布，最高优先级 KR 获得 ${weights[priorityIndexes[0].index]}% 权重`,
      confidence: this.calculateConfidence(priorities),
    };
  }

  /**
   * 计算推荐置信度
   * 基于优先级分数的方差：方差越大，置信度越高
   */
  private calculateConfidence(priorities: number[]): number {
    if (priorities.length <= 1) return 50;

    const mean = priorities.reduce((a, b) => a + b, 0) / priorities.length;
    const variance = priorities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priorities.length;

    // 方差映射到置信度 (0-100)
    // 方差 0 → 低置信度 50
    // 方差 400+ → 高置信度 95
    const confidence = Math.min(95, 50 + (variance / 400) * 45);

    return Math.round(confidence);
  }

  /**
   * 验证权重总和
   */
  validateWeights(weights: number[]): { valid: boolean; error?: string } {
    const total = weights.reduce((sum, w) => sum + w, 0);

    if (total !== 100) {
      return {
        valid: false,
        error: `权重总和为 ${total}%，应该为 100%`,
      };
    }

    if (weights.some(w => w < 0 || w > 100)) {
      return {
        valid: false,
        error: '每个权重必须在 0-100% 之间',
      };
    }

    return { valid: true };
  }

  /**
   * 应用策略到 KeyResult 数组（直接修改对象，不返回新数组）
   * 注意：此方法会直接修改传入的 keyResults 对象
   */
  applyStrategy(
    keyResults: any[],
    strategy: WeightStrategy
  ): void {
    keyResults.forEach((kr, index) => {
      if (strategy.weights[index] !== undefined) {
        kr.weight = strategy.weights[index];
      }
    });
  }
}

// 导出单例
export const weightRecommendationService = new WeightRecommendationService();
