import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Command Palette
 * Provides methods for interacting with the command palette
 */
export class CommandPalettePage {
  readonly page: Page;

  // Locators
  readonly dialog: Locator;
  readonly palette: Locator;
  readonly searchInput: Locator;
  readonly searchStats: Locator;
  readonly resultsContainer: Locator;
  readonly loadingState: Locator;
  readonly recentItems: Locator;
  readonly commandMode: Locator;
  readonly searchResults: Locator;
  readonly noResults: Locator;
  readonly clearHistoryBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators
    this.dialog = page.getByTestId('command-palette-dialog');
    this.palette = page.getByTestId('command-palette');
    this.searchInput = page.getByTestId('command-palette-input');
    this.searchStats = page.getByTestId('search-stats');
    this.resultsContainer = page.getByTestId('results-container');
    this.loadingState = page.getByTestId('loading-state');
    this.recentItems = page.getByTestId('recent-items');
    this.commandMode = page.getByTestId('command-mode');
    this.searchResults = page.getByTestId('search-results');
    this.noResults = page.getByTestId('no-results');
    this.clearHistoryBtn = page.getByTestId('clear-history-btn');
  }

  // Open/Close
  async open() {
    console.log('[CommandPalette] Opening command palette');
    
    // Use keyboard shortcut (platform-specific)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await this.page.keyboard.press(`${modifier}+KeyK`);
    
    // Wait for palette to appear
    await this.waitForOpen();
  }

  async openWithModifier(modifier: 'Control' | 'Meta' = 'Control') {
    await this.page.keyboard.press(`${modifier}+KeyK`);
    await this.waitForOpen();
  }

  async close() {
    console.log('[CommandPalette] Closing command palette');
    await this.page.keyboard.press('Escape');
    await this.waitForClose();
  }

  async waitForOpen() {
    await this.dialog.waitFor({ state: 'visible', timeout: 3000 });
    await this.palette.waitFor({ state: 'visible', timeout: 3000 });
    await this.page.waitForTimeout(300); // Animation
  }

  async waitForClose() {
    await this.dialog.waitFor({ state: 'hidden', timeout: 3000 });
  }

  // Search
  async search(query: string) {
    console.log(`[CommandPalette] Searching: "${query}"`);
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Debounce
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  async getSearchQuery(): Promise<string> {
    return (await this.searchInput.inputValue()) || '';
  }

  // Navigation (keyboard)
  async pressArrowDown() {
    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(100);
  }

  async pressArrowUp() {
    await this.page.keyboard.press('ArrowUp');
    await this.page.waitForTimeout(100);
  }

  async pressEnter() {
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(300);
  }

  async navigateAndSelect(downCount: number) {
    for (let i = 0; i < downCount; i++) {
      await this.pressArrowDown();
    }
    await this.pressEnter();
  }

  // Recent Items
  recentItem(index: number): Locator {
    return this.page.getByTestId(`recent-item-${index}`);
  }

  recentItemByType(type: 'goal' | 'task' | 'reminder'): Locator {
    return this.page.locator(`[data-testid^="recent-item-"][data-item-type="${type}"]`);
  }

  async getRecentItemCount(): Promise<number> {
    return await this.page.locator('[data-testid^="recent-item-"]').count();
  }

  async clickRecentItem(index: number) {
    console.log(`[CommandPalette] Clicking recent item ${index}`);
    await this.recentItem(index).click();
    await this.page.waitForTimeout(500);
  }

  async clearHistory() {
    console.log('[CommandPalette] Clearing history');
    await this.clearHistoryBtn.click();
    await this.page.waitForTimeout(300);
  }

  // Commands
  commandItem(index: number): Locator {
    return this.page.getByTestId(`command-item-${index}`);
  }

  commandItemById(commandId: string): Locator {
    return this.page.locator(`[data-command-id="${commandId}"]`);
  }

  async getCommandCount(): Promise<number> {
    return await this.page.locator('[data-testid^="command-item-"]').count();
  }

  async clickCommand(index: number) {
    console.log(`[CommandPalette] Clicking command ${index}`);
    await this.commandItem(index).click();
    await this.page.waitForTimeout(500);
  }

  async clickCommandById(commandId: string) {
    console.log(`[CommandPalette] Clicking command: ${commandId}`);
    await this.commandItemById(commandId).click();
    await this.page.waitForTimeout(500);
  }

  // Search Results
  searchResultItem(index: number): Locator {
    return this.page.locator('[data-testid="search-results-list"] .v-list-item').nth(index);
  }

  searchResultByType(type: 'goal' | 'task' | 'reminder'): Locator {
    return this.page.locator(`[data-testid="search-results-list"] [data-result-type="${type}"]`);
  }

  async getSearchResultCount(): Promise<number> {
    const visible = await this.searchResults.isVisible();
    if (!visible) return 0;
    
    return await this.page.locator('[data-testid="search-results-list"] .v-list-item').count();
  }

  async clickSearchResult(index: number) {
    console.log(`[CommandPalette] Clicking search result ${index}`);
    await this.searchResultItem(index).click();
    await this.page.waitForTimeout(500);
  }

  async getSearchStats(): Promise<{ count: number; time?: number }> {
    const visible = await this.searchStats.isVisible();
    if (!visible) return { count: 0 };
    
    const text = await this.searchStats.textContent();
    const countMatch = text?.match(/Found (\d+) result/);
    const timeMatch = text?.match(/\((\d+)ms\)/);
    
    return {
      count: countMatch ? parseInt(countMatch[1]) : 0,
      time: timeMatch ? parseInt(timeMatch[1]) : undefined,
    };
  }

  // State Checks
  async isOpen(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  async isInCommandMode(): Promise<boolean> {
    const indicator = this.page.getByTestId('command-mode-indicator');
    return await indicator.isVisible();
  }

  async hasRecentItems(): Promise<boolean> {
    return await this.recentItems.isVisible();
  }

  async hasSearchResults(): Promise<boolean> {
    return await this.searchResults.isVisible();
  }

  async hasNoResults(): Promise<boolean> {
    return await this.noResults.isVisible();
  }

  // Assertions
  async expectOpen() {
    await expect(this.dialog).toBeVisible();
    await expect(this.palette).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).not.toBeVisible();
  }

  async expectInputFocused() {
    await expect(this.searchInput).toBeFocused();
  }

  async expectRecentItemsVisible() {
    await expect(this.recentItems).toBeVisible();
  }

  async expectRecentItemCount(count: number) {
    const actualCount = await this.getRecentItemCount();
    expect(actualCount).toBe(count);
  }

  async expectCommandModeActive() {
    await expect(this.commandMode).toBeVisible();
  }

  async expectSearchResultsVisible() {
    await expect(this.searchResults).toBeVisible();
  }

  async expectSearchResultCount(count: number) {
    const actualCount = await this.getSearchResultCount();
    expect(actualCount).toBe(count);
  }

  async expectNoResults() {
    await expect(this.noResults).toBeVisible();
  }

  async expectLoading() {
    await expect(this.loadingState).toBeVisible();
  }

  async expectNotLoading() {
    await expect(this.loadingState).not.toBeVisible();
  }

  // Quick Actions
  async quickCreateGoal() {
    await this.open();
    await this.search('create goal');
    await this.page.waitForTimeout(300);
    await this.pressEnter();
  }

  async quickCreateTask() {
    await this.open();
    await this.search('create task');
    await this.page.waitForTimeout(300);
    await this.pressEnter();
  }

  async quickCreateReminder() {
    await this.open();
    await this.search('create reminder');
    await this.page.waitForTimeout(300);
    await this.pressEnter();
  }

  async quickNavigateToGoal(goalTitle: string) {
    await this.open();
    await this.search(goalTitle);
    await this.page.waitForTimeout(500);
    
    // Click first result
    const firstResult = this.searchResultItem(0);
    await firstResult.click();
  }

  async quickNavigateToTask(taskTitle: string) {
    await this.open();
    await this.search(taskTitle);
    await this.page.waitForTimeout(500);
    await this.searchResultItem(0).click();
  }

  // Screenshot
  async screenshot(path: string) {
    await this.palette.screenshot({ path });
  }
}
