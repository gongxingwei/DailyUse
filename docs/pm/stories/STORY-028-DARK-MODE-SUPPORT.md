# STORY-028: Dark Mode Support

**Epic**: UX-004 (User Experience Enhancements)  
**Story Points**: 2 SP  
**Priority**: P2  
**Status**: Approved  
**Created**: 2024-10-24  
**Approved**: 2024-10-24  
**Sprint**: Sprint 4

---

## 📋 Story

**As a** user,  
**I want** to switch between light and dark themes,  
**so that** I can use the app comfortably in different lighting environments and reduce eye strain.

---

## ✅ Acceptance Criteria

### AC-1: Theme Modes Available
**Given** I am using the application  
**When** I access theme settings  
**Then** I should see three theme options:
- Light mode
- Dark mode  
- Auto mode (follows system preference)

### AC-2: Theme Switcher Component
**Given** I want to change the theme  
**When** I open the theme switcher  
**Then**
- I should see current theme highlighted
- I can select a different theme
- The change should apply immediately
- Selection should persist across sessions

### AC-3: Smooth Theme Transition
**Given** I switch between themes  
**When** the theme changes  
**Then**
- Transition should be smooth (< 300ms)
- No flash of unstyled content
- All UI components should update correctly

### AC-4: All Components Support Themes
**Given** I switch to dark/light mode  
**When** I navigate through the application  
**Then**
- All pages should respect the theme
- All components should have proper contrast
- Charts (ECharts) should update their theme
- Scrollbars should match the theme

### AC-5: LocalStorage Persistence
**Given** I select a theme preference  
**When** I close and reopen the application  
**Then** my theme preference should be remembered

### AC-6: System Preference (Auto Mode)
**Given** I select "Auto" theme mode  
**When** my system theme changes  
**Then** the application theme should automatically update to match

---

## 📝 Tasks / Subtasks

- [ ] **Task 1: Create Theme Management System** (AC: 1, 2, 5, 6)
  - [ ] Create `useTheme` composable in `apps/web/src/shared/composables/useTheme.ts`
    - [ ] Define `ThemeMode` type: `'light' | 'dark' | 'auto'`
    - [ ] Implement theme state management (reactive)
    - [ ] Implement `setTheme(mode: ThemeMode)` function
    - [ ] Implement `getCurrentTheme()` function
    - [ ] Add LocalStorage persistence logic
    - [ ] Add system preference detection (matchMedia API)
    - [ ] Add system preference change listener for auto mode
  - [ ] Write unit tests for `useTheme` composable
    - [ ] Test theme switching
    - [ ] Test LocalStorage save/load
    - [ ] Test auto mode with mocked system preferences

- [ ] **Task 2: Create Theme Switcher Component** (AC: 2, 3)
  - [ ] Create `ThemeSwitcher.vue` component in `apps/web/src/shared/components/`
    - [ ] Add three buttons/tabs for Light/Dark/Auto
    - [ ] Highlight current active theme
    - [ ] Implement smooth transition animation
    - [ ] Use Vuetify components (v-btn-toggle or v-select)
    - [ ] Add icons (mdi-white-balance-sunny, mdi-moon-waning-crescent, mdi-theme-light-dark)
  - [ ] Write component tests for ThemeSwitcher
    - [ ] Test theme selection
    - [ ] Test visual state updates

- [ ] **Task 3: Update Vuetify Theme Configuration** (AC: 3, 4)
  - [ ] Modify `apps/web/src/shared/vuetify/index.ts`
    - [ ] Ensure both light and dark themes are fully defined
    - [ ] Add CSS transition for smooth theme switching
    - [ ] Verify color contrast ratios meet WCAG AA standards
  - [ ] Update global CSS for theme transitions
    - [ ] Add `transition: background-color 0.3s, color 0.3s` to root elements
    - [ ] Update scrollbar styles for both themes

