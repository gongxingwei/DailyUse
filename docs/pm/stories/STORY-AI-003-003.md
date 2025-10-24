# STORY-021: Auto Goal Status Update Rules

**Epic**: AI Features  
**Sprint**: Sprint 3  
**Story Points**: 2 SP  
**Priority**: P2  
**Status**: 📋 Backlog

---

## 📖 User Story

**As a** goal manager  
**I want** automated rules to update goal status  
**So that** I don't have to manually track goal progress

---

## 🎯 Acceptance Criteria

- [ ] Define status update rules (e.g., "If all KRs >80% → On Track")
- [ ] Auto-update on KR progress change
- [ ] Override manual status if needed
- [ ] Notification on status change
- [ ] Rule editor UI

---

## 🛠️ Rules Engine

```typescript
interface StatusRule {
  id: string;
  name: string;
  condition: {
    type: 'all' | 'any';
    rules: {
      metric: 'progress' | 'deadline' | 'weight';
      operator: '>' | '<' | '=' | '>=';
      value: number;
    }[];
  };
  action: {
    status: GoalStatus;
    notify: boolean;
  };
}
```

**Example Rules**:

1. All KRs ≥80% → Status: "On Track"
2. Any KR <30% and deadline <7 days → Status: "At Risk"
3. All KRs 100% → Status: "Completed"

---

## 📝 Subtasks

- [ ] Rules engine (1 SP)
- [ ] Rule editor UI (0.5 SP)
- [ ] Auto-execution service (0.5 SP)

---

## 📅 Timeline

- **Duration**: 1.5 days
- **Priority**: P2 - Nice to have
