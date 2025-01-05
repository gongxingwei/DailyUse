import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { promises as fs } from 'fs';


const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'DailyUse.svg'),
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.mjs'),
    },
    width: 1400,
    height: 800,
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // 可选：设置最小窗口大小
  win.setMinimumSize(800, 600)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// 创建文件夹
ipcMain.handle('createFolder', async (_event, filePath: string) => {
  await fs.mkdir(filePath, { recursive: true });
});

// 创建文件
ipcMain.handle('createFile', async (_event, filePath: string, content: string = '') => {
  await fs.writeFile(filePath, content, 'utf8');
});

// 删除文件或文件夹
ipcMain.handle('deleteFileOrFolder', async (_event, path: string, isDirectory: boolean) => {
  if (isDirectory) {
    await fs.rm(path, { recursive: true, force: true });
  } else {
    await fs.unlink(path);
  }
});

// 选择文件夹
ipcMain.handle('selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  } else {
    const folderPath = result.filePaths[0];
    const files = await fs.readdir(folderPath).then((fileNames) =>
      Promise.all(
        fileNames.map(async (fileName) => {
          const filePath = path.join(folderPath, fileName);
          const stats = await fs.lstat(filePath);
          return {
            name: fileName,
            path: filePath,
            isDirectory: stats.isDirectory(),
          };
        })
      )
    );
    return { folderPath, files };
  }
});

// 读取文件
ipcMain.handle('readFile', async (_event, filePath) => {
  return await fs.readFile(filePath, 'utf8');
});

// 写入文件
ipcMain.handle('writeFile', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('写入文件失败:', error);
    throw error;
  }
});

// 获取根目录
ipcMain.handle('getRootDir', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (!result.canceled) {
    const directoryPath = result.filePaths[0];
    const folderTreeData = await generateTree(directoryPath);
    return { folderTreeData, directoryPath };
  }

  return null;
});

async function generateTree(dir: string): Promise<any[]> {
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    const children = await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(dir, item.name);
        const fileType = item.isDirectory() ? 'directory' : path.extname(item.name).slice(1) || 'file';
        if (item.isDirectory()) {
          return {
            title: item.name,
            key: fullPath,
            fileType: fileType,
            children: await generateTree(fullPath),
          };
        } else {
          return {
            title: item.name,
            key: fullPath,
            fileType: fileType,
            isLeaf: true,
          };
        }
      })
    );
    return children.filter(Boolean);
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

// // 复制文件或文件夹
// ipcMain.handle('copy', async (_event, sourcePath: string, targetPath: string, isDirectory: boolean) => {
//   try {
//     // 检查目标是否存在
//     const exists = await fs.access(targetPath)
//       .then(() => true)
//       .catch(() => false);

//     if (exists) {
//       // 弹出确认对话框
//       const { response } = await dialog.showMessageBox({
//         type: 'question',
//         buttons: ['覆盖', '取消'],
//         defaultId: 1,
//         title: '确认覆盖',
//         message: '目标文件/文件夹已存在，是否覆盖？',
//         detail: `目标路径: ${targetPath}`
//       });

//       // 用户选择取消
//       if (response === 1) {
//         return false;
//       }
//     }

//     // 执行复制
//     if (isDirectory) {
//       await fs.cp(sourcePath, targetPath, { 
//         recursive: true,
//         force: true,  // 改为 true 允许覆盖
//         preserveTimestamps: true
//       });
//     } else {
//       await fs.copyFile(sourcePath, targetPath);
//     }
//     return true;
//   } catch (error) {
//     console.error('Copy error:', error);
//     throw error;
//   }
// });

// 重命名文件或文件夹
ipcMain.handle('renameFileOrFolder', async (_event, oldPath: string, newPath: string) => {
  try {
    // 检查新路径是否已存在
    const exists = await fs.access(newPath)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      // 如果目标已存在，弹出确认对话框
      const { response } = await dialog.showMessageBox({
        type: 'question',
        buttons: ['覆盖', '取消'],
        defaultId: 1,
        title: '确认覆盖',
        message: '目标已存在，是否覆盖？',
        detail: `目标路径: ${newPath}`
      });

      if (response === 1) {
        return false;
      }
    }

    // 执行重命名
    await fs.rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error('Rename error:', error);
    throw error;
  }
});

// 读取剪贴板文本
ipcMain.handle('readClipboard', () => {
  return clipboard.readText();
});

// 写入剪贴板文本
ipcMain.handle('writeClipboard', (_event, text: string) => {
  clipboard.writeText(text);
});

// 读取剪贴板文件列表
ipcMain.handle('readClipboardFiles', () => {
  // 在 Windows 上，可以通过 formats 检查是否有文件
  const formats = clipboard.availableFormats();
  if (formats.includes('FileNameW')) {
    // 读取文件列表
    return clipboard.read('FileNameW')
      .split('\0')  // 文件路径以 null 字符分隔
      .filter(Boolean);  // 移除空字符串
  }
  return [];
});

// 写入文件路径到剪贴板
ipcMain.handle('writeClipboardFiles', (_event, filePaths: string[]) => {
  clipboard.writeBuffer('FileNameW', Buffer.from(filePaths.join('\0') + '\0', 'ucs2'));
});

// 刷新文件夹
ipcMain.handle('refreshFolder', async (_event, directoryPath: string) => {
  const folderTreeData = await generateTree(directoryPath)
  return { folderTreeData, directoryPath }
})