import { ref, computed } from 'vue';
import { GridItem } from '../../../../../common/modules/reminder/types/reminder';
import { useReminderStore } from '../stores/reminderStore';
import { ReminderTemplateGroup } from '../../domain/aggregates/reminderTemplateGroup';

export function useReminderGrid() {
  const reminderStore = useReminderStore();

  const selectedItem = ref<GridItem | null>(null);
  const isDetailPanelOpen = ref(false);

  const allGridItems = computed<GridItem[]>(() => {
    const groupItems: ReminderTemplateGroup[] = reminderStore.getAllReminderGroupExceptSystemGroup;
    const systemGroup = reminderStore.getSystemGroup;

    const allGridItems: GridItem[] = [...(systemGroup?.templates ?? []), ...groupItems];
    console.log('所有网格项:', allGridItems);
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
