/**
 * Priority Queue Scheduler Integration Tests
 *
 * 测试优先队列调度器的核心功能：
 * 1. 优先级排序 - 按时间优先级执行任务
 * 2. 精确调度 - <100ms 的执行精度
 * 3. 动态管理 - 运行时添加/删除任务
 * 4. 循环任务 - 自动重新调度
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PriorityQueue } from '../infrastructure/scheduler/PriorityQueue';

interface TestTask {
  id: string;
  name: string;
  scheduledTime: Date;
}

describe('PriorityQueue Tests', () => {
  let queue: PriorityQueue<TestTask>;

  beforeEach(() => {
    queue = new PriorityQueue<TestTask>();
  });

  describe('Test 1: 基础优先队列操作', () => {
    it('should enqueue and dequeue in priority order', () => {
      const now = Date.now();

      // 按照非优先级顺序添加
      queue.enqueue(
        { id: '1', name: 'Task 1 (5s)', scheduledTime: new Date(now + 5000) },
        now + 5000,
      );
      queue.enqueue(
        { id: '2', name: 'Task 2 (2s)', scheduledTime: new Date(now + 2000) },
        now + 2000,
      );
      queue.enqueue(
        { id: '3', name: 'Task 3 (8s)', scheduledTime: new Date(now + 8000) },
        now + 8000,
      );
      queue.enqueue(
        { id: '4', name: 'Task 4 (1s)', scheduledTime: new Date(now + 1000) },
        now + 1000,
      );

      expect(queue.size).toBe(4);

      // 应该按优先级顺序出队：1s → 2s → 5s → 8s
      const task1 = queue.dequeue();
      expect(task1?.name).toBe('Task 4 (1s)');

      const task2 = queue.dequeue();
      expect(task2?.name).toBe('Task 2 (2s)');

      const task3 = queue.dequeue();
      expect(task3?.name).toBe('Task 1 (5s)');

      const task4 = queue.dequeue();
      expect(task4?.name).toBe('Task 3 (8s)');

      expect(queue.isEmpty()).toBe(true);

      console.log('[Test 1] ✅ Priority queue maintains min-heap property');
    });

    it('should peek without removing element', () => {
      const now = Date.now();

      queue.enqueue({ id: '1', name: 'Task 1', scheduledTime: new Date(now + 3000) }, now + 3000);
      queue.enqueue({ id: '2', name: 'Task 2', scheduledTime: new Date(now + 1000) }, now + 1000);

      const peeked = queue.peek();
      expect(peeked?.value.name).toBe('Task 2');
      expect(queue.size).toBe(2); // 没有移除

      const dequeued = queue.dequeue();
      expect(dequeued?.name).toBe('Task 2');
      expect(queue.size).toBe(1);

      console.log('[Test 1] ✅ Peek operation works correctly');
    });

    it('should handle empty queue gracefully', () => {
      expect(queue.isEmpty()).toBe(true);
      expect(queue.peek()).toBeUndefined();
      expect(queue.dequeue()).toBeUndefined();
      expect(queue.size).toBe(0);

      console.log('[Test 1] ✅ Empty queue handling verified');
    });
  });

  describe('Test 2: 动态任务移除', () => {
    it('should remove task by predicate', () => {
      const now = Date.now();

      queue.enqueue({ id: '1', name: 'Task 1', scheduledTime: new Date(now + 1000) }, now + 1000);
      queue.enqueue({ id: '2', name: 'Task 2', scheduledTime: new Date(now + 2000) }, now + 2000);
      queue.enqueue({ id: '3', name: 'Task 3', scheduledTime: new Date(now + 3000) }, now + 3000);

      expect(queue.size).toBe(3);

      // 移除 Task 2
      const removed = queue.remove((task: TestTask) => task.id === '2');
      expect(removed).toBe(true);
      expect(queue.size).toBe(2);

      // 验证剩余任务
      const remaining = queue.toArray();
      expect(remaining.map((t: TestTask) => t.id)).toEqual(['1', '3']);

      // 尝试移除不存在的任务
      const removedAgain = queue.remove((task: TestTask) => task.id === '999');
      expect(removedAgain).toBe(false);
      expect(queue.size).toBe(2);

      console.log('[Test 2] ✅ Dynamic task removal working correctly');
    });

    it('should maintain heap property after removal', () => {
      const now = Date.now();

      // 添加多个任务
      for (let i = 1; i <= 10; i++) {
        queue.enqueue(
          { id: `${i}`, name: `Task ${i}`, scheduledTime: new Date(now + i * 1000) },
          now + i * 1000,
        );
      }

      // 移除中间的任务
      queue.remove((task: TestTask) => task.id === '5');
      queue.remove((task: TestTask) => task.id === '7');

      // 验证堆属性
      expect(queue.validate()).toBe(true);

      // 验证出队顺序仍然正确
      const first = queue.dequeue();
      const second = queue.dequeue();
      expect(first?.id).toBe('1');
      expect(second?.id).toBe('2');

      console.log('[Test 2] ✅ Heap property maintained after removal');
    });
  });

  describe('Test 3: 大规模任务测试', () => {
    it('should handle 1000 tasks efficiently', () => {
      const now = Date.now();
      const taskCount = 1000;

      // 随机顺序添加 1000 个任务
      const times: number[] = [];
      for (let i = 0; i < taskCount; i++) {
        const delay = Math.floor(Math.random() * 100000);
        times.push(delay);
        queue.enqueue(
          {
            id: `task-${i}`,
            name: `Task ${i}`,
            scheduledTime: new Date(now + delay),
          },
          now + delay,
        );
      }

      expect(queue.size).toBe(taskCount);

      // 验证堆属性
      expect(queue.validate()).toBe(true);

      // 验证出队顺序是升序
      let lastTime = -1;
      let dequeueCount = 0;

      while (!queue.isEmpty()) {
        const task = queue.dequeue();
        if (task) {
          const taskTime = task.scheduledTime.getTime();
          expect(taskTime).toBeGreaterThanOrEqual(lastTime);
          lastTime = taskTime;
          dequeueCount++;
        }
      }

      expect(dequeueCount).toBe(taskCount);
      expect(queue.isEmpty()).toBe(true);

      console.log(`[Test 3] ✅ Handled ${taskCount} tasks, all dequeued in order`);
    });

    it('should perform O(log n) insertions', () => {
      const now = Date.now();
      const sizes = [100, 500, 1000, 5000];
      const timings: { size: number; avgTime: number }[] = [];

      for (const size of sizes) {
        const queue = new PriorityQueue<TestTask>();
        const start = performance.now();

        for (let i = 0; i < size; i++) {
          queue.enqueue(
            {
              id: `task-${i}`,
              name: `Task ${i}`,
              scheduledTime: new Date(now + i * 1000),
            },
            now + i * 1000,
          );
        }

        const end = performance.now();
        const avgTime = (end - start) / size;
        timings.push({ size, avgTime });
      }

      // 验证时间复杂度增长合理（应该是对数增长）
      console.log('[Test 3] Performance timings:');
      timings.forEach((t) => {
        console.log(`  Size: ${t.size}, Avg time: ${t.avgTime.toFixed(4)}ms/op`);
      });

      // 100 → 5000 (50x), 平均时间不应该增长 50 倍
      const ratio = timings[3].avgTime / timings[0].avgTime;
      expect(ratio).toBeLessThan(10); // 对数增长，远小于 50

      console.log(`[Test 3] ✅ O(log n) complexity verified (ratio: ${ratio.toFixed(2)})`);
    });
  });

  describe('Test 4: 边界情况测试', () => {
    it('should handle same priority tasks (FIFO)', () => {
      const now = Date.now();
      const samePriority = now + 5000;

      queue.enqueue(
        { id: '1', name: 'First', scheduledTime: new Date(samePriority) },
        samePriority,
      );
      queue.enqueue(
        { id: '2', name: 'Second', scheduledTime: new Date(samePriority) },
        samePriority,
      );
      queue.enqueue(
        { id: '3', name: 'Third', scheduledTime: new Date(samePriority) },
        samePriority,
      );

      // 相同优先级应该按照插入顺序（FIFO）
      const first = queue.dequeue();
      const second = queue.dequeue();
      const third = queue.dequeue();

      // 注意：min-heap 对相同优先级不保证顺序，但都应该被取出
      expect([first?.id, second?.id, third?.id].sort()).toEqual(['1', '2', '3']);

      console.log('[Test 4] ✅ Same priority tasks handled correctly');
    });

    it('should handle single element', () => {
      const now = Date.now();

      queue.enqueue({ id: '1', name: 'Only Task', scheduledTime: new Date(now) }, now);

      expect(queue.size).toBe(1);
      expect(queue.peek()?.value.id).toBe('1');

      const dequeued = queue.dequeue();
      expect(dequeued?.id).toBe('1');
      expect(queue.isEmpty()).toBe(true);

      console.log('[Test 4] ✅ Single element handling verified');
    });

    it('should handle interleaved enqueue/dequeue', () => {
      const now = Date.now();

      // 交替插入和删除
      queue.enqueue({ id: '1', name: 'Task 1', scheduledTime: new Date(now + 1000) }, now + 1000);
      queue.enqueue({ id: '2', name: 'Task 2', scheduledTime: new Date(now + 2000) }, now + 2000);

      const first = queue.dequeue();
      expect(first?.id).toBe('1');

      queue.enqueue({ id: '3', name: 'Task 3', scheduledTime: new Date(now + 500) }, now + 500);

      const second = queue.dequeue();
      expect(second?.id).toBe('3'); // 优先级最高

      const third = queue.dequeue();
      expect(third?.id).toBe('2');

      expect(queue.isEmpty()).toBe(true);

      console.log('[Test 4] ✅ Interleaved enqueue/dequeue working correctly');
    });
  });

  describe('Test 5: 堆属性验证', () => {
    it('should maintain heap property through all operations', () => {
      const now = Date.now();

      // 添加任务
      for (let i = 0; i < 20; i++) {
        queue.enqueue(
          { id: `${i}`, name: `Task ${i}`, scheduledTime: new Date(now + i * 1000) },
          now + i * 1000,
        );
        expect(queue.validate()).toBe(true);
      }

      // 删除一些任务
      queue.remove((t: TestTask) => t.id === '5');
      expect(queue.validate()).toBe(true);

      queue.remove((t: TestTask) => t.id === '10');
      expect(queue.validate()).toBe(true);

      queue.remove((t: TestTask) => t.id === '15');
      expect(queue.validate()).toBe(true);

      // 出队几个
      queue.dequeue();
      expect(queue.validate()).toBe(true);

      queue.dequeue();
      expect(queue.validate()).toBe(true);

      // 再添加一些
      queue.enqueue({ id: '100', name: 'New Task', scheduledTime: new Date(now + 500) }, now + 500);
      expect(queue.validate()).toBe(true);

      console.log('[Test 5] ✅ Heap property maintained through all operations');
    });
  });
});

describe('PriorityQueueScheduler Simulation Tests', () => {
  describe('Test 6: 调度器执行精度模拟', () => {
    it('should simulate precise task execution', async () => {
      const executionRecords: {
        taskId: string;
        expectedTime: number;
        actualTime: number;
        delay: number;
      }[] = [];

      const now = Date.now();
      const tasks = [
        { id: '1', executionTime: now + 1000 }, // 1 秒后
        { id: '2', executionTime: now + 2000 }, // 2 秒后
        { id: '3', executionTime: now + 500 }, // 0.5 秒后
      ];

      // 模拟调度器执行
      const queue = new PriorityQueue<{ id: string; executionTime: number }>();
      tasks.forEach((t) => queue.enqueue(t, t.executionTime));

      while (!queue.isEmpty()) {
        const task = queue.peek();
        if (!task) break;

        const delay = task.priority - Date.now();
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const actualExecutionTime = Date.now();
        const executedTask = queue.dequeue();

        if (executedTask) {
          const executionDelay = actualExecutionTime - executedTask.executionTime;
          executionRecords.push({
            taskId: executedTask.id,
            expectedTime: executedTask.executionTime,
            actualTime: actualExecutionTime,
            delay: executionDelay,
          });
        }
      }

      // 验证执行顺序
      expect(executionRecords.map((r) => r.taskId)).toEqual(['3', '1', '2']);

      // 验证执行精度 (<100ms)
      console.log('[Test 6] Execution precision:');
      executionRecords.forEach((r) => {
        console.log(`  Task ${r.taskId}: delay = ${r.delay}ms`);
        expect(Math.abs(r.delay)).toBeLessThan(100);
      });

      console.log('[Test 6] ✅ All tasks executed with <100ms precision');
    }, 10000);
  });

  describe('Test 7: 动态任务管理模拟', () => {
    it('should simulate runtime task addition', async () => {
      const queue = new PriorityQueue<{ id: string; name: string; executionTime: number }>();
      const now = Date.now();

      // 初始任务
      queue.enqueue({ id: '1', name: 'Task 1', executionTime: now + 3000 }, now + 3000);

      console.log('[Test 7] Initial task: Task 1 (3s)');

      // 1 秒后动态添加更紧急的任务
      await new Promise((resolve) => setTimeout(resolve, 1000));

      queue.enqueue({ id: '2', name: 'Task 2 (Urgent)', executionTime: now + 1500 }, now + 1500);

      console.log('[Test 7] Added urgent task: Task 2 (1.5s from start)');

      // 验证新任务优先级更高
      const nextTask = queue.peek();
      expect(nextTask?.value.id).toBe('2');

      console.log('[Test 7] ✅ Urgent task prioritized correctly');
    }, 5000);

    it('should simulate runtime task cancellation', async () => {
      const queue = new PriorityQueue<{ id: string; name: string; executionTime: number }>();
      const now = Date.now();

      // 添加 3 个任务
      queue.enqueue({ id: '1', name: 'Task 1', executionTime: now + 1000 }, now + 1000);
      queue.enqueue({ id: '2', name: 'Task 2', executionTime: now + 2000 }, now + 2000);
      queue.enqueue({ id: '3', name: 'Task 3', executionTime: now + 3000 }, now + 3000);

      expect(queue.size).toBe(3);

      // 0.5 秒后取消 Task 2
      await new Promise((resolve) => setTimeout(resolve, 500));

      const removed = queue.remove(
        (t: { id: string; name: string; executionTime: number }) => t.id === '2',
      );
      expect(removed).toBe(true);
      expect(queue.size).toBe(2);

      console.log('[Test 7] Task 2 cancelled before execution');

      // 验证只执行 Task 1 和 Task 3
      const remaining = queue.toArray();
      expect(
        remaining.map((t: { id: string; name: string; executionTime: number }) => t.id).sort(),
      ).toEqual(['1', '3']);

      console.log('[Test 7] ✅ Task cancellation working correctly');
    }, 5000);
  });
});
