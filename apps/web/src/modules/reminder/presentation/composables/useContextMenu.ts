import { ref } from 'vue';

interface MenuItem {
  label: string;
  icon: string;
  action: () => void;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  items: MenuItem[];
}

export function useContextMenu() {
  const contextMenu = ref<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    items: [
      {
        label: '操作一',
        icon: 'mdi-pencil',
        action: () => alert('点击了操作一'),
      },
      {
        label: '操作二',
        icon: 'mdi-delete',
        action: () => alert('点击了操作二'),
      },
    ],
  });

  const showContextMenu = (e: MouseEvent, items: MenuItem[]) => {
    // 获取鼠标坐标
    const x = e.clientX;
    const y = e.clientY;

    // 假设菜单宽高
    const menuWidth = 160;
    const menuHeight = 120;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > viewportWidth) {
      adjustedX = x - menuWidth;
    }
    if (y + menuHeight > viewportHeight) {
      adjustedY = y - menuHeight;
    }

    contextMenu.value = {
      show: true,
      x: Math.max(0, adjustedX),
      y: Math.max(0, adjustedY),
      items: items,
    };
    console.log('Context menu shown at:', adjustedX, adjustedY);
  };

  const closeContextMenu = () => {
    contextMenu.value.show = false;
  };

  // Close context menu when clicking outside or pressing Escape
  const handleGlobalClick = () => {
    closeContextMenu();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeContextMenu();
    }
  };

  // Add global event listeners
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeydown);
  }

  return {
    contextMenu,
    showContextMenu,
    closeContextMenu,
  };
}
