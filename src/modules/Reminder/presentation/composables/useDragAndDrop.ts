import { ref } from 'vue';
import { GridItem, GridPosition } from '../../domain/entities/ReminderTemplateGroup';

export function useDragAndDrop() {
  const isDragging = ref(false);
  const draggedItem = ref<GridItem | null>(null);
  const dropTarget = ref<GridItem | null>(null);

  const startDrag = (item: GridItem, event: DragEvent) => {
    isDragging.value = true;
    draggedItem.value = item;
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id);
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (item: GridItem | null, event: DragEvent) => {
    event.preventDefault();
    dropTarget.value = item;
  };

  const handleDragLeave = () => {
    dropTarget.value = null;
  };

  const handleDrop = (targetItem: GridItem | null, position: GridPosition, event: DragEvent) => {
    event.preventDefault();
    
    if (!draggedItem.value) return null;

    const result = {
      draggedItem: draggedItem.value,
      targetItem,
      newPosition: position,
      isDroppedOnGroup: targetItem?.type === 'group'
    };

    // Reset drag state
    isDragging.value = false;
    draggedItem.value = null;
    dropTarget.value = null;

    return result;
  };

  const cancelDrag = () => {
    isDragging.value = false;
    draggedItem.value = null;
    dropTarget.value = null;
  };

  // Check if a template can be dropped into a group
  const canDropIntoGroup = (draggedItem: GridItem, targetGroup: GridItem): boolean => {
    if (draggedItem.type !== 'template') return false;
    if (targetGroup.type !== 'group') return false;
    if (draggedItem.id === targetGroup.id) return false;
    
    // Check if template is already in the group
    return !targetGroup.data.reminderTemplates.includes(draggedItem.id);
  };

  // Calculate drop position based on mouse coordinates
  const calculateDropPosition = (event: DragEvent, gridSize: number): GridPosition => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / gridSize);
    const y = Math.floor((event.clientY - rect.top) / gridSize);
    
    return { x: Math.max(0, x), y: Math.max(0, y) };
  };

  return {
    isDragging,
    draggedItem,
    dropTarget,
    startDrag,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    cancelDrag,
    canDropIntoGroup,
    calculateDropPosition
  };
}
