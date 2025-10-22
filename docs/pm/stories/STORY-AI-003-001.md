# STORY-019: AI-Assisted Weight Allocation

**Epic**: AI Features  
**Sprint**: Sprint 3  
**Story Points**: 3 SP  
**Priority**: P0 (Strategic)  
**Status**: 📋 Ready  
**Assignee**: Development Team  
**Dependencies**: STORY-003 (Weight Suggestion Research)

---

## 📖 User Story

**As a** goal creator  
**I want** AI to suggest optimal weight distributions for my Key Results  
**So that** I can quickly allocate weights based on strategic priorities without manual calculation

---

## 🎯 Acceptance Criteria

1. ✅ **AI Recommendation Engine**
   - [ ] Suggest 3 weight distribution strategies: Balanced, Focused, Stepped
   - [ ] Consider KR title keywords for priority inference
   - [ ] Ensure total weight = 100%
   - [ ] Provide explanation for each strategy
   - [ ] Response time <2s

2. ✅ **User Interface**
   - [ ] "AI Suggest" button in weight allocation panel
   - [ ] Display 3 strategy cards with visualizations
   - [ ] One-click apply strategy
   - [ ] Manual adjustment after applying
   - [ ] Undo/redo support

3. ✅ **Recommendation Quality**
   - [ ] User acceptance rate ≥70%
   - [ ] Applied recommendations without modification ≥40%
   - [ ] Average adjustment after apply <10% per KR

4. ✅ **Learning & Improvement**
   - [ ] Track user modifications to recommendations
   - [ ] Store successful patterns for future improvements
   - [ ] Provide feedback mechanism ("Was this helpful?")

5. ✅ **Fallback & Error Handling**
   - [ ] Graceful degradation if AI service unavailable
   - [ ] Show default balanced strategy as fallback
   - [ ] Clear error messages

---

## 🛠️ Technical Approach

### Phase 1: Rule-Based Engine (Quick Win)

**Implementation**: Keyword-based priority scoring

```typescript
interface WeightStrategy {
  name: 'balanced' | 'focused' | 'stepped';
  label: string;
  description: string;
  weights: number[];
  reasoning: string;
}

class WeightRecommendationService {
  /**
   * Analyze KR titles and suggest weights
   */
  recommendWeights(keyResults: KeyResult[]): WeightStrategy[] {
    const priorities = this.calculatePriorities(keyResults);
    
    return [
      this.balancedStrategy(keyResults.length),
      this.focusedStrategy(priorities),
      this.steppedStrategy(priorities),
    ];
  }

  private calculatePriorities(krs: KeyResult[]): number[] {
    return krs.map(kr => {
      let score = 50; // Base score
      
      // High priority keywords
      if (/critical|urgent|important|key|core/i.test(kr.title)) {
        score += 20;
      }
      
      // Revenue/customer keywords
      if (/revenue|sales|customer|user/i.test(kr.title)) {
        score += 15;
      }
      
      // Efficiency keywords
      if (/reduce|improve|optimize|automate/i.test(kr.title)) {
        score += 10;
      }
      
      // Innovation keywords
      if (/new|innovation|experiment|pilot/i.test(kr.title)) {
        score += 5;
      }
      
      return Math.min(100, score);
    });
  }

  private balancedStrategy(count: number): WeightStrategy {
    const weight = Math.floor(100 / count);
    const remainder = 100 - (weight * count);
    
    return {
      name: 'balanced',
      label: '均衡策略',
      description: '所有 KR 权重相等，适合目标优先级相近的场景',
      weights: Array(count).fill(weight).map((w, i) => 
        i === 0 ? w + remainder : w
      ),
      reasoning: '各 KR 同等重要，平均分配权重',
    };
  }

  private focusedStrategy(priorities: number[]): WeightStrategy {
    // Allocate more weight to high-priority KRs
    const total = priorities.reduce((sum, p) => sum + p, 0);
    const weights = priorities.map(p => Math.round((p / total) * 100));
    
    // Adjust to sum to 100
    const sum = weights.reduce((a, b) => a + b, 0);
    weights[0] += (100 - sum);
    
    return {
      name: 'focused',
      label: '聚焦策略',
      description: '根据关键词分析，重点关注高优先级 KR',
      weights,
      reasoning: '基于标题关键词识别核心 KR，分配更多权重',
    };
  }

  private steppedStrategy(priorities: number[]): WeightStrategy {
    // Sort by priority and create stepped distribution
    const sorted = [...priorities].sort((a, b) => b - a);
    const step = Math.floor(100 / (priorities.length * (priorities.length + 1) / 2));
    
    const weights = sorted.map((_, i) => 
      (priorities.length - i) * step
    );
    
    // Adjust to sum to 100
    const sum = weights.reduce((a, b) => a + b, 0);
    weights[0] += (100 - sum);
    
    // Map back to original order
    const orderedWeights = priorities.map(p => {
      const index = sorted.indexOf(p);
      return weights[index];
    });
    
    return {
      name: 'stepped',
      label: '阶梯策略',
      description: '梯度分配权重，适合明确优先级顺序的场景',
      weights: orderedWeights,
      reasoning: '按优先级创建阶梯式权重分布',
    };
  }
}
```

### Phase 2: OpenAI Integration (Future Enhancement)

```typescript
class AIWeightRecommendationService {
  async recommendWeights(
    goal: Goal,
    keyResults: KeyResult[]
  ): Promise<WeightStrategy[]> {
    const prompt = this.buildPrompt(goal, keyResults);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an OKR expert helping users allocate weights to Key Results.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });
    
    return this.parseResponse(response);
  }

  private buildPrompt(goal: Goal, krs: KeyResult[]): string {
    return `
