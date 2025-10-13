# Editor 模块 Web 端实现文档

> 基于 Tiptap 的 Markdown 编辑器组件，支持多标签页管理和媒体文件查看

## 📦 安装依赖

```bash
cd apps/web
pnpm add @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-image marked
```

### 依赖说明

| 包名 | 版本 | 用途 |
|------|------|------|
| `@tiptap/vue-3` | ^2.x | Tiptap Vue 3 集成 |
| `@tiptap/starter-kit` | ^2.x | Tiptap 核心功能包 |
| `@tiptap/extension-placeholder` | ^2.x | 占位符扩展 |
| `@tiptap/extension-link` | ^2.x | 链接扩展 |
| `@tiptap/extension-image` | ^2.x | 图片扩展 |
| `marked` | ^14.x | Markdown 转 HTML（预览模式） |

## 🎯 组件说明

### 1. EditorContainer（主容器组件）

**职责：**
- 多标签页管理
- 文件打开/关闭
- 内容自动保存协调

**使用示例：**

```vue
<template>
  <editor-container
    ref="editorRef"
    @content-change="handleContentChange"
    @tab-close="handleTabClose"
    @save-request="handleSaveRequest"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { EditorContainer } from '@/modules/editor';

const editorRef = ref();

onMounted(() => {
  // 打开文件
  editorRef.value.openFile({
    title: 'README.md',
    fileType: 'markdown',
    filePath: '/path/to/README.md',
    content: '# Hello World',
  });
});

function handleContentChange(tab) {
  console.log('Content changed:', tab);
}

function handleTabClose(tab) {
  console.log('Tab closed:', tab);
}

function handleSaveRequest(tab) {
  // 保存文件到服务器
  console.log('Save:', tab);
}
</script>
```

### 2. EditorTabBar（标签栏组件）

**职责：**
- 显示标签页列表
- 标签页切换
- 标签页关闭

**特性：**
- 显示文件类型图标
- 显示未保存标识（小圆点）
- 支持标签页滚动（多标签）

### 3. MarkdownEditor（Markdown 编辑器）

**职责：**
- Markdown 内容编辑
- 实时预览
- 所见即所得编辑

**特性：**
- **编辑模式**：所见即所得编辑器（Tiptap）
- **预览模式**：渲染后的 Markdown HTML
- **工具栏**：加粗、斜体、标题、列表、代码块、链接、图片
- **字数统计**

**快捷键：**
- `Ctrl/Cmd + B`：加粗
- `Ctrl/Cmd + I`：斜体
- `Ctrl/Cmd + K`：插入链接
- `Ctrl/Cmd + Shift + 1/2/3`：标题 1/2/3

### 4. MediaViewer（媒体查看器）

**职责：**
- 图片查看
- 视频播放
- 音频播放

**支持格式：**
- **图片**：jpg, png, gif, svg, webp
- **视频**：mp4, webm, ogg
- **音频**：mp3, wav, ogg

## 🔧 Composable API

### useEditor()

提供编辑器操作的响应式 API。

```typescript
import { useEditor } from '@/modules/editor';

const {
  setEditorInstance,     // 设置编辑器实例
  openFile,              // 打开文件
  closeFile,             // 关闭文件
  closeAllFiles,         // 关闭所有文件
  saveCurrentFile,       // 保存当前文件
  saveAllFiles,          // 保存所有文件
  openTabs,              // 打开的标签列表（响应式）
  activeTab,             // 当前激活的标签（响应式）
  hasUnsavedChanges,     // 是否有未保存的更改（响应式）
} = useEditor();
```

**使用示例：**

```vue
<template>
  <div>
    <!-- 在 Repository 页面中使用 -->
    <editor-container ref="editorRef" />
    
    <!-- 显示状态 -->
    <div>
      打开的文件数：{{ openTabs.length }}
      <v-chip v-if="hasUnsavedChanges" color="warning">未保存</v-chip>
    </div>
    
    <!-- 操作按钮 -->
    <v-btn @click="saveAllFiles">保存所有</v-btn>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { EditorContainer, useEditor } from '@/modules/editor';

const editorRef = ref();
const {
  setEditorInstance,
  openTabs,
  hasUnsavedChanges,
  saveAllFiles,
} = useEditor();

onMounted(() => {
  // 注册编辑器实例
  setEditorInstance(editorRef.value);
});
</script>
```

