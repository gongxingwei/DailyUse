import { ref, computed } from 'vue';
import { useQuickLauncherStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

export function useCategoryManagement() {
    const store = useQuickLauncherStore();
    const showRenameDialog = ref(false);
    const newCategoryName = ref('');
    const selectedCategoryId = computed(() => store.state.selectedCategoryId);
    /*
     * 创建分类
     */
    function createCategory() {
        const newCategory = {
            uuid: uuidv4(),
            name: 'New Category',
            items: []
        };
        store.addCategory(newCategory);

    }
    /*
     * 删除分类
     */
    function deleteCategory() {
        if (!selectedCategoryId.value) return;
        const categoryId = selectedCategoryId.value;
        store.removeCategory(categoryId);
    }
    /*
     * 重命名分类
     */
    function renameCategory() {
        if (!selectedCategoryId.value) return;
        const category = store.getCategoryById(selectedCategoryId.value);
        if (!category) return;
        newCategoryName.value = category.name;
        showRenameDialog.value = true;
    }
    const confirmRenameCategory = () => {
        if (newCategoryName.value && selectedCategoryId.value) {
            store.updateCategory(selectedCategoryId.value, { name: newCategoryName.value });
            showRenameDialog.value = false;
            newCategoryName.value = '';
        }
    };
    /*
     * 创建分类
     */


    return {
        showRenameDialog,
        newCategoryName,
        createCategory,
        deleteCategory,
        renameCategory,
        confirmRenameCategory,
    };
}
