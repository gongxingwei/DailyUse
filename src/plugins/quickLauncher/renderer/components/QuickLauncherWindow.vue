<template>
  <div class="quick-launcher">
    <v-card class="quick-launcher-card" elevation="0">
      <v-card-title class="title d-flex align-center pa-4 draggable">
        <v-icon size="24" class="mr-2">mdi-rocket-launch</v-icon>
        {{ t('quickLauncher.title') }}
        <v-spacer></v-spacer>
        <!-- <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" :label="t('quickLauncher.search')"
          variant="outlined" density="compact" hide-details class="ml-4" style="max-width: 300px" clearable
          @keydown.enter="handleEnter" autofocus></v-text-field> -->
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-0">
        <v-row no-gutters style="height: 500px;">
          <!-- Left side: Categories -->
          <v-col cols="2" class="border-r">
            <v-list density="compact" class="h-100" @contextmenu.stop.prevent="showCategoryListAreaContextMenu($event)">
              <Draggable v-model="store.categories" group="categories" item-key="id" @end="handleDragEnd">
                <template #item="{ element: category }">
                  <v-list-item :value="category.id" :title="category.name"
                    :class="{ 'focused': focusedItem === category.id }" tabindex="0"
                    @click="selectedCategory = category.id" @focus="focusedItem = category.id"
                    @blur="focusedItem = null" @keydown="handleKeydown($event, category)"
                    @contextmenu.stop.prevent="showCategoryListItemContextMenu($event, category)">
                    <template #title>
                      {{ category.name }}
                    </template>
                  </v-list-item>
                </template>
              </Draggable>
            </v-list>
          </v-col>

          <v-divider vertical></v-divider>
          <!-- Right side: Shortcuts -->
          <v-col cols="10" class="shortcuts-container">
            <v-container class="pa-4 h-100" @dragenter.prevent @dragover.prevent @drop.prevent="handleDrop"
              @contextmenu.stop.prevent="showShortcutAreaContextMenu($event)">
              <Draggable v-model="currentCategoryItems" item-key="id" class="shortcuts-grid" @end="handleDragEnd">
                <template #item="{ element }">
                  <v-card class="shortcut-item ma-2" elevation="2" @click="launchItem(element)"
                    @focus="focusedItem = element.id" @blur="focusedItem = null" tabindex="0"
                    @contextmenu.stop.prevent="showShortcutItemContextMenu($event, element)" draggable="true">
                    <v-card-text class="text-center shortcut-content">
                      <img v-if="element.icon.startsWith('data:image')" :src="element.icon"
                        class="shortcut-icon mb-2" />
                      <v-icon v-else size="32" class="shortcut-icon mb-2">{{ element.icon || 'mdi-application'
                      }}</v-icon>
                      <div class="text-caption shortcut-name">{{ element.name }}</div>
                    </v-card-text>
                  </v-card>
                </template>
              </Draggable>

              <div v-if="!currentCategoryItems.length" class="empty-state">
                <v-icon size="48" color="grey-lighten-1">mdi-drag-variant</v-icon>
                <div class="text-grey mt-2">{{ t('quickLauncher.shortcut.emptyState') }}</div>
              </div>
            </v-container>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Category Context Menu -->
    <ContextMenu v-model="showContextMenu" :x="contextMenuX" :y="contextMenuY" :items="contextMenuItems"
      :target="selectedItem" />

    <!-- Rename Category Dialog -->
    <v-dialog v-model="showRenameDialog" max-width="400">
      <v-card>
        <v-card-title class="pa-4">
          <v-icon size="24" class="mr-2">mdi-pencil</v-icon>
          {{ t('quickLauncher.dialog.rename.title') }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-text-field v-model="newCategoryName" :label="t('quickLauncher.dialog.rename.label')" variant="outlined"
            density="compact" autofocus @keyup.enter="confirmRenameCategory"></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showRenameDialog = false">
            {{ t('quickLauncher.button.cancel') }}
          </v-btn>
          <v-btn color="primary" class="ml-2" @click="confirmRenameCategory">
            {{ t('quickLauncher.button.rename') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Shortcut Dialog -->
    <DialogForEdit v-model="showEditShortcutDialog" :title="t('quickLauncher.dialog.edit.title')" icon="mdi-pencil"
      :data="shortcutForEdit" @confirm="handleShortcutEdit" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuickLauncherStore } from '../../store';
import { ShortcutItem, ShortcutCategory } from '../../types';
import Draggable from 'vuedraggable';
import { v4 as uuidv4 } from 'uuid';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { getShortcutTargetPath, addTitle } from '../../utils';
import DialogForEdit from '@/shared/components/DialogForEdit.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const store = useQuickLauncherStore();
const selectedCategory = ref('');

// Context menu
const contextMenuItems = ref([] as any[]);
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuCategory = ref<ShortcutCategory | null>(null);
const contextMenuShortcut = ref<ShortcutItem | null>(null);
const selectedItem = ref<any>(null);
const focusedItem = ref<string | null>(null);

const newShortcut = ref({
  name: '',
  path: '',
  description: '',
  icon: '',
});

const showRenameDialog = ref(false);
const newCategoryName = ref('');

const showEditShortcutDialog = ref(false);
const editingShortcut = ref<ShortcutItem | null>(null);
const shortcutForEdit = ref({
  name: '',
  description: ''
});
const categoryListAreaContextMenuItems = [
  { value: 'newCategory', title: t('quickLauncher.category.new'), action: createCategory }
]

const categoryListItemContextMenuItems = [
  { value: 'renameCategory', title: t('quickLauncher.category.rename'), action: renameCategory },
  { value: 'deleteCategory', title: t('quickLauncher.category.delete'), className: 'text-error', action: deleteCategory },
  { divider: true },
  ...categoryListAreaContextMenuItems
]

const shortcutAreaContextMenuItems = [
  { value: 'newShortcut', title: t('quickLauncher.shortcut.new'), action: addShortcut },
  { value: 'newTitle', title: t('quickLauncher.shortcut.newTitle'), action: addTitle },
  { divider: true },
]

const shortcutItemContextMenuItems = [
  { value: 'editShortcut', title: t('quickLauncher.shortcut.edit'), action: editShortcut },
  { value: 'deleteShortcut', title: t('quickLauncher.shortcut.delete'), className: 'text-error', action: deleteShortcut },
  { divider: true },
  ...shortcutAreaContextMenuItems
]


// 右键菜单
function showCategoryListAreaContextMenu(e: MouseEvent) {
  contextMenuItems.value = categoryListAreaContextMenuItems;
  showContextMenu.value = true;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
}

function showCategoryListItemContextMenu(e: MouseEvent, category: ShortcutCategory) {
  e.preventDefault();
  selectedItem.value = category;
  contextMenuItems.value = categoryListItemContextMenuItems;
  showContextMenu.value = true;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuCategory.value = category;
}

function showShortcutAreaContextMenu(e: MouseEvent) {
  e.preventDefault();
  contextMenuItems.value = shortcutAreaContextMenuItems;
  showContextMenu.value = true;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuCategory.value = store.categories.find(c => c.id === selectedCategory.value) || null;
  contextMenuShortcut.value = null;
}

function showShortcutItemContextMenu(e: MouseEvent, item: ShortcutItem) {
  e.preventDefault();
  selectedItem.value = item;
  contextMenuItems.value = shortcutItemContextMenuItems;
  showContextMenu.value = true;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuCategory.value = store.categories.find(c => c.id === selectedCategory.value) || null;
  contextMenuShortcut.value = item;
}

// 分类区域右键菜单处理函数
function createCategory() {
  const newCategory = {
    id: uuidv4(),
    name: 'New Category',
    items: []
  };
  store.addCategory(newCategory);
  showContextMenu.value = false;
}

function renameCategory() {
  if (selectedItem.value) {
    newCategoryName.value = selectedItem.value.name;
    showRenameDialog.value = true;
    showContextMenu.value = false;
  }
}

function deleteCategory() {
  const category = contextMenuCategory.value;
  if (category && 'id' in category) {
    store.removeCategory(category.id);
    showContextMenu.value = false;
  }
}

// 快捷方式区域右键菜单处理函数


async function addShortcut() {
  // 重置 newShortcut
  newShortcut.value = {
    name: '',
    path: '',
    description: '',
    icon: ''
  };

  const result = await window.shared.ipcRenderer.invoke('select-file');
  const shortcutIcon = async (filePath: string): Promise<string> => {
    try {
      const iconBase64 = await window.shared.ipcRenderer.invoke('get-file-icon', filePath);
      return iconBase64 || 'mdi-application';
    } catch (error) {
      console.warn('获取文件图标失败:', error);
      return 'mdi-application';
    }
  };

  if (result && result.filePaths && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    // 从文件路径获取文件名
    const fileName = filePath.split('\\').pop()?.replace(/\.[^/.]+$/, "") || '';

    // 创建新的快捷方式
    const shortcut: ShortcutItem = {
      id: uuidv4(),
      name: fileName,
      path: filePath,
      description: '',
      icon: await shortcutIcon(filePath),
      lastUsed: new Date(),
      category: selectedCategory.value
    };

    // 保存到 store
    store.addShortcut(selectedCategory.value, shortcut);
  }
}

async function launchItem(item: ShortcutItem) {
  try {
    closeWindow();
    await window.shared.ipcRenderer.invoke('launch-application', item.path);
    store.recordItemUsage(item.id);
  } catch (error) {
    console.error('Failed to launch application:', error);
  }
}

function deleteShortcut() {
  if (contextMenuShortcut.value && selectedCategory.value) {
    store.removeShortcut(selectedCategory.value, contextMenuShortcut.value.id);
    showContextMenu.value = false;
  }
}

function editShortcut() {
  if (selectedItem.value) {
    editingShortcut.value = selectedItem.value;
    const { name, description } = selectedItem.value;
    shortcutForEdit.value = { name, description: description || '' };
    showEditShortcutDialog.value = true;
    showContextMenu.value = false;
  }
}

async function handleShortcutEdit(data: Record<string, any>) {
  if (editingShortcut.value && selectedCategory.value) {
    const updatedShortcut: ShortcutItem = {
      ...editingShortcut.value,
      name: data.name,
      description: data.description
    };

    store.updateShortcut(selectedCategory.value, updatedShortcut.id, updatedShortcut);
    editingShortcut.value = null;
  }
}

// Initialize store and select first category
onMounted(() => {
  if (store.categories.length === 0) {
    const defaultCategory = {
      id: uuidv4(),
      name: t('quickLauncher.category.defaultName'),
      icon: 'mdi-folder'
    };
    store.addCategory(defaultCategory);
    selectedCategory.value = defaultCategory.id;
  } else {
    selectedCategory.value = store.categories[0].id;
  }
});

// Watch for store changes
watch(() => store.categories, (newCategories) => {
  if (newCategories.length > 0 && !newCategories.find(c => c.id === selectedCategory.value)) {
    selectedCategory.value = newCategories[0].id;
  }
}, { deep: true });

const currentCategoryItems = computed({
  get: () => {
    const category = store.categories.find(c => c.id === selectedCategory.value);
    return category?.items || [];
  },
  set: (items) => {
    const category = store.categories.find(c => c.id === selectedCategory.value);
    if (category) {
      store.updateCategory(category.id, { ...category, items });
    }
  }
});

// async function handleEnter() {
//   const items = filteredItems.value;
//   if (items.length > 0) {
//     await launchItem(items[0]);
//   }
// }

function closeWindow() {
  window.close();
}

// Add confirmRenameCategory method
const confirmRenameCategory = () => {
  if (newCategoryName.value && selectedItem.value) {
    store.updateCategory(selectedItem.value.id, { name: newCategoryName.value });
    showRenameDialog.value = false;
    newCategoryName.value = '';
  }
};

async function handleDrop(event: DragEvent) {

  event.preventDefault();
  const files = event.dataTransfer?.files;

  const shortcutIcon = async (filePath: string): Promise<string> => {
    try {
      const iconBase64 = await window.shared.ipcRenderer.invoke('get-file-icon', filePath);
      return iconBase64 || 'mdi-application';
    } catch (error) {
      console.warn('[Drop] 获取文件图标失败:', error);
      return 'mdi-application';
    }
  };

  if (files && files.length > 0) {
    console.log('[Drop] 开始处理文件, 数量:', files.length);
    Array.from(files).forEach(async (file) => {
      const targetPath = await getShortcutTargetPath((file as any).path);
      const base64Icon = await shortcutIcon(targetPath);

      const shortcut: ShortcutItem = {
        id: uuidv4(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        path: targetPath,
        description: '',
        icon: base64Icon,
        lastUsed: new Date(),
        category: selectedCategory.value
      };


      store.addShortcut(selectedCategory.value, shortcut);

    });
  } else {
    console.log('[Drop] 没有检测到文件');
  }
}

function handleDragEnd(_event: any) {

}

function handleKeydown(event: KeyboardEvent, item: ShortcutCategory | ShortcutItem) {
  switch (event.key) {
    case 'F2':
      event.preventDefault();
      // Start rename
      if ('items' in item) { // Category
        selectedItem.value = item;
        newCategoryName.value = item.name;
        showRenameDialog.value = true;
      } else { // Shortcut
        editingShortcut.value = item;
        shortcutForEdit.value = {
          name: item.name,
          description: item.description || ''
        };
        showEditShortcutDialog.value = true;
      }
      break;

    case 'Delete':
      event.preventDefault();
      if ('items' in item) {
        store.removeCategory(item.id);
      } else {
        store.removeShortcut(selectedCategory.value, item.id);
      }
      break;

    case 'Enter':
      event.preventDefault();
      if (!('items' in item)) {
        launchItem(item);
      }
      break;

    // Arrow keys for navigation
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault();

      break;
  }
}

</script>

<style scoped>
.quick-launcher {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.quick-launcher-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title {
  height: 45px;
}

.draggable {
  -webkit-app-region: drag;
}

.draggable .v-text-field {
  -webkit-app-region: no-drag;
}

.border-r {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.shortcuts-container {
  height: 100%;
  overflow-y: auto;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 90px);
  /* Fixed width columns */
  gap: 0;
  padding: 0;
  justify-content: center;
  /* Center the grid items */
}

.shortcut-item {
  width: 64x;
  /* Fixed width */
  height: 80px;
  /* Fixed height */
  cursor: pointer;
  transition: all 0.3s;
}

.shortcut-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.shortcut-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.shortcut-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px !important;
  /* Override v-card-text padding */
}

.shortcut-name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

/* 右键菜单样式 */
:deep(.text-error) {
  color: #ff4d4f !important;
}

.focused {
  outline: 2px solid var(--v-primary-base) !important;
  outline-offset: -2px;
}

.v-list-item,
.shortcut-item {
  outline: none;
  user-select: none;
}

.v-list-item:focus-visible,
.shortcut-item:focus-visible {
  outline: 2px solid var(--v-primary-base);
  outline-offset: -2px;
}
</style>
