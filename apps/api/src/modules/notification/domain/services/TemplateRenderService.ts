import { NotificationTemplate } from '../aggregates/NotificationTemplate';

/**
 * 模板渲染服务
 *
 * 职责：
 * - 渲染通知模板
 * - 验证模板变量
 * - 提供模板预览功能
 */
export class TemplateRenderService {
  /**
   * 渲染模板
   */
  render(
    template: NotificationTemplate,
    variables: Record<string, any>,
  ): { title: string; content: string } {
    // 验证变量
    const validation = template.validateVariables(variables);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // 渲染
    return template.render(variables);
  }

  /**
   * 预览模板（使用示例数据）
   */
  preview(
    template: NotificationTemplate,
    sampleVariables?: Record<string, any>,
  ): { title: string; content: string } {
    // 生成示例变量
    const variables = sampleVariables || this.generateSampleVariables(template.variables);

    try {
      return template.render(variables);
    } catch (error) {
      throw new Error(`Template preview failed: ${error}`);
    }
  }

  /**
   * 生成示例变量
   */
  private generateSampleVariables(variableNames: string[]): Record<string, any> {
    const samples: Record<string, any> = {};

    variableNames.forEach((varName) => {
      // 根据变量名称生成合理的示例值
      const lowerName = varName.toLowerCase();

      if (lowerName.includes('name') || lowerName.includes('user')) {
        samples[varName] = 'John Doe';
      } else if (lowerName.includes('date') || lowerName.includes('time')) {
        samples[varName] = new Date().toLocaleDateString();
      } else if (lowerName.includes('count') || lowerName.includes('number')) {
        samples[varName] = '42';
      } else if (lowerName.includes('progress') || lowerName.includes('percent')) {
        samples[varName] = '75%';
      } else if (lowerName.includes('goal')) {
        samples[varName] = 'Complete Project Alpha';
      } else if (lowerName.includes('task')) {
        samples[varName] = 'Review Documentation';
      } else {
        samples[varName] = `[${varName}]`;
      }
    });

    return samples;
  }

  /**
   * 提取模板中的变量
   */
  extractVariables(titleTemplate: string, contentTemplate: string): string[] {
    const pattern = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();

    let match;
    while ((match = pattern.exec(titleTemplate)) !== null) {
      variables.add(match[1]);
    }
    while ((match = pattern.exec(contentTemplate)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }
}
