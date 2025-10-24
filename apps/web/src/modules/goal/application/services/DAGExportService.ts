import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type * as echarts from 'echarts';

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf';
  resolution: 1 | 2 | 3;
  backgroundColor: string | 'transparent';
  includeMetadata?: boolean;
}

export interface ExportMetadata {
  title: string;
  author?: string;
  date: string;
}

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
   * Note: Chart must be initialized with SVG renderer
   */
  async exportSVG(chartInstance: echarts.ECharts, options: ExportOptions): Promise<Blob> {
    try {
      const svgString = chartInstance.renderToSVGString?.();

      if (!svgString) {
        throw new Error('Chart must be initialized with SVG renderer to export SVG');
      }

      return new Blob([svgString], { type: 'image/svg+xml' });
    } catch (error) {
      console.warn('SVG export failed, falling back to PNG-based SVG:', error);
      // Fallback: Convert PNG to SVG (wrapped in <image> tag)
      const pngBlob = await this.exportPNG(chartInstance, options);
      const dataUrl = await this.blobToDataURL(pngBlob);

      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
          <image href="${dataUrl}" width="1200" height="800" />
        </svg>
      `;

      return new Blob([svgContent], { type: 'image/svg+xml' });
    }
  }

  /**
   * Export to PDF with metadata
   */
  async exportPDF(
    chartInstance: echarts.ECharts,
    options: ExportOptions,
    metadata: ExportMetadata,
  ): Promise<Blob> {
    // First get PNG data at 2x resolution for better quality
    const pngBlob = await this.exportPNG(chartInstance, {
      ...options,
      resolution: 2,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1200, 800],
    });

    // Add metadata if requested
    if (options.includeMetadata) {
      pdf.setProperties({
        title: metadata.title,
        author: metadata.author || 'DailyUse User',
        subject: 'Goal DAG Visualization',
        creator: 'DailyUse App',
        keywords: 'goal, dag, okr, visualization',
      });
    }

    // Add image to PDF
    const imgData = await this.blobToDataURL(pngBlob);
    pdf.addImage(imgData, 'PNG', 0, 0, 1200, 800);

    // Add footer with metadata
    if (options.includeMetadata) {
      pdf.setFontSize(10);
      pdf.setTextColor(128);
      pdf.text(`生成时间: ${metadata.date}`, 20, 780);
      pdf.text(metadata.title, 600, 780, { align: 'center' });
      if (metadata.author) {
        pdf.text(`作者: ${metadata.author}`, 1180, 780, { align: 'right' });
      }
    }

    return pdf.output('blob');
  }

  /**
   * Convert Blob to Data URL
   */
  private async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Generate filename for export
   */
  generateFilename(goalTitle: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitizedTitle = goalTitle
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') // Replace special chars
      .slice(0, 50); // Limit length

    return `goal-dag-${sanitizedTitle}-${timestamp}.${format}`;
  }

  /**
   * Download blob as file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const dagExportService = new DAGExportService();
