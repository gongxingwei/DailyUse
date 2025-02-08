

async function getShortcutTargetPath(shortcutPath: string): Promise<string> {
  const targetPath = await window.shared.ipcRenderer.invoke('get-shortcut-target-path', shortcutPath);
  return targetPath;
}

function addTitle(title: string) {
  return title;
}

export { getShortcutTargetPath, addTitle };