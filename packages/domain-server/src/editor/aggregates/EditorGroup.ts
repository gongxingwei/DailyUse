// import { EditorGroupCore, EditorTabCore } from '@dailyuse/domain-core';
// import { type EditorContracts } from '@dailyuse/contracts';

// // 获取类型定义
// type EditorGroupDTO = EditorContracts.EditorGroupDTO;

// /**
//  * 服务端 EditorGroup 聚合根
//  * 继承核心 EditorGroup 类，添加服务端特有功能
//  */
// export class EditorGroup extends EditorGroupCore {
//   private _collapsed: boolean;
//   private _sortOrder: number;
//   private _configuration?: Record<string, any>;

//   constructor(params: {
//     uuid?: string;
//     active?: boolean;
//     width: number;
//     height?: number;
//     tabs?: EditorTabCore[];
//     activeTabId?: string | null;
//     title?: string;
//     order?: number;
//     lastAccessed?: Date;
//     createdAt?: Date;
//     updatedAt?: Date;
//     // 服务端特有字段
//     collapsed?: boolean;
//     sortOrder?: number;
//     configuration?: Record<string, any>;
//   }) {
//     super(params);

//     this._collapsed = params.collapsed || false;
//     this._sortOrder = params.sortOrder || params.order || 0;
//     this._configuration = params.configuration;
//   }

//   // ===== 实现抽象方法 =====

//   /**
//    * 转换为DTO
//    */
//   toDTO(): EditorGroupDTO {
//     return {
//       uuid: this.uuid,
//       active: this.active,
//       sessionUuid: this.accountUuid,
//       width: this.width,
//       height: this.height,
//       activeTabId: this.activeTabId,
//       title: this.title,
//       order: this.order,
//       lastAccessed: this.lastAccessed ? this.lastAccessed.getTime() : undefined,
//       createdAt: this.createdAt.getTime(),
//       updatedAt: this.updatedAt.getTime(),
//     };
//   }

//   // ===== Getter 方法 =====
//   get collapsed(): boolean {
//     return this._collapsed;
//   }
//   get sortOrder(): number {
//     return this._sortOrder;
//   }
//   get configuration(): Record<string, any> | undefined {
//     return this._configuration;
//   }

//   // ===== 服务端特有方法 =====

//   /**
//    * 切换折叠状态
//    */
//   toggleCollapsed(): void {
//     this._collapsed = !this._collapsed;
//     this.updateTimestamp();
//   }

//   /**
//    * 设置折叠状态
//    */
//   setCollapsed(collapsed: boolean): void {
//     if (this._collapsed === collapsed) return;
//     this._collapsed = collapsed;
//     this.updateTimestamp();
//   }

//   /**
//    * 设置排序顺序
//    */
//   setSortOrder(order: number): void {
//     if (this._sortOrder === order) return;
//     this._sortOrder = order;
//     this.updateTimestamp();
//   }

//   /**
//    * 更新配置
//    */
//   updateConfiguration(config: Record<string, any>): void {
//     this._configuration = { ...this._configuration, ...config };
//     this.updateTimestamp();
//   }

//   /**
//    * 获取持久化数据
//    */
//   toPersistenceData(): Record<string, any> {
//     return {
//       uuid: this.uuid,
//       accountUuid: this.accountUuid,
//       active: this.active,
//       width: this.width,
//       height: this.height,
//       tabs: this.tabs.map((tab) =>
//         (tab as any).toPersistenceData ? (tab as any).toPersistenceData() : tab.toDTO(),
//       ),
//       activeTabId: this.activeTabId,
//       title: this.title,
//       order: this.order,
//       lastAccessed: this.lastAccessed,
//       createdAt: this.createdAt,
//       updatedAt: this.updatedAt,
//       collapsed: this._collapsed,
//       sortOrder: this._sortOrder,
//       configuration: this._configuration,
//     };
//   }

//   /**
//    * 检查是否可以删除
//    */
//   canBeDeleted(): boolean {
//     // 如果有未保存的标签页，不能删除
//     return !this.hasUnsavedTabs;
//   }

//   /**
//    * 批量添加标签页
//    */
//   addMultipleTabs(tabs: EditorTabCore[]): void {
//     tabs.forEach((tab) => this.addTab(tab));
//   }

//   /**
//    * 移动标签页到指定位置
//    */
//   moveTabToPosition(tabId: string, newIndex: number): void {
//     const tab = this.tabs.find((t) => t.uuid === tabId);
//     if (!tab) {
//       throw new Error(`未找到标签页: ${tabId}`);
//     }

//     this.removeTab(tabId);
//     // 注意：由于addTab只接受一个参数，我们无法直接插入到指定位置
//     // 这需要在EditorGroupCore中扩展方法，或者使用其他方式实现
//     this.addTab(tab);
//   }

//   /**
//    * 获取所有脏标签页（有未保存更改的）
//    */
//   getDirtyTabs(): EditorTabCore[] {
//     return this.tabs.filter((tab) => tab.isDirty);
//   }

//   /**
//    * 保存所有脏标签页
//    */
//   async saveAllDirtyTabs(): Promise<void> {
//     const dirtyTabs = this.getDirtyTabs();
//     // 这里应该实现实际的保存逻辑
//     // 为了类型安全，这里只是示例
//     await Promise.all(
//       dirtyTabs.map(async (tab) => {
//         // 实际保存逻辑
//         (tab as any).markAsSaved?.();
//       }),
//     );
//     this.updateTimestamp();
//   }
// }
