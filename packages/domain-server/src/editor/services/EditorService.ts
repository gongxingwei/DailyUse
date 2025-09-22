/**
 * Editor Domain Service
 * 编辑器领域服务 - 包含领域逻辑和业务规则
 *
 * 职责：
 * 1. 实现领域业务规则
 * 2. 协调聚合根之间的交互
 * 3. 执行复杂的领域逻辑
 * 4. 不直接操作数据访问，由应用层服务调用
 */
import { EditorContracts } from '@dailyuse/contracts';

export class EditorDomainService {
  constructor() {}

  /**
   * 验证编辑器会话创建规则
   * 领域规则：会话名称不能为空，长度限制等
   */
  validateSessionCreation(sessionName: string): void {
    if (!sessionName || sessionName.trim().length === 0) {
      throw new Error('会话名称不能为空');
    }

    if (sessionName.length > 100) {
      throw new Error('会话名称不能超过100个字符');
    }

    if (sessionName.includes('/') || sessionName.includes('\\')) {
      throw new Error('会话名称不能包含路径分隔符');
    }
  }

  /**
   * 验证文件路径
   * 领域规则：文件路径格式验证，安全检查等
   */
  validateFilePath(filePath: string): void {
    if (!filePath || filePath.trim().length === 0) {
      throw new Error('文件路径不能为空');
    }

    // 防止路径遍历攻击
    if (filePath.includes('..')) {
      throw new Error('文件路径不能包含相对路径');
    }

    // 检查文件扩展名
    const allowedExtensions = [
      '.md',
      '.txt',
      '.js',
      '.ts',
      '.vue',
      '.json',
      '.html',
      '.css',
      '.scss',
    ];
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    if (ext && !allowedExtensions.includes(ext.toLowerCase())) {
      throw new Error(`不支持的文件类型: ${ext}`);
    }
  }

  /**
   * 计算分割编辑器后的尺寸
   * 领域逻辑：根据分割方向计算新的组尺寸
   */
  calculateSplitDimensions(
    currentWidth: number,
    direction: 'horizontal' | 'vertical',
  ): { sourceWidth: number; newWidth: number } {
    if (direction === 'horizontal') {
      const halfWidth = Math.floor(currentWidth / 2);
      return {
        sourceWidth: halfWidth,
        newWidth: currentWidth - halfWidth,
      };
    } else {
      // 垂直分割时保持宽度不变
      return {
        sourceWidth: currentWidth,
        newWidth: currentWidth,
      };
    }
  }

  /**
   * 确定文件类型
   * 领域逻辑：根据文件扩展名确定编辑器语言模式
   */
  determineFileType(filePath: string): string {
    const ext = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase();

    const typeMap: Record<string, string> = {
      md: 'markdown',
      txt: 'plaintext',
      js: 'javascript',
      ts: 'typescript',
      vue: 'vue',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      hpp: 'cpp',
    };

    return typeMap[ext] || 'plaintext';
  }

  /**
   * 验证标签页创建规则
   * 领域规则：标签页标题、路径唯一性等
   */
  validateTabCreation(title: string, path: string, existingPaths: string[]): void {
    if (!title || title.trim().length === 0) {
      throw new Error('标签页标题不能为空');
    }

    if (existingPaths.includes(path)) {
      throw new Error(`文件 ${path} 已经在编辑器中打开`);
    }

    this.validateFilePath(path);
  }

  /**
   * 计算编辑器布局约束
   * 领域规则：最小宽度、高度约束等
   */
  validateLayoutConstraints(width: number, height?: number): void {
    const MIN_WIDTH = 200;
    const MIN_HEIGHT = 100;

    if (width < MIN_WIDTH) {
      throw new Error(`编辑器宽度不能小于 ${MIN_WIDTH}px`);
    }

    if (height !== undefined && height < MIN_HEIGHT) {
      throw new Error(`编辑器高度不能小于 ${MIN_HEIGHT}px`);
    }
  }

  /**
   * 生成唯一标识符
   * 领域逻辑：生成符合业务规则的ID
   */
  generateUniqueId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }

  /**
   * 验证会话切换规则
   * 领域规则：会话切换的前置条件
   */
  validateSessionSwitch(
    fromSessionId: string,
    toSessionId: string,
    hasUnsavedChanges: boolean,
  ): void {
    if (fromSessionId === toSessionId) {
      throw new Error('不能切换到当前活动的会话');
    }

    if (hasUnsavedChanges) {
      // 这里可以记录警告，但不阻止切换，由应用层决定如何处理
      console.warn('当前会话有未保存的更改，切换前请考虑保存');
    }
  }
}
