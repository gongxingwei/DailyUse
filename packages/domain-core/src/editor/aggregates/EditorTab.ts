import { EditorTabCore } from './EditorCore';
import { EditorContracts } from '@dailyuse/contracts';

type EditorTabDTO = EditorContracts.EditorTabDTO;

/**
 * 编辑器标签页实体
 */
export class EditorTab extends EditorTabCore {
  private _accountUuid: string;
  private _groupUuid: string;

  constructor(data: EditorTabDTO | EditorTab) {
    if (data instanceof EditorTab) {
      // 从另一个实体复制
      super({
        uuid: data.uuid,
        title: data.title,
        path: data.path,
        active: data.active,
        isPreview: data.isPreview,
        fileType: data.fileType,
        isDirty: data.isDirty,
        content: data.content,
        lastModified: data.lastModified,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
      this._accountUuid = data._accountUuid;
      this._groupUuid = data._groupUuid;
    } else {
      // 从DTO创建
      super({
        uuid: data.uuid,
        title: data.title,
        path: data.path,
        active: data.active,
        isPreview: data.isPreview,
        fileType: data.fileType,
        isDirty: data.isDirty,
        content: data.content,
        lastModified: data.lastModified ? new Date(data.lastModified) : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      });
      this._accountUuid = data.accountUuid;
      this._groupUuid = data.groupUuid;
    }
  }

  get accountUuid(): string {
    return this._accountUuid;
  }

  get groupUuid(): string {
    return this._groupUuid;
  }

  /**
   * 转换为DTO
   */
  toDTO(): EditorTabDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      groupUuid: this._groupUuid,
      title: this.title,
      path: this.path,
      active: this.active,
      isPreview: this.isPreview,
      fileType: this.fileType,
      isDirty: this.isDirty,
      content: this.content,
      lastModified: this.lastModified?.getTime() || Date.now(),
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}
