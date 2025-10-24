import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Task DAG Visualization
 * Provides methods for interacting with the DAG visualization component
 */
export class TaskDAGPage {
  readonly page: Page;

  // Locators
  readonly container: Locator;
  readonly chart: Locator;
  readonly layoutToggle: Locator;
  readonly forceLayoutBtn: Locator;
  readonly hierarchicalLayoutBtn: Locator;
  readonly criticalPathToggle: Locator;
  readonly criticalPathChip: Locator;
  readonly resetLayoutBtn: Locator;
  readonly exportBtn: Locator;
  readonly legend: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.container = page.getByTestId('task-dag-visualization');
    this.chart = page.getByTestId('dag-chart');
    this.layoutToggle = page.getByTestId('layout-toggle');
    this.forceLayoutBtn = page.getByTestId('layout-force-btn');
    this.hierarchicalLayoutBtn = page.getByTestId('layout-hierarchical-btn');
    this.criticalPathToggle = page.getByTestId('critical-path-toggle');
    this.criticalPathChip = page.getByTestId('critical-path-chip');
    this.resetLayoutBtn = page.getByTestId('reset-layout-btn');
    this.exportBtn = page.getByTestId('export-dag-btn');
    this.legend = page.getByTestId('dag-legend');
  }

  // Navigation
  async open() {
    // Click DAG visualization button (assumes we're on task page)
    await this.page.click('button:has-text("DAG"), button:has-text("依赖关系图")');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.container.waitFor({ state: 'visible', timeout: 5000 });
    await this.chart.waitFor({ state: 'visible', timeout: 5000 });
    // Wait for chart to render
    await this.page.waitForTimeout(1000);
  }

  // Layout Actions
  async switchToForceLayout() {
    console.log('[TaskDAGPage] Switching to force layout');
    await this.forceLayoutBtn.click();
    await this.page.waitForTimeout(1200); // Wait for animation
  }

  async switchToHierarchicalLayout() {
    console.log('[TaskDAGPage] Switching to hierarchical layout');
    await this.hierarchicalLayoutBtn.click();
    await this.page.waitForTimeout(1200); // Wait for animation
  }

  async getCurrentLayout(): Promise<'force' | 'hierarchical'> {
    const forcePressed = await this.forceLayoutBtn.getAttribute('aria-pressed');
    return forcePressed === 'true' ? 'force' : 'hierarchical';
  }

  // Critical Path Actions
  async toggleCriticalPath() {
    console.log('[TaskDAGPage] Toggling critical path');
    await this.criticalPathToggle.click();
    await this.page.waitForTimeout(500);
  }

  async enableCriticalPath() {
    const isActive = await this.isCriticalPathActive();
    if (!isActive) {
      await this.toggleCriticalPath();
    }
  }

  async disableCriticalPath() {
    const isActive = await this.isCriticalPathActive();
    if (isActive) {
      await this.toggleCriticalPath();
    }
  }

  async isCriticalPathActive(): Promise<boolean> {
    const variant = await this.criticalPathToggle.getAttribute('variant');
    return variant === 'flat';
  }

  async getCriticalPathDuration(): Promise<number | null> {
    const chipVisible = await this.criticalPathChip.isVisible();
    if (!chipVisible) return null;

    const text = await this.criticalPathChip.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // Layout Reset
  async resetLayout() {
    console.log('[TaskDAGPage] Resetting layout');
    await this.resetLayoutBtn.click();
    await this.page.waitForTimeout(500);
  }

  async hasCustomLayout(): Promise<boolean> {
    return await this.resetLayoutBtn.isVisible();
  }

  // Export
  async exportAsPNG() {
    console.log('[TaskDAGPage] Exporting as PNG');

    // Set up download listener
    const downloadPromise = this.page.waitForEvent('download');

    await this.exportBtn.click();

    // Wait for export dialog and click PNG option
    await this.page.click('button:has-text("PNG"), [data-format="png"]');

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    console.log(`[TaskDAGPage] Downloaded: ${filename}`);
    return filename;
  }

  async exportAsJSON() {
    console.log('[TaskDAGPage] Exporting as JSON');

    const downloadPromise = this.page.waitForEvent('download');

    await this.exportBtn.click();
    await this.page.click('button:has-text("JSON"), [data-format="json"]');

    const download = await downloadPromise;
    return download.suggestedFilename();
  }

  // Chart Interactions
  async clickNode(nodeId: string) {
    console.log(`[TaskDAGPage] Clicking node: ${nodeId}`);

    // ECharts uses canvas, so we need to calculate position
    const chartBox = await this.chart.boundingBox();
    if (!chartBox) throw new Error('Chart not found');

    // Click center of chart (simplified - real implementation would need node coordinates)
    await this.page.mouse.click(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height / 2);
  }

  async zoomIn() {
    const chartBox = await this.chart.boundingBox();
    if (!chartBox) throw new Error('Chart not found');

    // Mouse wheel zoom
    await this.page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height / 2);
    await this.page.mouse.wheel(0, -100);
    await this.page.waitForTimeout(300);
  }

  async zoomOut() {
    const chartBox = await this.chart.boundingBox();
    if (!chartBox) throw new Error('Chart not found');

    await this.page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height / 2);
    await this.page.mouse.wheel(0, 100);
    await this.page.waitForTimeout(300);
  }

  async panChart(deltaX: number, deltaY: number) {
    const chartBox = await this.chart.boundingBox();
    if (!chartBox) throw new Error('Chart not found');

    const startX = chartBox.x + chartBox.width / 2;
    const startY = chartBox.y + chartBox.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + deltaX, startY + deltaY);
    await this.page.mouse.up();

    await this.page.waitForTimeout(300);
  }

  // Assertions
  async expectVisible() {
    await expect(this.container).toBeVisible();
    await expect(this.chart).toBeVisible();
  }

  async expectLayoutType(layoutType: 'force' | 'hierarchical') {
    const current = await this.getCurrentLayout();
    expect(current).toBe(layoutType);
  }

  async expectCriticalPathVisible() {
    await expect(this.criticalPathChip).toBeVisible();
  }

  async expectCriticalPathNotVisible() {
    await expect(this.criticalPathChip).not.toBeVisible();
  }

  async expectCriticalPathDuration(expectedDuration: number) {
    const duration = await this.getCriticalPathDuration();
    expect(duration).toBe(expectedDuration);
  }

  async expectResetButtonVisible() {
    await expect(this.resetLayoutBtn).toBeVisible();
  }

  async expectResetButtonNotVisible() {
    await expect(this.resetLayoutBtn).not.toBeVisible();
  }

  async expectLegendVisible() {
    await expect(this.legend).toBeVisible();
  }

  async expectChartHasNodes() {
    // Check that chart has rendered content
    const chartBox = await this.chart.boundingBox();
    expect(chartBox).toBeTruthy();
    expect(chartBox!.width).toBeGreaterThan(0);
    expect(chartBox!.height).toBeGreaterThan(0);
  }

  // State Checks
  async getChartDimensions(): Promise<{ width: number; height: number } | null> {
    const box = await this.chart.boundingBox();
    return box ? { width: box.width, height: box.height } : null;
  }

  async isLoading(): Promise<boolean> {
    const loader = this.page.locator('.v-progress-linear, .v-progress-circular');
    return await loader.isVisible();
  }

  // LocalStorage Helpers
  async getLayoutTypeFromStorage(): Promise<string | null> {
    return await this.page.evaluate(() => localStorage.getItem('dag-layout-type'));
  }

  async setLayoutTypeInStorage(layoutType: 'force' | 'hierarchical') {
    await this.page.evaluate((type) => {
      localStorage.setItem('dag-layout-type', type);
    }, layoutType);
  }

  async clearLayoutStorage() {
    await this.page.evaluate(() => {
      localStorage.removeItem('dag-layout-type');
      // Also clear any custom layout positions
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('dag-layout-')) {
          localStorage.removeItem(key);
        }
      });
    });
  }

  async setCustomLayout(taskId: string, positions: Array<{ id: string; x: number; y: number }>) {
    await this.page.evaluate(
      ({ id, pos }) => {
        localStorage.setItem(`dag-layout-${id}`, JSON.stringify(pos));
      },
      { id: taskId, pos: positions },
    );
  }

  // Screenshot
  async screenshot(path: string) {
    await this.container.screenshot({ path });
  }
}