## 🔌 与 Repository 模块集成

Editor 模块作为组件嵌入到 Repository 模块的编辑器页面。

```vue
<!-- apps/web/src/modules/repository/presentation/views/EditorView.vue -->
<template>
  <div class="editor-view">
    <!-- 左侧：文件树（Repository 模块负责） -->
    <div class="file-tree">
      <repository-file-tree @file-click="handleFileClick" />
    </div>
    
    <!-- 右侧：编辑器（Editor 模块提供） -->
    <div class="editor-area">
      <editor-container
        ref="editorRef"
        @content-change="handleContentChange"
        @save-request="handleSaveRequest"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { EditorContainer } from '@/modules/editor';
import RepositoryFileTree from '../components/RepositoryFileTree.vue';

const editorRef = ref();

/**
 * 处理文件点击
 */
function handleFileClick(file) {
  // 根据文件类型判断
  const fileType = getFileType(file.path);
  
  editorRef.value.openFile({
    uuid: file.uuid,
    title: file.name,
    fileType: fileType,
    filePath: file.path,
    content: file.content, // 如果是 Markdown
  });
}

/**
 * 获取文件类型
 */
function getFileType(path) {
  const ext = path.split('.').pop().toLowerCase();
  
  if (ext === 'md') return 'markdown';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  
  return 'markdown'; // 默认
}

/**
 * 处理内容变化
 */
function handleContentChange(tab) {
  // 标记为未保存
  console.log('Content changed:', tab.title);
}

/**
 * 处理保存请求
 */
async function handleSaveRequest(tab) {
  try {
    // 调用 Repository 模块的 API 保存文件
    await repositoryApi.updateResource(tab.uuid, {
      content: tab.content,
    });
    
    console.log('File saved:', tab.title);
  } catch (error) {
    console.error('Save failed:', error);
  }
}
</script>

<style scoped>
.editor-view {
  display: flex;
  height: 100%;
}

.file-tree {
  width: 300px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.editor-area {
  flex: 1;
}
</style>
```

## 🎨 样式自定义

所有组件都支持通过 Vuetify 主题变量进行样式自定义。

**可自定义的颜色变量：**
- `--v-theme-surface`：背景色
- `--v-theme-on-surface`：文字色
- `--v-theme-primary`：主色调
- `--v-theme-warning`：警告色（未保存标识）

## 📝 类型定义

```typescript
/**
 * 编辑器标签页
 */
export interface EditorTab {
  uuid: string;                                // 标签唯一标识
  title: string;                               // 标签标题
  fileType: 'markdown' | 'image' | 'video' | 'audio'; // 文件类型
  filePath: string;                            // 文件路径
  content?: string;                            // 文件内容（Markdown）
  isDirty: boolean;                            // 是否有未保存的更改
  isPinned?: boolean;                          // 是否固定（可选）
}
```

## 🚀 未来改进

### 短期（1-2 周）
- [ ] 添加代码高亮（Shiki 或 Prism）
- [ ] 添加拖拽排序标签页
- [ ] 添加快捷键支持
- [ ] 添加搜索/替换功能

### 中期（1 个月）
- [ ] 添加图表支持（Mermaid）
- [ ] 添加公式支持（KaTeX）
- [ ] 添加表格编辑器
- [ ] 添加文件历史版本

### 长期（3 个月+）
- [ ] 添加协同编辑（WebSocket）
- [ ] 添加插件系统
- [ ] 添加主题自定义
- [ ] 添加导出功能（PDF/HTML）

## 🐛 已知问题

1. **Tiptap 性能**：大文件（>10MB）可能有性能问题
   - **解决方案**：使用虚拟滚动或分页加载

2. **图片上传**：当前只支持 URL，不支持本地上传
   - **解决方案**：集成 Repository 模块的文件上传 API

3. **自动保存**：当前未实现
   - **解决方案**：添加 debounce 延迟保存逻辑

## 📚 参考资料

- [Tiptap 官方文档](https://tiptap.dev/)
- [ProseMirror 文档](https://prosemirror.net/)
- [Marked 文档](https://marked.js.org/)
- [Vuetify 文档](https://vuetifyjs.com/)

---

**创建日期：** 2025-01-13  
**维护者：** DailyUse Team
