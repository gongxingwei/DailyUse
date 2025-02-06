<template>
    <div class="file-explorer">
      <!-- 顶部信息栏 -->
      <v-list>
        <v-list-item>
          <v-row align="center" no-gutters>
            <v-col class="text-truncate">
              {{ getFolderName }}
            </v-col>
            <v-col cols="auto">
              <v-icon class="mr-2" @click="createFolderForRepo">mdi-folder-plus</v-icon>
              <v-icon class="mr-2" @click="createFileForRepo">mdi-language-markdown</v-icon>
              <v-icon @click="$emit('settings')">mdi-cog</v-icon>
            </v-col>
          </v-row>
        </v-list-item>
      </v-list>
      <v-divider></v-divider>
  
      <!-- 扁平化的文件树 -->
      <div v-if="folderData" class="tree-content">
        <div
          v-for="item in flattenedItems"
          :key="item.node.key"
          class="tree-item"
          :style="{ paddingLeft: `${item.level * 24}px` }"
        >
          <div 
            class="tree-item-content"
            :class="{ 'selected': selectedNode?.key === item.node.key }"
            @click="toggleNode(item.node)"
            @contextmenu.prevent="handleContextMenu($event, item.node)"
          >
            <v-icon v-if="item.node.fileType === 'directory'" class="mr-2">
              {{ openedNodes.includes(item.node.key) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
            </v-icon>
            <v-icon v-if="item.node.fileType !== 'directory'" class="mr-2">
              {{ getItemIcon(item.node) }}
            </v-icon>
            <div v-if="editingNode === item.node.key" class="edit-container">
              <input
                :ref="el => setInputRef(el as HTMLInputElement | null, item.node.key)"
                v-model="editValue"
                type="text"
                @keydown.enter.prevent="e => (e.target as HTMLInputElement).blur()"
                @keyup.esc="cancelEdit"
                @blur="handleEditComplete"
              />
            </div>
            <span v-else>{{ item.node.title }}</span>
          </div>
        </div>
      </div>
      <!-- 右键菜单 -->
      <div 
        v-show="showMenu"
        class="context-menu"
        :style="{
          left: `${menuPosition.x}px`,
          top: `${menuPosition.y}px`
        }"
      >
        <div 
          v-for="item in menuItems" 
          :key="item.title"
          class="menu-item"
          :class="{ 'menu-item-disabled': item.disabled }"
          @click="!item.disabled && handleMenuClick(item)"
        >
          <v-icon v-if="item.icon" class="menu-icon">{{ item.icon }}</v-icon>
          <span class="menu-title">{{ item.title }}</span>
        </div>
      </div>
    </div>
  </template>
  
<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { TreeNode, FolderData } from '../repo'
import { fileSystem } from '@/shared/utils/fileSystem'

  // 状态管理
  const folderData = ref<FolderData | null>(null)
  const openedNodes = ref<string[]>(['root'])
  const editingNode = ref<string | null>(null)
  const editValue = ref('')
  const editInputs = ref<Record<string, HTMLInputElement>>({})
  const showMenu = ref(false)
  const menuPosition = ref({ x: 0, y: 0 })
  const selectedNode = ref<TreeNode | null>(null)
  
  // 文件图标映射
  const fileIcons = {
    html: 'mdi-language-html5',
    js: 'mdi-nodejs',
    json: 'mdi-code-json',
    md: 'mdi-language-markdown',
    pdf: 'mdi-file-pdf-box',
    png: 'mdi-file-image',
    txt: 'mdi-file-document-outline',
    xls: 'mdi-file-excel',
  }
  
  // 计算属性
  const getFolderName = computed(() => {
    if (!folderData.value?.directoryPath || !window?.electron?.path) {
      return '';
    }
    return window.electron.path.basename(folderData.value.directoryPath);
  })
  
  const sortedItems = computed(() => {
    if (!folderData.value?.folderTreeData) return []
    return [...folderData.value.folderTreeData].sort((a, b) => {
      if (a.fileType === b.fileType) return a.title.localeCompare(b.title)
      return a.fileType === 'directory' ? -1 : 1
    })
  })
  
  interface FlattenedNode {
    node: TreeNode
    level: number
    parentKey: string | null
  }
  
  // 扁平化树结构
  const flattenedItems = computed(() => {
    const items: FlattenedNode[] = []
    
    function flatten(nodes: TreeNode[], level: number = 0, parentKey: string | null = null) {
      nodes.forEach(node => {
        items.push({ node, level, parentKey })
        if (node.children && openedNodes.value.includes(node.key)) {
          flatten(node.children, level + 1, node.key)
        }
      })
    }
    
    if (folderData.value?.folderTreeData) {
      flatten(sortedItems.value)
    }
    
    return items
  })
  

  // 仓库文件管理
  const createFolderForRepo = async () => {
    if (!folderData.value?.directoryPath) return
    try {
      const newFolderPath = window.electron.path.join(
        folderData.value.directoryPath,
        'NewFolder'
      )
      await fileSystem.createFolder(newFolderPath)
      await refreshFolder()
      startEdit(newFolderPath, 'NewFolder')
    } catch (error) {
      console.error('创建文件夹失败:', error)
    }
  }

  const createFileForRepo = async () => {
    if (!folderData.value?.directoryPath) return
    const newFilePath = window.electron.path.join(
      folderData.value.directoryPath,
      'untitled.md'
    )
    await fileSystem.createFile(newFilePath, '')
    await refreshFolder()
    startEdit(newFilePath, 'untitled')
  }
  
  const createFolder = async () => {
    if (!selectedNode.value) return
    console.log('创建文件夹:', {
      parentPath: selectedNode.value.key
    })

    try {
      // 1. 构建新文件夹路径
      const newFolderPath = window.electron.path.join(
        selectedNode.value.key,
        'NewFolder'
      )

      // 2. 调用 Electron API 创建文件夹
      await fileSystem.createFolder(newFolderPath)

      // 3. 展开父节点
      openedNodes.value.push(selectedNode.value.key)

      // 4. 刷新文件夹内容
      await refreshFolder()

      // 5. 进入重命名模式
      startEdit(newFolderPath, 'NewFolder')
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }
  
  const createFile = async () => {
    if (!selectedNode.value) return
    console.log('创建文件:', {
      parentPath: selectedNode.value.key
    })

    try {
      const newFilePath = window.electron.path.join(
        selectedNode.value.key,
        'untitled.md'
      )
      await fileSystem.createFile(newFilePath, '')
      openedNodes.value.push(selectedNode.value.key)
      await refreshFolder()
      startEdit(newFilePath, 'untitled')
    } catch (error) {
      console.error('创建文件失败:', error)
    }
  }
  
  const deleteFolder = async () => {
    if (!selectedNode.value) return
    try {
      await window.electron.deleteFileOrFolder(
        selectedNode.value.key,
        true
      )
      await refreshFolder()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }
  
  const deleteFile = async () => {
    if (!selectedNode.value) return
    try {
      await window.electron.deleteFileOrFolder(
        selectedNode.value.key,
        false
      )
      await refreshFolder()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const renameFileOrFolder = async () => {
    if (!selectedNode.value) return
    // 直接进入编辑模式，使用当前名称作为初始值
    startEdit(selectedNode.value.key, selectedNode.value.title)
  }

  const copyToClipboard = () => {
    if (!selectedNode.value) return
    window.electron.writeClipboardFiles([selectedNode.value.key])
  }
  
  // 树节点操作
  function toggleNode(item: TreeNode) {
    if (item.fileType !== 'directory') {
      emit('select-file', item.key)
    }
    const index = openedNodes.value.indexOf(item.key)
    if (index === -1) {
      openedNodes.value.push(item.key)
    } else {
      openedNodes.value.splice(index, 1)
    }
  }
  
  function getItemIcon(item: TreeNode) {
    if (item.fileType === 'directory') {
      return openedNodes.value.includes(item.key) ? 'mdi-folder-open' : 'mdi-folder'
    }
    return fileIcons[item.fileType as keyof typeof fileIcons] || 'mdi-file'
  }
  
  // 编辑相关方法
  function startEdit(key: string, initialValue: string = '') {
    editingNode.value = key
    editValue.value = key.endsWith('.md') 
      ? initialValue.replace(/\.md$/, '') 
      : initialValue
    nextTick(() => {
      const input = editInputs.value[key]
      if (input) {
        input.focus()
        input.select()
      }
    })
  }
  
  async function handleEditComplete(_event?: Event) {
    if (editingNode.value && editValue.value.trim()) {
      const oldPath = editingNode.value
      const newName = editValue.value.trim()
      const newNameWithExt = oldPath.endsWith('.md') 
        ? `${newName}.md` 
        : newName
      const parentPath = window.electron.path.dirname(oldPath)
      const newPath = window.electron.path.join(parentPath, newNameWithExt)
      
      try {
        const success = await fileSystem.rename(oldPath, newPath)
        if (success) {
          await refreshFolder()
        }
      } catch (error) {
        console.error('Rename error:', error)
      }
    }
    cancelEdit()
  }
  
  function cancelEdit() {
    if (editingNode.value) {
      delete editInputs.value[editingNode.value]
    }
    editingNode.value = null
    editValue.value = ''
  }
  
  // 右键菜单
  function handleContextMenu(event: MouseEvent, item: TreeNode) {
    event.preventDefault()
    menuPosition.value = { x: event.clientX, y: event.clientY - 48 }
    selectedNode.value = item
    showMenu.value = true
  }
  
  const menuItems = computed(() => {
    if (!selectedNode.value) return []
    return selectedNode.value.fileType === 'directory'
      ? [
          { title: '创建文件夹', action: createFolder, icon: 'mdi-folder-plus', disabled: false },
          { title: '创建笔记', action: createFile, icon: 'mdi-language-markdown', disabled: false },
          { title: '重命名', action: renameFileOrFolder, icon: 'mdi-pencil', disabled: false },
          { title: '删除', action: deleteFolder, icon: 'mdi-folder-remove', disabled: false },
          { title: '复制', action: copyToClipboard, icon: 'mdi-content-copy', disabled: false },
        ]
      : [
          { title: '重命名', action: renameFileOrFolder, icon: 'mdi-pencil', disabled: false },
          { title: '删除', action: deleteFile, icon: 'mdi-file-remove', disabled: false },
          { title: '复制', action: copyToClipboard, icon: 'mdi-content-copy', disabled: false },
        ]
  })
  
  function handleMenuClick(item: { title: string; action: () => void }) {
    item.action()
    showMenu.value = false
  }
  
  function handleClickOutside(event: MouseEvent) {
    const menu = event.target as HTMLElement
    if (!menu.closest('.context-menu')) {
      showMenu.value = false
    }
  }
  
  // 刷新文件夹
  async function refreshFolder() {
    if (folderData.value?.directoryPath) {
      const result = await fileSystem.refreshFolder(folderData.value.directoryPath)
      if (result) {
        folderData.value = result
      }
    }
  }
  
  // 生命周期钩子
  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
  
  const setInputRef = (el: HTMLInputElement | null, key: string) => {
    if (el) {
      editInputs.value[key] = el
    } else if (editInputs.value[key]) {
      delete editInputs.value[key]
    }
  }
  
  defineOptions({
    name: 'FileExplorer'
  })

  const props = defineProps<{
    rootPath: string | undefined
  }>()

  // 监听 rootPath 变化
  watch(() => props.rootPath, async (newPath) => {
    if (newPath) {
      try {
        const result = await fileSystem.refreshFolder(newPath)
        if (result) {
          folderData.value = result
        }
      } catch (error) {
        console.error('加载文件夹失败:', error)
      }
    }
  }, { immediate: true })

  // 监听文件夹数据变化
  watch(() => folderData.value?.directoryPath, async (newPath) => {
    if (newPath && newPath !== props.rootPath) {
      try {
        const result = await fileSystem.refreshFolder(newPath)
        if (result) {
          folderData.value = result
        }
      } catch (error) {
        console.error('刷新文件夹失败:', error)
      }
    }
  })

  const updateFolderData = (data: FolderData) => {
    folderData.value = data
  }

  defineExpose({
    updateFolderData
  })

  const emit = defineEmits<{
    (e: 'settings'): void
    (e: 'select-file', path: string): void
  }>()
  </script>
  
  <style scoped>
  .file-explorer {
    height: 100%;
    overflow: auto;
  }
  
  .tree-content {
    padding: 8px;
  }
  
  .tree-item {
    cursor: pointer;
  }
  
  .tree-item-content {
    display: flex;
    align-items: center;
    padding: 4px 0;
  }
  
  .tree-item-content.selected {
    border: 1px solid #0078d4;
    border-radius: 4px;
    background-color: rgba(0, 120, 212, 0.1);
  }
  
  .tree-item-content:hover {
    background-color: rgba(128, 128, 128, 0.1);
  }
  
  .tree-children {
    padding-left: 24px;
  }
  
  .edit-container {
    flex: 1;
  }
  
  .edit-container input {
    width: 100%;
    background: transparent;
    border: 1px solid #666;
    color: inherit;
    padding: 2px 4px;
    outline: none;
    border-radius: 2px;
  }
  
  .edit-container input:focus {
    border-color: #0078d4;
  }
  
  .context-menu {
    position: fixed;
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 4px 0;
    min-width: 160px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .menu-item:hover {
    background-color: #2c2c2c;
  }
  
  .menu-icon {
    margin-right: 8px;
    font-size: 18px;
  }
  
  .menu-item-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .menu-item-disabled:hover {
    background-color: transparent;
  }
  </style> 