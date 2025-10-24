# STORY-016: Multi-Goal Comparison View

**Epic**: Goal Management - DAG Enhancements  
**Sprint**: Sprint 3  
**Story Points**: 3 SP  
**Priority**: P1  
**Status**: 📋 Ready

---

## 📖 User Story

**As a** goal manager  
**I want** to view and compare 2-4 goals side-by-side  
**So that** I can analyze structure differences and identify patterns

---

## 🎯 Acceptance Criteria

- [ ] Select 2-4 goals for comparison
- [ ] Side-by-side DAG visualization
- [ ] Synchronized zoom/pan
- [ ] Comparison statistics panel
- [ ] Export comparison view

---

## 🛠️ Technical Approach

```vue
<template>
  <v-container fluid class="multi-goal-view">
    <v-row>
      <v-col v-for="goal in selectedGoals" :key="goal.uuid" :cols="12 / selectedGoals.length">
        <goal-dag-visualization
          :goal-id="goal.uuid"
          :sync-viewport="true"
          @viewport-change="syncOtherCharts"
        />
      </v-col>
    </v-row>

    <comparison-stats-panel :goals="selectedGoals" />
  </v-container>
</template>
```

---

## 📝 Subtasks

- [ ] Multi-goal selector (0.5 SP)
- [ ] Synchronized viewport (1 SP)
- [ ] Comparison statistics (1 SP)
- [ ] Export functionality (0.5 SP)

---

## 📅 Timeline

- **Duration**: 2 days
- **Target**: 2024-10-29
