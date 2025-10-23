/**
 * Large-Scale DAG Performance Benchmark (STORY-018)
 * 大规模 DAG 性能基准测试
 */

import { bench, describe } from 'vitest';
import {
  getOptimizationLevel,
  getOptimizedEChartsConfig,
  getLODNodeConfig,
  cullNodesOutsideViewport,
  DAGPerformanceMonitor,
} from '../modules/goal/application/services/DAGPerformanceOptimization';

/**
 * 生成测试 DAG 数据
 */
function generateDAGData(nodeCount: number) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    name: `Goal ${i}`,
    x: (i % 10) * 120,
    y: Math.floor(i / 10) * 100,
    value: Math.random() * 100,
    symbolSize: 40,
  }));

  // 生成边：每个节点连接到下一个节点
  const edges = Array.from({ length: nodeCount - 1 }, (_, i) => ({
    source: `node-${i}`,
    target: `node-${i + 1}`,
  }));

  // 添加一些额外的横向连接
  for (let i = 0; i < nodeCount - 10; i += 10) {
    edges.push({
      source: `node-${i}`,
      target: `node-${i + 10}`,
    });
  }

  return { nodes, edges };
}

/**
 * 1. 优化级别检测基准
 */
describe('Optimization Level Detection', () => {
  bench('Get optimization level (10 nodes)', () => {
    getOptimizationLevel(10);
  });

  bench('Get optimization level (50 nodes)', () => {
    getOptimizationLevel(50);
  });

  bench('Get optimization level (100 nodes)', () => {
    getOptimizationLevel(100);
  });

  bench('Get optimization level (200 nodes)', () => {
    getOptimizationLevel(200);
  });
});

/**
 * 2. ECharts 配置生成基准
 */
describe('ECharts Config Generation', () => {
  bench('Generate config (10 nodes)', () => {
    getOptimizedEChartsConfig(10);
  });

  bench('Generate config (50 nodes)', () => {
    getOptimizedEChartsConfig(50);
  });

  bench('Generate config (100 nodes)', () => {
    getOptimizedEChartsConfig(100);
  });

  bench('Generate config (200 nodes)', () => {
    getOptimizedEChartsConfig(200);
  });
});

/**
 * 3. LOD 节点配置基准
 */
describe('LOD Node Configuration', () => {
  bench('LOD config (zoom: 0.2, 100 nodes)', () => {
    getLODNodeConfig(0.2, 100);
  });

  bench('LOD config (zoom: 0.5, 100 nodes)', () => {
    getLODNodeConfig(0.5, 100);
  });

  bench('LOD config (zoom: 1.0, 100 nodes)', () => {
    getLODNodeConfig(1.0, 100);
  });
});

/**
 * 4. 视口裁剪基准
 */
describe('Viewport Culling Performance', () => {
  const nodes50 = generateDAGData(50).nodes;
  const nodes100 = generateDAGData(100).nodes;
  const nodes200 = generateDAGData(200).nodes;

  const viewport = {
    left: 0,
    top: 0,
    right: 600,
    bottom: 400,
  };

  bench('Cull nodes (50 nodes)', () => {
    cullNodesOutsideViewport(nodes50, viewport);
  });

  bench('Cull nodes (100 nodes)', () => {
    cullNodesOutsideViewport(nodes100, viewport);
  });

  bench('Cull nodes (200 nodes)', () => {
    cullNodesOutsideViewport(nodes200, viewport);
  });
});

/**
 * 5. DAG 数据生成基准
 */
describe('DAG Data Generation', () => {
  bench('Generate DAG (10 nodes)', () => {
    generateDAGData(10);
  });

  bench('Generate DAG (50 nodes)', () => {
    generateDAGData(50);
  });

  bench('Generate DAG (100 nodes)', () => {
    generateDAGData(100);
  });

  bench('Generate DAG (200 nodes)', () => {
    generateDAGData(200);
  });
});

/**
 * 6. 性能监控基准
 */
describe('Performance Monitoring', () => {
  const monitor = new DAGPerformanceMonitor();

  bench('Record render time', () => {
    monitor.recordRenderTime(Math.random() * 500, 100);
  });

  bench('Record frame', () => {
    monitor.recordFrame();
  });

  bench('Get performance report', () => {
    monitor.getReport();
  });

  bench('Reset monitor', () => {
    monitor.reset();
  });
});

/**
 * 7. 大规模 DAG 节点处理基准
 */
describe('Large-Scale DAG Node Processing', () => {
  bench('Process 100 nodes', () => {
    const { nodes, edges } = generateDAGData(100);
    
    // 模拟节点处理
    nodes.forEach(node => {
      const optimizationLevel = getOptimizationLevel(nodes.length);
      const lodConfig = getLODNodeConfig(1.0, nodes.length);
      
      return {
        ...node,
        ...lodConfig,
        optimizationLevel,
      };
    });
  });

  bench('Process 200 nodes', () => {
    const { nodes, edges } = generateDAGData(200);
    
    nodes.forEach(node => {
      const optimizationLevel = getOptimizationLevel(nodes.length);
      const lodConfig = getLODNodeConfig(1.0, nodes.length);
      
      return {
        ...node,
        ...lodConfig,
        optimizationLevel,
      };
    });
  });
});

/**
 * 8. 边计算基准
 */
describe('Edge Calculation Performance', () => {
  const { nodes: nodes100, edges: edges100 } = generateDAGData(100);
  const { nodes: nodes200, edges: edges200 } = generateDAGData(200);

  bench('Calculate edge positions (100 edges)', () => {
    edges100.forEach(edge => {
      const source = nodes100.find(n => n.id === edge.source);
      const target = nodes100.find(n => n.id === edge.target);
      
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
      }
    });
  });

  bench('Calculate edge positions (200 edges)', () => {
    edges200.forEach(edge => {
      const source = nodes200.find(n => n.id === edge.source);
      const target = nodes200.find(n => n.id === edge.target);
      
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
      }
    });
  });
});
