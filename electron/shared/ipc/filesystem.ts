import { ipcMain, shell, dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';

export function registerFileSystemHandlers() {
    /**
     * 打开文件资源管理器
     */
    ipcMain.handle('open-file-explorer', async () => {
        shell.openPath(path.join(__dirname, '..', '..', '..', 'src'))
    })

    /**
     * 打开文件
     */

    /**
     * 读取文件夹
     * @param folderPath 文件夹路径
     * @returns 文件夹下的文件列表
     * @throws {Error} 读取文件夹失败时抛出异常
     */
    ipcMain.handle('read-folder', async (_, folderPath) => {
        try {
            const files = await fs.readdir(folderPath, { withFileTypes: true });
            return files.map(file => ({
                name: file.name,
                path: path.join(folderPath, file.name),
                isDirectory: file.isDirectory(),
                key: path.join(folderPath, file.name),
            }));
        } catch (error) {
            console.error('Error reading folder:', error);
            throw error;
        }
    });

    /**
     * 选择文件夹
     */
    ipcMain.handle('select-folder', async () => {
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

    /**
     * 检查文件或文件夹是否存在
     */
    ipcMain.handle('file-or-folder-exists', async (_event, path: string) => {
        try {
            await fs.access(path);
            return true;
        } catch (error) {
            return false;
        }
    });
    
    /**
     * 创建文件夹
     */
    ipcMain.handle('create-folder', async (_event, filePath: string) => {
        await fs.mkdir(filePath, { recursive: true });
    });


    /**
     * 创建文件
     */
    ipcMain.handle('create-file', async (_event, filePath: string, content: string = '') => {
        await fs.writeFile(filePath, content, 'utf8');
    });

    /**
     * 重命名文件或文件夹
     */
    ipcMain.handle('rename-file-or-folder', async (_event, oldPath: string, newPath: string) => {
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

    /**
     * 删除文件或文件夹，移动到回收站
     */
    ipcMain.handle('delete-file-or-folder', async (_event, path: string, isDirectory: boolean) => {
        if (isDirectory) {
            await shell.trashItem(path);

        } else {
            await shell.trashItem(path);
        }
    });

    /**
     * 读取文件
     */
    ipcMain.handle('read-file', async (_event, path: string, encoding: BufferEncoding = 'utf-8') => {
        try {
            return await fs.readFile(path, encoding);
        } catch (error) {
            console.error('读取文件失败:', error);
            throw error;
        }
    });


    /**
     * 写入文件
     */
    ipcMain.handle('write-file', async (_event, path: string, data: string | Buffer, encoding?: BufferEncoding | null) => {
        try {
            const options = {
                encoding: encoding ?? (typeof data === 'string' ? 'utf-8' : null),
                flag: 'w'
            };
            await fs.writeFile(path, data, options);
        } catch (error) {
            console.error('写入文件失败:', error);
            throw error;
        }
    });

    /**
     * 获取文件夹树
     */
    ipcMain.handle('get-folder-tree', async (_event, folderPath: string) => {
        const folderTreeData = await generateTree(folderPath);
        return folderTreeData;
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

    /**
     * 刷新文件夹
     */
    ipcMain.handle('refresh-folder', async (_event, folderPath: string) => {
        const folderTreeData = await generateTree(folderPath);
        return { folderTreeData, folderPath };
    });

    /**
     * arrayBuffer转Buffer
     */
    ipcMain.handle('arrayBuffer-to-buffer', async (_event, arrayBuffer: ArrayBuffer) => {
        return Buffer.from(arrayBuffer);
    });

}
