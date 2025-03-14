async function getLinkFileTargetPath(shortcutPath: string): Promise<string> {
  const targetPath = await window.shared.ipcRenderer.invoke('get-link-file-target-path', shortcutPath);
  return targetPath;
}

async function getFileIcon(filePath: string): Promise<string> {
  try {
    const iconBase64 = await window.shared.ipcRenderer.invoke('get-file-icon', filePath);
    return iconBase64 || 'mdi-application';
  }
  catch (error) {
    console.warn('[Drop] 获取文件图标失败:', error);
    return 'mdi-application';
  }
}

function revealInExplorer(filePath: string) {
  const result = window.shared.ipcRenderer.invoke('reveal-in-explorer', filePath);
  return result;
}

function addTitle(title: string) {
  return title;
}

function hideWindow() {
  const result = window.shared.ipcRenderer.invoke('hide-window');
  return result;
}


export { getLinkFileTargetPath, addTitle, getFileIcon, revealInExplorer, hideWindow };