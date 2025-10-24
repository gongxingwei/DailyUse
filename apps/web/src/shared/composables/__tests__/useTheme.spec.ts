import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTheme, type ThemeMode } from '../useTheme';
import { createVuetify } from 'vuetify';

// Mock Vuetify
vi.mock('vuetify', () => ({
  createVuetify: vi.fn(() => ({
    theme: {
      global: {
        name: { value: 'dark' },
      },
    },
  })),
  useTheme: vi.fn(() => ({
    global: {
      name: { value: 'dark' },
    },
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('useTheme', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default preference (auto mode)', () => {
    const { themeMode, isDark } = useTheme();

    expect(themeMode.value).toBe('auto');
    // In auto mode with matchMedia returning dark
    expect(isDark.value).toBe(true);
  });

  it('should save preference to localStorage', () => {
    const { setThemeMode } = useTheme();

    setThemeMode('light');

    const saved = localStorageMock.getItem('dailyuse-theme-preference');
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved!);
    expect(parsed.mode).toBe('light');
  });

  it('should load preference from localStorage', () => {
    localStorageMock.setItem(
      'dailyuse-theme-preference',
      JSON.stringify({ mode: 'dark', lightTheme: 'light', darkTheme: 'dark' }),
    );

    const { themeMode, isDark } = useTheme();

    expect(themeMode.value).toBe('dark');
    expect(isDark.value).toBe(true);
  });

  it('should toggle between light and dark', () => {
    const { toggleTheme, themeMode, isDark } = useTheme();

    // Start in auto mode (dark)
    expect(isDark.value).toBe(true);

    // Toggle should switch to light
    toggleTheme();
    expect(themeMode.value).toBe('light');
    expect(isDark.value).toBe(false);

    // Toggle again should switch to dark
    toggleTheme();
    expect(themeMode.value).toBe('dark');
    expect(isDark.value).toBe(true);
  });

  it('should respect system preference in auto mode', () => {
    const { setThemeMode, isDark } = useTheme();

    setThemeMode('auto');

    // matchMedia mock returns dark by default
    expect(isDark.value).toBe(true);
  });

  it('should return available themes for light mode', () => {
    const { getAvailableThemes } = useTheme();

    const lightThemes = getAvailableThemes('light');

    expect(lightThemes).toContain('light');
    expect(lightThemes).toContain('lightBlue');
    expect(lightThemes).toContain('warmPaper');
    expect(lightThemes.length).toBe(3);
  });

  it('should return available themes for dark mode', () => {
    const { getAvailableThemes } = useTheme();

    const darkThemes = getAvailableThemes('dark');

    expect(darkThemes).toContain('dark');
    expect(darkThemes).toContain('darkBlue');
    expect(darkThemes).toContain('blueGreen');
    expect(darkThemes.length).toBe(3);
  });

  it('should set specific theme for light or dark mode', () => {
    const { setSpecificTheme, setThemeMode, currentTheme } = useTheme();

    // Set light mode and change to lightBlue theme
    setThemeMode('light');
    setSpecificTheme('light', 'lightBlue');

    expect(currentTheme.value).toBe('lightBlue');

    // Switch to dark mode and change to darkBlue theme
    setThemeMode('dark');
    setSpecificTheme('dark', 'darkBlue');

    expect(currentTheme.value).toBe('darkBlue');
  });
});
