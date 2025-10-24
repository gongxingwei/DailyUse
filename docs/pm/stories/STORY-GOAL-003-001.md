# STORY-015: DAG Export Functionality

**Epic**: Goal Management - DAG Enhancements  
**Sprint**: Sprint 3  
**Story Points**: 2 SP  
**Priority**: P0 (High Value)  
**Status**: 📋 Ready  
**Assignee**: Development Team  
**Dependencies**: STORY-010 (GoalDAGVisualization component)

---

## 📖 User Story

**As a** goal manager  
**I want** to export the goal DAG visualization to image/PDF formats  
**So that** I can share goal structures in presentations and documents

---

## 🎯 Acceptance Criteria

1. ✅ **Export Formats**
   - [ ] PNG export with configurable resolution (1x, 2x, 3x)
   - [ ] SVG export for vector graphics
   - [ ] PDF export with metadata (title, date, author)
   - [ ] Export filename format: `goal-dag-{goalTitle}-{date}.{ext}`

2. ✅ **Export Configuration**
   - [ ] Export dialog with format selection
   - [ ] Resolution/quality options for raster formats
   - [ ] Background color toggle (transparent/white)
   - [ ] Preview before export
   - [ ] Cancel and confirm buttons

3. ✅ **User Experience**
   - [ ] Export button in DAG toolbar
   - [ ] Progress indicator during export
   - [ ] Success/error toast notifications
   - [ ] Auto-download after export completes
   - [ ] Export time < 3s for typical DAG (20-30 nodes)

4. ✅ **Quality Assurance**
   - [ ] Exported image matches on-screen visualization
   - [ ] Text remains readable at all resolutions
   - [ ] Colors preserved accurately
   - [ ] Export success rate ≥95%
   - [ ] No memory leaks during repeated exports

5. ✅ **Accessibility**
   - [ ] Keyboard shortcut (Ctrl+E / Cmd+E)
   - [ ] Screen reader announces export status
   - [ ] Error messages are descriptive

---

## 🛠️ Technical Approach

### Architecture

```typescript
// Export service
interface ExportOptions {
  format: 'png' | 'svg' | 'pdf';
  resolution: 1 | 2 | 3;
  backgroundColor: string | 'transparent';
  includeMetadata: boolean;
}

class DAGExportService {
  async exportPNG(element: HTMLElement, options: ExportOptions): Promise<Blob>;
  async exportSVG(element: HTMLElement, options: ExportOptions): Promise<Blob>;
  async exportPDF(element: HTMLElement, options: ExportOptions): Promise<Blob>;
}
```

### Implementation Steps

#### 1. Install Dependencies

```bash
cd apps/web
pnpm add html2canvas jspdf
pnpm add -D @types/html2canvas
```

#### 2. Create Export Service

**File**: `apps/web/src/modules/goal/services/DAGExportService.ts`

```typescript
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as echarts from 'echarts';

export class DAGExportService {
  /**
   * Export ECharts chart to PNG using native ECharts API
   */
  async exportPNG(chartInstance: echarts.ECharts, options: ExportOptions): Promise<Blob> {
    const url = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: options.resolution,
      backgroundColor:
        options.backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : options.backgroundColor,
    });

    const response = await fetch(url);
    return response.blob();
  }

  /**
   * Export to SVG using ECharts native SVG renderer
   */
  async exportSVG(chartInstance: echarts.ECharts, options: ExportOptions): Promise<Blob> {
    // ECharts must be initialized with SVG renderer
    const svgString = chartInstance.renderToSVGString();
    return new Blob([svgString], { type: 'image/svg+xml' });
  }

  /**
   * Export to PDF with metadata
   */
  async exportPDF(
    chartInstance: echarts.ECharts,
    options: ExportOptions,
    metadata: { title: string; author: string; date: string },
  ): Promise<Blob> {
    // First get PNG data
    const pngBlob = await this.exportPNG(chartInstance, {
      ...options,
      resolution: 2, // Use 2x for better PDF quality
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1200, 800],
    });

    // Add metadata
    pdf.setProperties({
      title: metadata.title,
      author: metadata.author,
      subject: 'Goal DAG Visualization',
      creator: 'DailyUse App',
      keywords: 'goal, dag, okr',
    });

    // Add image to PDF
    const imgData = await this.blobToDataURL(pngBlob);
    pdf.addImage(imgData, 'PNG', 0, 0, 1200, 800);

    // Add footer with metadata
    pdf.setFontSize(10);
    pdf.setTextColor(128);
    pdf.text(`Generated: ${metadata.date}`, 20, 780);
    pdf.text(metadata.title, 600, 780, { align: 'center' });

    return pdf.output('blob');
  }

  private async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
```

