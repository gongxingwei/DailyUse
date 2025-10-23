/**
 * DAG Performance Optimization Module (STORY-018)
 * DAG 性能优化模块
 * 
 * 针对大规模目标图的渲染优化
 */

/**
 * 性能优化配置
 */
export const DAG_PERFORMANCE_CONFIG = {
  /**
   * 渲染优化阈值
   */
  THRESHOLDS: {
    SMALL: 20,       // < 20 nodes: 全功能渲染
    MEDIUM: 50,      // 20-50 nodes: 优化渲染
    LARGE: 100,      // 50-100 nodes: 激进优化
    HUGE: 200,       // >100 nodes: 极限优化
  },

  /**
   * 性能目标
   */
  TARGETS: {
    RENDER_TIME: 500,     // ms - 渲染时间
    FPS: 60,              // frames per second
    FRAME_BUDGET: 16.67,  // ms per frame (1000ms / 60fps)
  },

  /**
   * 优化策略
   */
  STRATEGIES: {
    // LOD (Level of Detail) 配置
    LOD: {
      enabled: true,
      minZoom: 0.3,       // 最小缩放级别显示简化版
      mediumZoom: 0.6,    // 中等缩放显示部分详情
      fullZoom: 1.0,      // 完整缩放显示所有详情
    },

    // 视口裁剪配置
    VIEWPORT_CULLING: {
      enabled: true,
      padding: 100,       // 视口外扩展范围 (px)
      debounceTime: 100,  // 防抖时间 (ms)
    },

    // 渲染优化
    RENDERING: {
      useSVG: false,         // 大规模时使用 Canvas
      progressive: true,      // 渐进式渲染
      progressiveChunkSize: 50, // 每次渲染节点数
    },

    // 动画优化
    ANIMATION: {
      enabled: true,
      duration: 300,         // ms
      disableThreshold: 100, // 节点数超过此值禁用动画
    },
  },
};

/**
 * 获取节点数对应的优化级别
 */
export function getOptimizationLevel(nodeCount: number): 'small' | 'medium' | 'large' | 'huge' {
  const { SMALL, MEDIUM, LARGE } = DAG_PERFORMANCE_CONFIG.THRESHOLDS;
  
  if (nodeCount < SMALL) return 'small';
  if (nodeCount < MEDIUM) return 'medium';
  if (nodeCount < LARGE) return 'large';
  return 'huge';
}

/**
 * 生成优化的 ECharts 配置
 */
export function getOptimizedEChartsConfig(nodeCount: number) {
  const level = getOptimizationLevel(nodeCount);
  const { STRATEGIES } = DAG_PERFORMANCE_CONFIG;

  const config: any = {
    animation: STRATEGIES.ANIMATION.enabled && nodeCount < STRATEGIES.ANIMATION.disableThreshold,
    animationDuration: STRATEGIES.ANIMATION.duration,
    animationEasing: 'cubicOut',
  };

  // 根据优化级别调整配置
  switch (level) {
    case 'small':
      // 全功能渲染
      config.progressive = false;
      config.emphasis = {
        focus: 'adjacency',
        label: { show: true },
        lineStyle: { width: 3 },
      };
      break;

    case 'medium':
      // 优化渲染
      config.progressive = STRATEGIES.RENDERING.progressive;
      config.progressiveThreshold = STRATEGIES.RENDERING.progressiveChunkSize;
      config.emphasis = {
        focus: 'adjacency',
        label: { show: true },
      };
      break;

    case 'large':
      // 激进优化
      config.progressive = STRATEGIES.RENDERING.progressive;
      config.progressiveThreshold = STRATEGIES.RENDERING.progressiveChunkSize / 2;
      config.animation = false; // 禁用动画
      config.emphasis = {
        focus: 'none', // 禁用相邻节点高亮
        label: { show: false },
      };
      break;

    case 'huge':
      // 极限优化
      config.progressive = true;
      config.progressiveThreshold = 20;
      config.animation = false;
      config.silent = true; // 禁用交互
      config.emphasis = {
        disabled: true,
      };
      break;
  }

  return config;
}

/**
 * LOD (Level of Detail) 渲染策略
 */
