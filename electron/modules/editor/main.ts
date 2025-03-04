import { IpcMain } from "electron";

export function setupEditorModule(ipcMain: IpcMain) {
  ipcMain.handle("editor:open-file", async (event, filePath: string) => {
    // Open the file and return its content
  });
}