- [ ] **Task 4: Integrate Theme into ECharts** (AC: 4)
  - [ ] Update ECharts instances to respond to theme changes
    - [ ] Locate all ECharts usage (Goal DAG, Task DAG, Statistics charts)
    - [ ] Add theme prop to chart components
    - [ ] Implement chart theme update logic
    - [ ] Test chart re-rendering on theme change

- [ ] **Task 5: Add Theme Switcher to UI** (AC: 2)
  - [ ] Add ThemeSwitcher to main navigation/header
  - [ ] Add ThemeSwitcher to Settings page
  - [ ] Ensure consistent placement and behavior

- [ ] **Task 6: E2E Tests for Theme Feature** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Create `apps/web/e2e/theme.spec.ts`
    - [ ] Test switching to light mode
    - [ ] Test switching to dark mode
    - [ ] Test auto mode
    - [ ] Test LocalStorage persistence
    - [ ] Test all pages render correctly in both themes
    - [ ] Take screenshots in both themes for visual regression

---

## 👨‍💻 Dev Notes

### Previous Story Insights
- STORY-026 and 027 focused on UX improvements (Command Palette, Drag & Drop)
- Vuetify is already configured with light and dark themes
- Current default theme is `dark` (as seen in `apps/web/src/shared/vuetify/index.ts`)
- Project uses Material Design Icons (`@mdi/font`)

### Technical Context

#### 🎨 Theme System Architecture
[Source: Project structure analysis + Vuetify documentation]

**Current Vuetify Configuration**:
- Location: `apps/web/src/shared/vuetify/index.ts`
- Default theme: `dark`
- Both themes already defined with full color palettes
- Uses Material Design Icons (@mdi/font)

**Theme Colors Already Defined**:
```typescript
// Light Theme Colors
background: '#FFFFFF'
primary: '#1867C0'
secondary: '#5CBBF6'
// ... (full palette exists)

// Dark Theme Colors  
background: '#121212'
primary: '#2196F3'
secondary: '#424242'
// ... (full palette exists)
```

#### 🔧 Frontend Architecture
[Source: docs/architecture/FRONTEND_ARCHITECTURE_GUIDE.md]

**Project follows Clean Architecture**:
- **Presentation Layer**: `apps/web/src/modules/*/presentation/`
  - Components: `presentation/components/`
  - Composables: `presentation/composables/`
  - Views: `presentation/views/`
- **Shared Code**: `apps/web/src/shared/`
  - Shared components: `shared/components/`
  - Shared composables: `shared/composables/`
  - Vuetify config: `shared/vuetify/`

**Key Rule**: Theme management is a shared concern → Place in `apps/web/src/shared/`

#### 📦 File Locations for New Code

**Composable** (Theme State Management):
```
apps/web/src/shared/composables/useTheme.ts
```

**Component** (Theme Switcher UI):
```
apps/web/src/shared/components/ThemeSwitcher.vue
```

**Vuetify Config** (Already exists, needs modification):
```
apps/web/src/shared/vuetify/index.ts
```

**Tests**:
```
apps/web/src/shared/composables/__tests__/useTheme.spec.ts
apps/web/src/shared/components/__tests__/ThemeSwitcher.spec.ts
apps/web/e2e/theme.spec.ts
```

#### 🔌 Vuetify Theme API
[Source: Vuetify 3 documentation]

**Accessing Theme in Vue Components**:
```typescript
import { useTheme } from 'vuetify';

const theme = useTheme();
theme.global.name.value = 'dark'; // Switch theme
```

**Creating Custom useTheme Composable**:
```typescript
// Wrap Vuetify's useTheme with our business logic
export function useTheme() {
  const vuetifyTheme = useVuetifyTheme();
  
  const setTheme = (mode: ThemeMode) => {
    if (mode === 'auto') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      vuetifyTheme.global.name.value = prefersDark ? 'dark' : 'light';
    } else {
      vuetifyTheme.global.name.value = mode;
    }
    localStorage.setItem('theme-mode', mode);
  };
  
  return { setTheme, currentTheme: vuetifyTheme.global.name };
}
```

#### 📊 ECharts Theme Integration
[Source: Project DAG visualizations in Goal and Task modules]

