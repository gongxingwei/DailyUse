<template>
  <div class="quick-launcher">
    <v-card class="quick-launcher-card" elevation="0">
      <v-card-title class="title d-flex align-center pa-4 draggable">
        <v-icon size="24" class="mr-2">mdi-rocket-launch</v-icon>
        {{ t('quickLauncher.title') }}
        <v-spacer></v-spacer>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-0">
        <v-row no-gutters style="height: 500px;">
          <!-- Left side: Categories -->
          <v-col cols="2" class="border-r">
            <v-list density="compact" class="h-100" @contextmenu.stop.prevent="showCategoryListAreaContextMenu($event, categoryListAreaContextMenuItems)">
              <Draggable v-model="store.categories" group="categories" item-key="id" @end="handleDragEnd">
                <template #item="{ element: category }">
                  <v-list-item :value="category.uuid" :title="category.name"
                    :class="{ 'focused': selectedCategoryId === category.uuid }" tabindex="0"
                    @click="store.state.selectedCategoryId = category.uuid"
                    @keydown="handleKeydown($event, category)"
                    @contextmenu.stop.prevent="showCategoryListItemContextMenu($event, category.uuid, categoryListItemContextMenuItems)">
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
            <v-container class="pa-4 h-100" @dragenter.prevent @dragover.prevent @drop.prevent="addShortcutByDrop"
              @contextmenu.stop.prevent="showShortcutListAreaContextMenu($event, shortcutListAreaContextMenuItems)">
              <Draggable v-model="currentCategoryItems" item-key="id" class="shortcuts-grid" @end="handleDragEnd">
                <template #item="{ element }">
                  <v-card class="shortcut-item ma-2" elevation="2" @click="launchItem(element)"
                    tabindex="0"
                    @contextmenu.stop.prevent="showShortcutListItemContextMenu($event, element.uuid, shortcutListItemContextMenuItems)" draggable="true">
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
import { computed, watch } from 'vue';
import { useQuickLauncherStore } from '../store';
import { ShortcutItem, ShortcutCategory } from '../types';
import Draggable from 'vuedraggable';

import ContextMenu from '@/shared/components/ContextMenu.vue';

import DialogForEdit from '@/shared/components/DialogForEdit.vue';
import { useI18n } from 'vue-i18n';

import { useContextMenu } from '../composables/useContextMenu';
import { useShortcutManagement } from '../composables/useShortcutManagement';
import { useCategoryManagement } from '../composables/useCategoryManagement';
// import { useFileHandlers } from '../utils/fileHandlers';

const {
  showContextMenu,
  contextMenuX,
  contextMenuY,
  contextMenuItems,
  selectedItem,
  getCategoryListAreaContextMenuItems,
  getCategoryListItemContextMenuItems,
  showCategoryListAreaContextMenu,
  showCategoryListItemContextMenu,
  getShortcutListAreaContextMenuItems,
  getShortcutListItemContextMenuItems,
  showShortcutListAreaContextMenu,
  showShortcutListItemContextMenu
} = useContextMenu();



const {
  editingShortcut,
  shortcutForEdit,
  showEditShortcutDialog,
  addTitle,
  addShortcut,
  addShortcutByDrop,
  deleteShortcut,
  openShortcutLocation,
  editShortcut,
  handleShortcutEdit,
  launchItem,
} = useShortcutManagement();

const {
  showRenameDialog,
  newCategoryName,
  createCategory,
  renameCategory,
  deleteCategory,
  confirmRenameCategory
} = useCategoryManagement();

// const { handleDrop } = useFileHandlers();
const { t } = useI18n();
const store = useQuickLauncherStore();

const categoryListAreaContextMenuItems = getCategoryListAreaContextMenuItems(createCategory);
const categoryListItemContextMenuItems = getCategoryListItemContextMenuItems(renameCategory, deleteCategory);
const shortcutListAreaContextMenuItems = getShortcutListAreaContextMenuItems(addShortcut, addTitle);
const shortcutListItemContextMenuItems = getShortcutListItemContextMenuItems(editShortcut, deleteShortcut, openShortcutLocation);
const selectedCategoryId = computed(() => store.state.selectedCategoryId);

// Watch for store changes
watch(() => store.categories, (newCategories) => {
  if (newCategories.length > 0 && !newCategories.find(c => c.uuid === store.state.selectedCategoryId)) {
    store.state.selectedCategoryId = newCategories[0].uuid;
  }
}, { deep: true });

// 获取当前选中的类别的快捷方式
const currentCategoryItems = computed({
  get: () => {
    const category = store.categories.find(c => c.uuid === store.state.selectedCategoryId);
    return category?.items || [];
  },
  set: (items) => {
    const category = store.categories.find(c => c.uuid === store.state.selectedCategoryId);
    if (category) {
      store.updateCategory(category.uuid, { ...category, items });
    }
  }
});

function handleDragEnd(_event: any) {

}

function handleKeydown(event: KeyboardEvent, item: ShortcutCategory | ShortcutItem) {
  switch (event.key) {
    case 'F2':
      event.preventDefault();
      if ('items' in item) {
        selectedItem.value = item;
        newCategoryName.value = item.name;
        showRenameDialog.value = true;
      } else {
        editingShortcut.value = item;
        shortcutForEdit.value = {
          uuid: item.uuid,
          name: item.name,
          path: item.path ||'',
          icon: item.icon || '',
          description: item.description || '',
        };
        showEditShortcutDialog.value = true;
      }
      break;

    case 'Delete':
      event.preventDefault();
      if ('items' in item) {
        store.removeCategory(item.uuid);
      } else {
        store.removeShortcut(store.state.selectedCategoryId, item.uuid);
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
  background-color: rgba(var(--v-theme-surface-bright), 0.19);
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