#### 3. Add Export Dialog Component

**File**: `apps/web/src/modules/goal/presentation/components/dag/ExportDialog.vue`

```vue
<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card>
      <v-card-title>导出 DAG 可视化</v-card-title>

      <v-card-text>
        <v-select
          v-model="format"
          :items="formatOptions"
          label="导出格式"
          item-title="label"
          item-value="value"
        />

        <v-select
          v-if="format === 'png'"
          v-model="resolution"
          :items="resolutionOptions"
          label="分辨率"
        />

        <v-select v-model="backgroundColor" :items="bgOptions" label="背景颜色" />

        <v-checkbox
          v-if="format === 'pdf'"
          v-model="includeMetadata"
          label="包含元数据（标题、日期、作者）"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="isOpen = false">取消</v-btn>
        <v-btn color="primary" :loading="isExporting" @click="handleExport"> 导出 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from '@/composables/useToast';
import { DAGExportService } from '../../services/DAGExportService';

const emit = defineEmits<{
  export: [options: ExportOptions];
}>();

const isOpen = ref(false);
const isExporting = ref(false);
const format = ref<'png' | 'svg' | 'pdf'>('png');
const resolution = ref(2);
const backgroundColor = ref('white');
const includeMetadata = ref(true);

const formatOptions = [
  { label: 'PNG 图片', value: 'png' },
  { label: 'SVG 矢量图', value: 'svg' },
  { label: 'PDF 文档', value: 'pdf' },
];

const resolutionOptions = [
  { title: '标准 (1x)', value: 1 },
  { title: '高清 (2x)', value: 2 },
  { title: '超高清 (3x)', value: 3 },
];

const bgOptions = [
  { title: '白色', value: 'white' },
  { title: '透明', value: 'transparent' },
];

const toast = useToast();

async function handleExport() {
  isExporting.value = true;

  try {
    emit('export', {
      format: format.value,
      resolution: resolution.value,
      backgroundColor: backgroundColor.value,
      includeMetadata: includeMetadata.value,
    });

    toast.success('导出成功！');
    isOpen.value = false;
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('导出失败，请重试');
  } finally {
    isExporting.value = false;
  }
}

function open() {
  isOpen.value = true;
}

defineExpose({ open });
</script>
```

#### 4. Integrate into GoalDAGVisualization.vue

