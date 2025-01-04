export interface TreeNode {
  title: string          // 节点标题
  key: string           // 节点唯一标识（路径）
  fileType: string      // 文件类型
  isLeaf?: boolean      // 是否为叶子节点（文件）
  children?: TreeNode[] // 子节点
}

export interface FolderData {
  folderTreeData: TreeNode[]
  directoryPath: string
} 