/**
 * Priority Queue for Schedule Tasks
 * @description 优先队列 - 基于最小堆实现，用于高效管理调度任务
 * @author DailyUse Team
 * @date 2025-01-10
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('PriorityQueue');

/**
 * 优先队列节点
 */
export interface PriorityQueueNode<T> {
  value: T;
  priority: number; // 时间戳（毫秒），越小优先级越高
}

/**
 * 优先队列（最小堆）
 *
 * 特性：
 * - O(log n) 插入
 * - O(1) 查看最高优先级
 * - O(log n) 删除最高优先级
 * - 自动按时间排序
 *
 * 用途：
 * - 管理待执行的调度任务
 * - 快速找到最早需要执行的任务
 */
export class PriorityQueue<T> {
  private heap: PriorityQueueNode<T>[] = [];

  constructor() {
    logger.debug('优先队列已创建');
  }

  /**
   * 获取队列大小
   */
  get size(): number {
    return this.heap.length;
  }

  /**
   * 检查队列是否为空
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * 插入元素
   *
   * @param value 元素值
   * @param priority 优先级（时间戳），越小越优先
   */
  enqueue(value: T, priority: number): void {
    const node: PriorityQueueNode<T> = { value, priority };
    this.heap.push(node);
    this.heapifyUp(this.heap.length - 1);

    logger.debug('元素已入队', {
      queueSize: this.heap.length,
      priority: new Date(priority).toISOString(),
      priorityTimestamp: priority,
    });
  }

  /**
   * 移除并返回最高优先级元素
   */
  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    if (this.heap.length === 1) {
      const node = this.heap.pop();
      logger.debug('元素已出队（最后一个）', {
        queueSize: 0,
      });
      return node?.value;
    }

    const root = this.heap[0];
    const last = this.heap.pop()!;
    this.heap[0] = last;
    this.heapifyDown(0);

    logger.debug('元素已出队', {
      queueSize: this.heap.length,
      nextPriority: this.peek()?.priority
        ? new Date(this.peek()!.priority).toISOString()
        : undefined,
    });

    return root.value;
  }

  /**
   * 查看最高优先级元素（不移除）
   */
  peek(): PriorityQueueNode<T> | undefined {
    return this.heap[0];
  }

  /**
   * 移除指定元素
   *
   * @param predicate 查找函数
   * @returns 是否成功移除
   */
  remove(predicate: (value: T) => boolean): boolean {
    const index = this.heap.findIndex((node) => predicate(node.value));

    if (index === -1) {
      return false;
    }

    // 如果是最后一个元素，直接删除
    if (index === this.heap.length - 1) {
      this.heap.pop();
      logger.debug('元素已移除（最后一个）', { queueSize: this.heap.length });
      return true;
    }

    // 用最后一个元素替换要删除的元素
    const last = this.heap.pop()!;
    this.heap[index] = last;

    // 重新堆化
    this.heapifyDown(index);
    this.heapifyUp(index);

    logger.debug('元素已移除', { queueSize: this.heap.length });
    return true;
  }

  /**
   * 清空队列
   */
  clear(): void {
    const previousSize = this.heap.length;
    this.heap = [];
    logger.debug('队列已清空', { previousSize });
  }

  /**
   * 获取所有元素（仅用于调试）
   */
  toArray(): T[] {
    return this.heap.map((node) => node.value);
  }

  /**
   * 获取所有节点（包含优先级信息）
   */
  toNodeArray(): PriorityQueueNode<T>[] {
    return [...this.heap];
  }

  // ========== 私有方法：堆操作 ==========

  /**
   * 向上堆化（插入后）
   */
  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (this.heap[index].priority >= this.heap[parentIndex].priority) {
        break;
      }

      // 交换
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  /**
   * 向下堆化（删除后）
   */
  private heapifyDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (
        leftChild < this.heap.length &&
        this.heap[leftChild].priority < this.heap[smallest].priority
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < this.heap.length &&
        this.heap[rightChild].priority < this.heap[smallest].priority
      ) {
        smallest = rightChild;
      }

      if (smallest === index) {
        break;
      }

      // 交换
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }

  /**
   * 验证堆的有效性（仅用于测试）
   */
  public validate(): boolean {
    for (let i = 0; i < this.heap.length; i++) {
      const leftChild = 2 * i + 1;
      const rightChild = 2 * i + 2;

      if (leftChild < this.heap.length && this.heap[i].priority > this.heap[leftChild].priority) {
        logger.error('堆验证失败：父节点大于左子节点', {
          parentIndex: i,
          leftChildIndex: leftChild,
          parentPriority: this.heap[i].priority,
          leftChildPriority: this.heap[leftChild].priority,
        });
        return false;
      }

      if (rightChild < this.heap.length && this.heap[i].priority > this.heap[rightChild].priority) {
        logger.error('堆验证失败：父节点大于右子节点', {
          parentIndex: i,
          rightChildIndex: rightChild,
          parentPriority: this.heap[i].priority,
          rightChildPriority: this.heap[rightChild].priority,
        });
        return false;
      }
    }

    return true;
  }
}