```vue
<template>
  <div class="goal-dag-visualization">
    <!-- Toolbar -->
    <div class="dag-toolbar">
      <v-btn icon="mdi-download" size="small" @click="exportDialog?.open()" title="导出 (Ctrl+E)">
        <v-icon>mdi-download</v-icon>
      </v-btn>
      <!-- ... other toolbar buttons -->
    </div>

    <!-- Chart -->
    <v-chart ref="chartRef" :option="chartOption" :autoresize="true" @click="handleNodeClick" />

    <!-- Export Dialog -->
    <ExportDialog ref="exportDialog" @export="handleExport" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VChart from 'vue-echarts';
import ExportDialog from './ExportDialog.vue';
import { DAGExportService } from '../../services/DAGExportService';
import { useGoal } from '../../composables/useGoal';

const chartRef = ref<InstanceType<typeof VChart>>();
const exportDialog = ref<InstanceType<typeof ExportDialog>>();
const exportService = new DAGExportService();
const { currentGoal } = useGoal();

async function handleExport(options: ExportOptions) {
  const chartInstance = chartRef.value?.chart;
  if (!chartInstance) {
    throw new Error('Chart instance not found');
  }

  let blob: Blob;

  switch (options.format) {
    case 'png':
      blob = await exportService.exportPNG(chartInstance, options);
      break;
    case 'svg':
      blob = await exportService.exportSVG(chartInstance, options);
      break;
    case 'pdf':
      blob = await exportService.exportPDF(chartInstance, options, {
        title: currentGoal.value?.title || 'Goal DAG',
        author: 'DailyUse User',
        date: new Date().toISOString(),
      });
      break;
  }

  // Download file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `goal-dag-${currentGoal.value?.title || 'export'}-${Date.now()}.${options.format}`;
  a.click();
  URL.revokeObjectURL(url);
}

// Keyboard shortcut
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportDialog.value?.open();
    }
  };

  window.addEventListener('keydown', handleKeydown);
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
});
</script>
```

---

## 📝 Subtasks

### Phase 1: Setup & Service (0.5 SP)

- [ ] Install html2canvas and jsPDF dependencies
- [ ] Create DAGExportService.ts
- [ ] Implement PNG export method
- [ ] Implement SVG export method
- [ ] Implement PDF export method with metadata
- [ ] Write unit tests for export service

### Phase 2: UI Components (0.75 SP)

- [ ] Create ExportDialog.vue component
- [ ] Add export button to DAG toolbar
- [ ] Implement format selection dropdown
- [ ] Add resolution/quality options
- [ ] Add background color toggle
- [ ] Implement progress indicator
- [ ] Add toast notifications

### Phase 3: Integration & Testing (0.75 SP)

- [ ] Integrate ExportDialog into GoalDAGVisualization
- [ ] Add keyboard shortcut (Ctrl+E)
- [ ] Test all export formats
- [ ] Test different resolutions
- [ ] Test transparent background
- [ ] Verify PDF metadata
- [ ] Performance testing (export time < 3s)
- [ ] Memory leak testing

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('DAGExportService', () => {
  it('should export PNG at correct resolution', async () => {
    const blob = await service.exportPNG(chart, { resolution: 2 });
    expect(blob.type).toBe('image/png');
  });

  it('should include metadata in PDF', async () => {
    const blob = await service.exportPDF(chart, options, metadata);
    // Verify PDF contains metadata
  });
});
```

### E2E Tests

```typescript
test('should export DAG to PNG', async ({ page }) => {
  await page.goto('/goals/123');
  await page.click('[data-testid="export-button"]');
  await page.click('text=PNG 图片');
  await page.click('text=导出');

  // Verify download started
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('.png');
});
```

---

## 📊 Success Metrics

- [ ] Export success rate ≥95%
- [ ] Average export time <2s for PNG/SVG
- [ ] Average export time <3s for PDF
- [ ] User adoption: ≥40% of DAG views result in export
- [ ] Zero memory leaks after 100 consecutive exports
- [ ] Exported image quality matches on-screen (visual diff <5%)

---

## 🔗 Related Documents

- [GoalDAGVisualization Component](../../../apps/web/src/modules/goal/presentation/components/dag/README.md)
- [STORY-010 Completion](./STORY-GOAL-002-010.md)
- [ECharts Export Documentation](https://echarts.apache.org/en/api.html#echartsInstance.getDataURL)

---

## 📅 Timeline

- **Start Date**: 2024-10-24 (after STORY-012)
- **Target Completion**: 2024-10-24 (1 day)
- **Status**: 📋 Ready to start

---

## 💡 Future Enhancements (Not in Scope)

- Batch export multiple goals
- Email export directly from app
- Cloud storage integration (Google Drive, OneDrive)
- Custom watermark support
- Export scheduling (weekly report generation)
