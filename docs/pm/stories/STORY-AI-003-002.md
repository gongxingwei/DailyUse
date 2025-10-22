# STORY-020: Smart Goal Template Recommendations

**Epic**: AI Features  
**Sprint**: Sprint 3  
**Story Points**: 2 SP  
**Priority**: P1  
**Status**: 📋 Ready  

---

## 📖 User Story

**As a** new user  
**I want** AI to recommend goal templates based on my role/industry  
**So that** I can quickly start with proven OKR structures

---

## 🎯 Acceptance Criteria

- [ ] Template library (10+ templates)
- [ ] Role-based filtering (PM, Engineer, Sales, Marketing)
- [ ] Industry filtering (SaaS, E-commerce, Healthcare)
- [ ] Preview template structure
- [ ] One-click apply with customization

---

## 🛠️ Technical Approach

### Template Structure

```typescript
interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: 'product' | 'engineering' | 'sales' | 'marketing';
  roles: string[];
  industries: string[];
  keyResults: {
    title: string;
    suggestedWeight: number;
    metrics: string[];
  }[];
}
```

### Built-in Templates

1. **Product Launch OKR**
   - Achieve X users in first month (40%)
   - NPS score ≥8/10 (30%)
   - Feature adoption rate ≥60% (30%)

2. **Engineering Velocity OKR**
   - Reduce bug count by 30% (35%)
   - Deploy frequency: 2x per week (35%)
   - Code coverage ≥85% (30%)

3. **Sales Growth OKR**
   - Increase MRR by 25% (50%)
   - New customers: +50 (30%)
   - Churn rate <5% (20%)

---

## 📝 Subtasks

- [ ] Create 10 goal templates (0.5 SP)
- [ ] Template recommendation engine (0.5 SP)
- [ ] Template browser UI (0.5 SP)
- [ ] Apply & customize flow (0.5 SP)

---

## 📅 Timeline

- **Duration**: 1.5 days
- **Target**: 2024-10-30