export function getLODNodeConfig(zoom: number, nodeCount: number) {
  const { LOD } = DAG_PERFORMANCE_CONFIG.STRATEGIES;
  
  if (!LOD.enabled) {
    return { showLabel: true, showTooltip: true, symbolSize: 40 };
  }

  // 根据缩放级别调整节点详细程度
  if (zoom < LOD.minZoom) {
    // 最小缩放：简化节点
    return {
      showLabel: false,
      showTooltip: false,
      symbolSize: 20,
      itemStyle: {
        opacity: 0.6,
      },
    };
  } else if (zoom < LOD.mediumZoom) {
    // 中等缩放：部分详情
    return {
      showLabel: nodeCount < 50, // 节点少时显示标签
      showTooltip: true,
      symbolSize: 30,
      itemStyle: {
        opacity: 0.8,
      },
    };
  } else {
    // 完整缩放：所有详情
    return {
      showLabel: true,
      showTooltip: true,
      symbolSize: 40,
      itemStyle: {
        opacity: 1,
      },
    };
  }
}

/**
 * 视口裁剪优化
 * 仅渲染视口内及附近的节点
 */
export function cullNodesOutsideViewport(
  nodes: any[],
  viewportBounds: { left: number; top: number; right: number; bottom: number },
  padding = DAG_PERFORMANCE_CONFIG.STRATEGIES.VIEWPORT_CULLING.padding
): any[] {
  if (!DAG_PERFORMANCE_CONFIG.STRATEGIES.VIEWPORT_CULLING.enabled) {
    return nodes;
  }

  const { left, top, right, bottom } = viewportBounds;

  return nodes.filter(node => {
    const x = node.x || 0;
    const y = node.y || 0;

    return (
      x >= left - padding &&
      x <= right + padding &&
      y >= top - padding &&
      y <= bottom + padding
    );
  });
}

/**
 * 性能监控工具
 */
export class DAGPerformanceMonitor {
  private metrics: {
    renderTime: number[];
    fps: number[];
    nodeCount: number[];
  } = {
    renderTime: [],
    fps: [],
    nodeCount: [],
  };

  private lastFrameTime = performance.now();
  private frameCount = 0;

  /**
   * 记录渲染时间
   */
  recordRenderTime(time: number, nodeCount: number) {
    this.metrics.renderTime.push(time);
    this.metrics.nodeCount.push(nodeCount);

    // 保留最近 100 条记录
    if (this.metrics.renderTime.length > 100) {
      this.metrics.renderTime.shift();
      this.metrics.nodeCount.shift();
    }

    // 检查是否超过目标
    if (time > DAG_PERFORMANCE_CONFIG.TARGETS.RENDER_TIME) {
      console.warn(`[DAG Performance] Render time ${time}ms exceeds target ${DAG_PERFORMANCE_CONFIG.TARGETS.RENDER_TIME}ms for ${nodeCount} nodes`);
    }
  }

  /**
   * 记录 FPS
   */
  recordFrame() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    const fps = 1000 / delta;

    this.metrics.fps.push(fps);
    this.frameCount++;

    // 保留最近 60 帧
    if (this.metrics.fps.length > 60) {
      this.metrics.fps.shift();
    }

    this.lastFrameTime = now;

    // 检查是否低于目标
    if (fps < DAG_PERFORMANCE_CONFIG.TARGETS.FPS * 0.8) {
      console.warn(`[DAG Performance] FPS ${fps.toFixed(1)} below target ${DAG_PERFORMANCE_CONFIG.TARGETS.FPS}`);
    }

    return fps;
  }

  /**
   * 获取性能报告
   */
  getReport() {
    const avgRenderTime = this.metrics.renderTime.reduce((a, b) => a + b, 0) / this.metrics.renderTime.length || 0;
    const avgFps = this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length || 0;
    const avgNodeCount = this.metrics.nodeCount.reduce((a, b) => a + b, 0) / this.metrics.nodeCount.length || 0;

    return {
      avgRenderTime: avgRenderTime.toFixed(2),
      avgFps: avgFps.toFixed(1),
      avgNodeCount: Math.round(avgNodeCount),
      totalFrames: this.frameCount,
      samples: this.metrics.renderTime.length,
    };
  }

  /**
   * 重置监控数据
   */
  reset() {
    this.metrics = {
      renderTime: [],
      fps: [],
      nodeCount: [],
    };
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
  }
}

/**
 * 全局性能监控实例
 */
export const dagPerformanceMonitor = new DAGPerformanceMonitor();