Goal: ${goal.title}
Description: ${goal.description}

Key Results:
${krs.map((kr, i) => `${i + 1}. ${kr.title}`).join('\n')}

Suggest 3 weight distribution strategies (Balanced, Focused, Stepped) 
considering:
- Strategic importance based on goal description
- Keyword analysis in KR titles
- Typical OKR best practices
- Total weight must equal 100%

Format response as JSON with strategies array.
    `;
  }
}
```

---

## 📝 Implementation Plan

### Phase 1: Rule-Based Engine (Days 1-2, 2 SP)

**Day 1: Core Service**
- [ ] Create WeightRecommendationService.ts
- [ ] Implement keyword scoring algorithm
- [ ] Implement 3 strategy generators
- [ ] Write unit tests (>90% coverage)
- [ ] Create mock data for testing

**Day 2: UI Integration**
- [ ] Create WeightSuggestionPanel.vue component
- [ ] Design 3 strategy cards with visualizations
- [ ] Integrate into Goal creation wizard
- [ ] Add "Apply" and "Customize" actions
- [ ] Implement undo/redo

### Phase 2: Feedback & Analytics (Day 3, 1 SP)

- [ ] Track recommendation acceptance rate
- [ ] Track modifications after applying
- [ ] Create feedback dialog
- [ ] Store user feedback in database
- [ ] Create analytics dashboard

---

## 🎨 UI Design

### Suggestion Panel

```vue
<template>
  <v-card class="weight-suggestion-panel">
    <v-card-title>
      <v-icon>mdi-robot</v-icon>
      AI 权重建议
    </v-card-title>
    
    <v-card-subtitle>
      基于 KR 内容分析，推荐以下 3 种权重分配策略
    </v-card-subtitle>
    
    <v-card-text>
      <v-row>
        <v-col
          v-for="strategy in strategies"
          :key="strategy.name"
          cols="12"
          md="4"
        >
          <v-card
            class="strategy-card"
            :class="{ selected: selectedStrategy === strategy.name }"
            @click="selectedStrategy = strategy.name"
          >
            <v-card-title>{{ strategy.label }}</v-card-title>
            
            <!-- Visualization: Bar chart -->
            <div class="weight-bars">
              <div
                v-for="(weight, i) in strategy.weights"
                :key="i"
                class="bar"
                :style="{ width: `${weight}%` }"
              >
                {{ weight }}%
              </div>
            </div>
            
            <v-card-text>
              <p class="text-caption">{{ strategy.description }}</p>
              <p class="text-caption text-medium-emphasis">
                {{ strategy.reasoning }}
              </p>
            </v-card-text>
            
            <v-card-actions>
              <v-btn
                block
                color="primary"
                variant="tonal"
                @click="applyStrategy(strategy)"
              >
                应用此策略
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="$emit('close')">取消</v-btn>
      <v-btn
        color="primary"
        :disabled="!selectedStrategy"
        @click="confirmSelection"
      >
        确认选择
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('WeightRecommendationService', () => {
  it('should generate balanced strategy', () => {
    const krs = [
      { title: 'KR 1' },
      { title: 'KR 2' },
      { title: 'KR 3' },
    ];
    
    const strategies = service.recommendWeights(krs);
    const balanced = strategies.find(s => s.name === 'balanced');
    
    expect(balanced.weights).toEqual([34, 33, 33]);
    expect(balanced.weights.reduce((a, b) => a + b)).toBe(100);
  });
  
  it('should prioritize KRs with important keywords', () => {
    const krs = [
      { title: 'Critical revenue milestone' },
      { title: 'Regular task' },
      { title: 'Minor improvement' },
    ];
    
    const strategies = service.recommendWeights(krs);
    const focused = strategies.find(s => s.name === 'focused');
    
    expect(focused.weights[0]).toBeGreaterThan(focused.weights[1]);
    expect(focused.weights[1]).toBeGreaterThan(focused.weights[2]);
  });
});
```

### E2E Tests

```typescript
test('should apply AI weight suggestion', async ({ page }) => {
  await page.goto('/goals/create');
  
  // Add 3 KRs
  await page.fill('[data-testid="kr-0-title"]', 'Increase revenue by 20%');
  await page.click('[data-testid="add-kr"]');
  await page.fill('[data-testid="kr-1-title"]', 'Improve customer satisfaction');
  await page.click('[data-testid="add-kr"]');
  await page.fill('[data-testid="kr-2-title"]', 'Launch new feature');
  
  // Click AI Suggest
  await page.click('[data-testid="ai-suggest-weights"]');
  
  // Select focused strategy
  await page.click('text=聚焦策略');
  await page.click('text=应用此策略');
  
  // Verify weights applied
  expect(await page.inputValue('[data-testid="kr-0-weight"]')).toBe('50');
  expect(await page.inputValue('[data-testid="kr-1-weight"]')).toBe('30');
  expect(await page.inputValue('[data-testid="kr-2-weight"]')).toBe('20');
});
```

---

## 📊 Success Metrics

- [ ] Recommendation acceptance rate ≥70%
- [ ] Applied without modification ≥40%
- [ ] Average recommendation usage: 60% of new goals
- [ ] User satisfaction (feedback): ≥4.5/5
- [ ] Response time <2s for all recommendations

---

## 📅 Timeline

- **Start Date**: 2024-10-24
- **Target Completion**: 2024-10-26 (3 days)
- **Status**: 📋 Ready after STORY-015

---

## 💡 Future Enhancements

- Machine learning model trained on user behavior
- Context-aware recommendations (team, industry, role)
- Multi-language support
- Integration with company OKR frameworks
- Recommendation explanation with visual reasoning
