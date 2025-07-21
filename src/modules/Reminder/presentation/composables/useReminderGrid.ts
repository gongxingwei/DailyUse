import { ref, computed } from "vue";
import { GridItem } from "../../../../../common/modules/reminder/types/reminder";
import { useReminderStore } from "../stores/reminderStore";

export function useReminderGrid() {
  const reminderStore = useReminderStore();

  const selectedItem = ref<GridItem | null>(null);
  const isDetailPanelOpen = ref(false);

  const allGridItems = computed<GridItem[]>(() => {
    const templateItems: GridItem[] = reminderStore.getReminderTemplates;
    const groupItems: GridItem[] = reminderStore.getReminderGroups;
    const allGridItems: GridItem[] = [...templateItems, ...groupItems];
    console.log("所有网格项:", allGridItems);
    return allGridItems;
  });

  const selectItem = (item: GridItem) => {
    selectedItem.value = item;
    isDetailPanelOpen.value = true;
  };

  const closeDetailPanel = () => {
    isDetailPanelOpen.value = false;
    selectedItem.value = null;
  };



  return {
    allGridItems,
    selectedItem,
    isDetailPanelOpen,
    selectItem,
    closeDetailPanel,
  };
}