**ECharts Instances in Project**:
- Goal DAG: `apps/web/src/modules/goal/presentation/components/GoalDAG.vue`
- Task DAG: `apps/web/src/modules/task/presentation/components/TaskDAG.vue`
- Statistics charts: Various modules

**ECharts Theme Update Strategy**:
```typescript
// Watch theme changes and update charts
watch(() => theme.global.name.value, (newTheme) => {
  if (chartInstance) {
    chartInstance.dispose(); // Dispose old instance
    chartInstance = echarts.init(el, newTheme); // Reinit with new theme
    chartInstance.setOption(chartOptions);
  }
});
```

#### 💾 LocalStorage Pattern
[Source: Project coding standards]

**Key for Storage**: `'daily-use-theme'` or `'theme-mode'`

**Storage Schema**:
```typescript
interface ThemePreference {
  mode: 'light' | 'dark' | 'auto';
  lastUpdated: string; // ISO timestamp
}
```

#### 🎨 CSS Transitions
[Source: Vuetify best practices]

**Add to Global Styles**:
```css
/* Smooth theme transitions */
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

**Prevent Flash of Unstyled Content**:
- Load theme from LocalStorage before Vue app mounts
- Apply theme class to `<html>` element immediately
- Use `v-cloak` directive during initialization

#### 🔍 System Preference Detection
[Source: Web APIs]

**matchMedia API**:
```typescript
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Initial check
const prefersDark = darkModeQuery.matches;

// Listen for changes
darkModeQuery.addEventListener('change', (e) => {
  if (themeMode === 'auto') {
    setTheme(e.matches ? 'dark' : 'light');
  }
});
```

#### 🧪 Testing Strategy
[Source: docs/architecture/FRONTEND_ARCHITECTURE_GUIDE.md - Testing section inferred]

**Unit Tests** (Vitest):
- Test `useTheme` composable logic
- Mock LocalStorage
- Mock matchMedia API

**Component Tests** (Vitest + Testing Library):
- Test ThemeSwitcher user interactions
- Verify theme state updates
- Verify icon/label changes

**E2E Tests** (Playwright):
- Test full user flow (open app → switch theme → verify UI)
- Test persistence (switch theme → reload → verify theme retained)
- Visual regression tests (screenshots in both themes)

#### ⚠️ Technical Constraints
- Must not break existing dark theme (current default)
- Must work with all Vuetify components
- Must support all modern browsers (Chrome, Firefox, Safari, Edge)
- Theme switching must be < 300ms for perceived performance

#### 🎯 Implementation Priorities
1. **Core Theme System** (Task 1) - Foundation for everything
2. **UI Component** (Task 2) - User-facing feature
3. **Vuetify Integration** (Task 3) - Ensure existing UI works
4. **ECharts Update** (Task 4) - Charts are critical visualizations
5. **UI Placement** (Task 5) - Make feature discoverable
6. **Testing** (Task 6) - Ensure quality

---

## 📊 Testing

### Unit Tests
- ✅ `useTheme` composable logic
- ✅ LocalStorage save/load
- ✅ System preference detection
- ✅ Theme mode validation

### Component Tests
- ✅ ThemeSwitcher rendering
- ✅ Theme selection interaction
- ✅ Active state visual feedback

### E2E Tests
- ✅ Full theme switching flow
- ✅ Persistence across sessions
- ✅ Auto mode system preference sync
- ✅ Visual regression (screenshots)
- ✅ All major pages in both themes

---

## 🔄 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-10-24 | 1.0 | Initial story creation | Bob (Scrum Master) |

---

## 👨‍💻 Dev Agent Record

### Agent Model Used
_To be filled by Dev Agent_

### Debug Log References
_To be filled by Dev Agent_

### Completion Notes List
_To be filled by Dev Agent_

### File List
_To be filled by Dev Agent_

---

## 🧪 QA Results
_To be filled by QA Agent_

---

**Story Status**: Draft  
**Ready for**: Dev Agent review and approval to proceed to implementation
