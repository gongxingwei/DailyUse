// composables/useShortcutManagement.ts
import { ref, computed } from 'vue';
import { useQuickLauncherStore } from '../store';
import { ShortcutItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getLinkFileTargetPath, addTitle, getFileIcon, revealInExplorer, hideWindow } from '../utils/utils';
export function useShortcutManagement() {
  const store = useQuickLauncherStore();
  const editingShortcut = ref<ShortcutItem | null>(null);
  const showEditShortcutDialog = ref(false);
  const shortcutForEdit = ref({
    uuid: '',
    name: '',
    path: '',
    icon: '',
    description: '',
  });

  const selectedCategoryId = computed(() => store.state.selectedCategoryId);
  const selectedItemId = computed(() => store.state.selectedItemId);
  /*
   * 添加快捷方式
   * @param categoryId 分类 ID
   */
  async function addShortcut(categoryId: string) {
    const result = await window.shared.ipcRenderer.invoke('select-file');

    if (result && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileName = filePath.split('\\').pop()?.replace(/\.[^/.]+$/, "") || '';
      const icon = await getShortcutIcon(filePath);

      const shortcut: ShortcutItem = {
        uuid: uuidv4(),
        name: fileName,
        path: filePath,
        description: '',
        icon,
        lastUsed: new Date(),
        category: categoryId
      };

      store.addShortcut(categoryId, shortcut);
    }
  }

  async function getShortcutIcon(filePath: string): Promise<string> {
    try {
      const iconBase64 = await window.shared.ipcRenderer.invoke('get-file-icon', filePath);
      return iconBase64 || 'mdi-application';
    } catch (error) {
      console.warn('获取文件图标失败:', error);
      return 'mdi-application';
    }
  }

  async function launchItem(item: ShortcutItem) {
    try {
      hideWindow();
      await window.shared.ipcRenderer.invoke('launch-application', item.path);
      store.recordItemUsage(item.uuid);
    } catch (error) {
      console.error('Failed to launch application:', error);
    }
  }

  /*
   * 拖拽方式添加快捷方式
   */
  async function addShortcutByDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
  
    if (files && files.length > 0) {

      console.log(files)
      for (const file of Array.from(files)) {
        try {
          let targetPath = (file as any).path;

          if (targetPath.endsWith('.lnk')) {
            targetPath = await getLinkFileTargetPath(targetPath);
          }

          const base64Icon = await getFileIcon(targetPath);

          const shortcut: ShortcutItem = {
            uuid: uuidv4(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            path: targetPath,
            description: '',
            icon: base64Icon,
            lastUsed: new Date(),
            category: store.state.selectedCategoryId
          };

          store.addShortcut(store.state.selectedCategoryId, shortcut);
        } catch (error) {
          console.error(`Error processing dropped file: ${(file as any).path}`, error);
        }
      }
    } else {

    }
  }
  /*
   * 删除快捷方式
   */
  function deleteShortcut() {
    if (selectedCategoryId && selectedItemId) {


      store.removeShortcut(selectedCategoryId.value, selectedItemId.value);
    }
  }
  /*
   * 编辑快捷方式
   */
  function editShortcut() {
    if (!selectedItemId) return false;

    const item = store.getItemById(selectedItemId.value);
    if (!item) return false;

    editingShortcut.value = item;

    const { uuid, name, path, icon, description, } = editingShortcut.value;
    shortcutForEdit.value = { uuid, name, path, icon, description: description || '' };
    showEditShortcutDialog.value = true;
  }

  async function handleShortcutEdit(data: Record<string, any>) {
    if (editingShortcut.value && store.state.selectedCategoryId) {
      const updatedShortcut: ShortcutItem = {
        ...editingShortcut.value,
        name: data.name,
        description: data.description
      };

      store.updateShortcut(store.state.selectedCategoryId, updatedShortcut.uuid, updatedShortcut);
      editingShortcut.value = null;
    }
  }
  /*
   * 在资源管理器中打开快捷方式所在位置
   */
  function openShortcutLocation() {
    if (!selectedItemId) return;
    const item = store.getItemById(selectedItemId.value);
    if (!item) return;
    const path = item.path;
    revealInExplorer(path);

  }
  /*
   * 删除快捷方式
   */

  /*
   * 删除快捷方式
   */
  return {
    editingShortcut,
    shortcutForEdit,
    showEditShortcutDialog,
    addTitle,
    addShortcut,
    addShortcutByDrop,
    getShortcutIcon,
    deleteShortcut,
    openShortcutLocation,
    editShortcut,
    handleShortcutEdit,
    launchItem,
  };
}