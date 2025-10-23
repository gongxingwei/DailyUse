# Performance Benchmarks (STORY-014)

## 📊 Overview

This document describes the performance benchmarking system for DailyUse application. We use Vitest's built-in benchmarking capabilities to track performance metrics and prevent regressions.

## 🎯 Performance Targets

| Category | Metric | Target | Description |
|----------|--------|--------|-------------|
| DAG Rendering | Build time | < 500ms | Build DAG nodes for 100 goals |
| Goal CRUD | Operation time | < 100ms | Average CRUD operation (Create/Read/Update/Delete) |
| Weight Calculation | Computation | < 50ms | Calculate weighted progress for 10 KRs |
| Rule Evaluation | Evaluation time | < 10ms | Single goal rule evaluation |
| JSON Serialization | Serialize/Deserialize | < 20ms | Process 100 goals |
| Array Operations | Filter/Map/Sort | < 10ms | Process 100 items |

## 🚀 Quick Start

### Run Benchmarks

```bash
# Run all benchmarks
pnpm bench

# Run benchmarks in watch mode
pnpm bench:watch

# Run specific benchmark file
pnpm bench performance.bench.ts
```

### Generate Reports

Reports are automatically generated in `benchmarks/results/`:
- `BENCHMARK-REPORT.md` - Markdown report
- `benchmark-report.html` - HTML report (open in browser)
- `benchmark-results.json` - Raw JSON data

## 📁 File Structure

```
apps/web/
├── src/
│   └── benchmarks/
│       ├── performance.bench.ts      # Main benchmark suite
│       └── reportGenerator.ts        # Report generation utilities
├── vitest.bench.config.ts           # Benchmark configuration
└── benchmarks/
    └── results/                     # Generated reports
        ├── BENCHMARK-REPORT.md
        ├── benchmark-report.html
        └── benchmark-results.json
```

## 📝 Benchmark Suites

### 1. Goal CRUD Operations
Tests the performance of basic goal operations:
- Create Goal
- Read Goal
- Update Goal
- Delete Goal

**Target**: < 100ms per operation

### 2. Weight Calculations
Tests various weight-related computations:
- Calculate Total Weight
- Calculate Average Progress
- Calculate Weighted Progress
- Validate Weight Sum

**Target**: < 50ms per calculation

### 3. Rule Evaluation
Tests the auto status rules system:
- Single Rule Evaluation
- Batch Evaluation (10 goals)
- Batch Evaluation (50 goals)
- All Rules Evaluation

**Target**: < 10ms per single evaluation

### 4. DAG Data Processing
Tests DAG visualization data preparation:
- Build nodes (10, 50, 100 goals)
- Build edges (100 relationships)

**Target**: < 500ms for 100 nodes

### 5. JSON Serialization
Tests data serialization performance:
- Serialize/Deserialize small (1 goal)
- Serialize/Deserialize medium (10 goals)
- Serialize/Deserialize large (100 goals)

**Target**: < 20ms for large datasets

### 6. Array Operations
Tests common array operations:
- Filter goals
- Map goals
- Sort goals
- Find goal

**Target**: < 10ms for 100 items

## 🔧 Adding New Benchmarks

### Step 1: Create Benchmark File

```typescript
// src/benchmarks/my-feature.bench.ts
import { bench, describe } from 'vitest';

describe('My Feature Performance', () => {
  bench('My Operation', () => {
    // Your code to benchmark
  }, {
    iterations: 100, // Number of iterations
  });
});
```

### Step 2: Update Configuration

Benchmarks are automatically discovered if they match the pattern `**/*.bench.ts`.

### Step 3: Run Benchmarks

```bash
pnpm bench
```

## 📊 Interpreting Results

### Time Metrics
- **time**: Average execution time per iteration (ms)
- **hz**: Operations per second
- **iterations**: Number of times the benchmark ran

### Pass/Fail Criteria
- ✅ **Pass**: Execution time is within target
- ❌ **Fail**: Execution time exceeds target

### Baseline Comparison
- 🚀 **Improved**: > 10% faster than baseline
- ✅ **Stable**: Within ±10% of baseline
- ⚠️ **Regression**: > 10% slower than baseline

## 🛡️ CI/CD Integration

### GitHub Actions (Planned)

```yaml
name: Performance Benchmarks

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm bench
      - name: Upload benchmark results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: apps/web/benchmarks/results/
```

### Performance Alerts

Set up alerts for performance regressions:
- > 10% slower: ⚠️ Warning comment on PR
- > 25% slower: ❌ Block PR merge
- > 50% slower: 🚨 Urgent notification

## 💡 Optimization Tips

### General Guidelines
1. **Profile First**: Use browser DevTools to identify bottlenecks
2. **Measure Twice**: Always benchmark before and after optimization
3. **Test Realistically**: Use production-like data sizes
4. **Watch for Regressions**: Monitor trends over time

### Common Optimizations

#### Array Operations
```typescript
// ❌ Slow: Multiple iterations
const active = goals.filter(g => g.status === 'ACTIVE');
const titles = active.map(g => g.title);

// ✅ Fast: Single iteration
const titles = goals
  .filter(g => g.status === 'ACTIVE')
  .map(g => g.title);
```

#### Object Cloning
```typescript
// ❌ Slow: JSON.parse(JSON.stringify)
const clone = JSON.parse(JSON.stringify(goal));

// ✅ Fast: Spread operator (shallow)
const clone = { ...goal };

// ✅ Fast: structuredClone (deep)
const clone = structuredClone(goal);
```

#### Memoization
```typescript
// ❌ Slow: Recalculate every time
const getProgress = () => {
  return keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length;
};

// ✅ Fast: Cache result
let cachedProgress: number | null = null;
const getProgress = () => {
  if (cachedProgress === null) {
    cachedProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length;
  }
  return cachedProgress;
};
```

## 📈 Historical Performance

### Baseline (2024-10-23)
- DAG Rendering (100 nodes): 45.2ms ✅
- Goal CRUD: 12.5ms ✅
- Rule Evaluation: 8.3ms ✅
- Weight Calculation: 5.1ms ✅

### Targets for Next Sprint
- Reduce DAG rendering to < 300ms
- Implement virtual scrolling for large lists
- Optimize rule evaluation for batch operations

## 🔗 Related Documentation

- [Vitest Benchmarking Guide](https://vitest.dev/guide/features.html#benchmarking)
- [Performance Optimization Guide](./PERFORMANCE-OPTIMIZATION.md)
- [CI/CD Pipeline Documentation](../../docs/CI-CD.md)

## 📝 Changelog

### 2024-10-23 (STORY-014)
- ✅ Initial benchmark suite implementation
- ✅ 6 benchmark categories added
- ✅ Report generation (Markdown/HTML/JSON)
- ✅ Performance targets defined
- ✅ Documentation created

---

**Maintained by**: DailyUse Development Team  
**Last Updated**: 2024-10-23
