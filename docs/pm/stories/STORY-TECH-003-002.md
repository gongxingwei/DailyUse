# STORY-013: Fix Domain DTO Tests

**Epic**: Technical Debt  
**Sprint**: Sprint 3  
**Story Points**: 2 SP  
**Priority**: P1  
**Status**: 📋 Ready  

---

## 📖 User Story

**As a** developer  
**I want** all domain DTO tests to pass  
**So that** domain layer data transformations are validated

---

## 🎯 Acceptance Criteria

- [ ] All 5 EditorModule DTO tests pass (toPersistenceDTO methods)
- [ ] GoalRecord.isGoalRecord type check fixed
- [ ] Test coverage for DTO transformations ≥90%
- [ ] No console warnings during test runs

---

## 🛠️ Technical Approach

Fix the following failing tests:
1. `EditorTab.toPersistenceDTO` - Check nullable fields
2. `EditorGroup.toPersistenceDTO` - Fix nested DTO conversion
3. `EditorSession.toPersistenceDTO` - Handle undefined state
4. `EditorWorkspace.toPersistenceDTO` - Array mapping issue
5. `EditorWorkspace.updateSettings` - Deep merge logic
6. `GoalRecord.isGoalRecord` - Type guard implementation

---

## 📝 Subtasks

- [ ] Analyze failing test cases (0.5 SP)
- [ ] Fix DTO transformation logic (1 SP)
- [ ] Add missing test cases (0.5 SP)
- [ ] Verify all tests pass

---

## 📅 Timeline

- **Duration**: 1 day
- **Target Completion**: 2024-10-27
