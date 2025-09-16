import { EditorLayoutCore } from './EditorCore';
import { EditorContracts } from '@dailyuse/contracts';

type EditorLayoutDTO = EditorContracts.EditorLayoutDTO;

/**
 * 编辑器布局实体
 */
export class EditorLayout extends EditorLayoutCore {
  constructor(data: EditorLayoutDTO | EditorLayout) {
    if (data instanceof EditorLayout) {
      // 从另一个实体复制
      super({
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        name: data.name,
        activityBarWidth: data.activityBarWidth,
        sidebarWidth: data.sidebarWidth,
        minSidebarWidth: data.minSidebarWidth,
        resizeHandleWidth: data.resizeHandleWidth,
        minEditorWidth: data.minEditorWidth,
        editorTabWidth: data.editorTabWidth,
        windowWidth: data.windowWidth,
        windowHeight: data.windowHeight,
        isDefault: data.isDefault,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    } else {
      // 从DTO创建
      super({
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        name: data.name,
        activityBarWidth: data.activityBarWidth,
        sidebarWidth: data.sidebarWidth,
        minSidebarWidth: data.minSidebarWidth,
        resizeHandleWidth: data.resizeHandleWidth,
        minEditorWidth: data.minEditorWidth,
        editorTabWidth: data.editorTabWidth,
        windowWidth: data.windowWidth,
        windowHeight: data.windowHeight,
        isDefault: data.isDefault,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      });
    }
  }

  /**
   * 转换为DTO
   */
  toDTO(): EditorLayoutDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this.name,
      activityBarWidth: this.activityBarWidth,
      sidebarWidth: this.sidebarWidth,
      minSidebarWidth: this.minSidebarWidth,
      resizeHandleWidth: this.resizeHandleWidth,
      minEditorWidth: this.minEditorWidth,
      editorTabWidth: this.editorTabWidth,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      isDefault: this.isDefault,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}
