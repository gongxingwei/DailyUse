interface Window {
  electron: {
    readFile: (path: string) => Promise<string>
    writeFile: (path: string, content: string) => Promise<void>
    selectFile: () => Promise<string | null>
  }
} 