<!--
  MarkdownEditor.vue
  Markdown 编辑器组件
  
  使用 Tiptap 实现 WYSIWYG Markdown 编辑
  支持预览/编辑模式切换
-->
<template>
  <div class="markdown-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <v-btn-toggle v-model="mode" mandatory density="compact" class="mr-4">
        <v-btn value="edit" size="small">
          <v-icon icon="mdi-pencil" />
          编辑
        </v-btn>
        <v-btn value="preview" size="small">
          <v-icon icon="mdi-eye" />
          预览
        </v-btn>
      </v-btn-toggle>

      <!-- 编辑模式工具栏 -->
      <template v-if="mode === 'edit' && editor">
        <v-divider vertical class="mx-2" />

        <v-btn
          size="small"
          icon="mdi-format-bold"
          :class="{ 'is-active': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
        />
        <v-btn
          size="small"
          icon="mdi-format-italic"
          :class="{ 'is-active': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
        />
        <v-btn
          size="small"
          icon="mdi-format-strikethrough"
          :class="{ 'is-active': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
        />

        <v-divider vertical class="mx-2" />

        <v-btn
          size="small"
          icon="mdi-format-header-1"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        />
        <v-btn
          size="small"
          icon="mdi-format-header-2"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        />
        <v-btn
          size="small"
          icon="mdi-format-header-3"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        />

        <v-divider vertical class="mx-2" />

        <v-btn
          size="small"
          icon="mdi-format-list-bulleted"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
        />
        <v-btn
          size="small"
          icon="mdi-format-list-numbered"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
        />
        <v-btn
          size="small"
          icon="mdi-code-tags"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        />

        <v-divider vertical class="mx-2" />

        <v-btn size="small" icon="mdi-link" @click="setLink" />
        <v-btn size="small" icon="mdi-image" @click="addImage" />
      </template>

      <v-spacer />

      <!-- 字数统计 -->
      <div class="word-count">
        <span class="text-caption">{{ wordCount }} 字</span>
      </div>
    </div>

    <!-- 编辑器内容区 -->
    <div class="editor-content">
      <!-- 编辑模式 -->
      <div v-show="mode === 'edit'" class="editor-edit-mode">
        <editor-content :editor="editor" />
      </div>

      <!-- 预览模式 -->
      <div
        v-show="mode === 'preview'"
        class="editor-preview-mode markdown-body"
        v-html="renderedHtml"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { marked } from 'marked';

/**
 * Props
 */
interface Props {
  modelValue: string;
  placeholder?: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '开始输入...',
  readonly: false,
});

/**
 * Emits
 */
interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}

const emit = defineEmits<Emits>();

/**
 * 编辑模式：edit | preview
 */
const mode = ref<'edit' | 'preview'>('edit');

/**
 * Tiptap 编辑器实例
 */
const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Link.configure({
      openOnClick: false,
    }),
    Image,
  ],
  content: props.modelValue,
  editable: !props.readonly,
  onUpdate: ({ editor }) => {
    const markdown = editor.getText(); // 简化版，实际应该转换为 Markdown
    emit('update:modelValue', markdown);
    emit('change', markdown);
  },
});

/**
 * 预览模式渲染的 HTML
 */
const renderedHtml = computed(() => {
  if (!props.modelValue) return '';
  return marked(props.modelValue);
});

/**
 * 字数统计
 */
const wordCount = computed(() => {
  if (!editor.value) return 0;
  return editor.value.getText().length;
});

/**
 * 监听外部 modelValue 变化
 */
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.getText() !== newValue) {
      editor.value.commands.setContent(newValue);
    }
  },
);

/**
 * 设置链接
 */
function setLink() {
  if (!editor.value) return;

  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('输入链接地址', previousUrl);

  if (url === null) return;

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

/**
 * 添加图片
 */
function addImage() {
  if (!editor.value) return;

  const url = window.prompt('输入图片地址');

  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run();
  }
}

/**
 * 清理
 */
onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped lang="scss">
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgb(var(--v-theme-surface));
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  .v-btn {
    &.is-active {
      background-color: rgba(var(--v-theme-primary), 0.12);
      color: rgb(var(--v-theme-primary));
    }
  }
}

.word-count {
  padding: 0 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.editor-edit-mode {
  height: 100%;

  :deep(.ProseMirror) {
    min-height: 100%;
    outline: none;

    > * + * {
      margin-top: 0.75em;
    }

    p.is-editor-empty:first-child::before {
      color: rgba(var(--v-theme-on-surface), 0.4);
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }

    h1 {
      font-size: 2em;
      font-weight: 700;
      line-height: 1.2;
    }

    h2 {
      font-size: 1.5em;
      font-weight: 600;
      line-height: 1.3;
    }

    h3 {
      font-size: 1.25em;
      font-weight: 600;
      line-height: 1.4;
    }

    code {
      background-color: rgba(var(--v-theme-on-surface), 0.08);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9em;
    }

    pre {
      background-color: rgba(var(--v-theme-on-surface), 0.05);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;

      code {
        background: none;
        padding: 0;
      }
    }

    blockquote {
      border-left: 3px solid rgba(var(--v-theme-on-surface), 0.2);
      padding-left: 16px;
      color: rgba(var(--v-theme-on-surface), 0.8);
    }

    ul,
    ol {
      padding-left: 24px;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
  }
}

.editor-preview-mode {
  &.markdown-body {
    // 使用 GitHub Markdown 样式
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    line-height: 1.6;

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    :deep(h1) {
      font-size: 2em;
      border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
      padding-bottom: 8px;
    }

    :deep(h2) {
      font-size: 1.5em;
      border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
      padding-bottom: 8px;
    }

    :deep(h3) {
      font-size: 1.25em;
    }

    :deep(p) {
      margin-bottom: 16px;
    }

    :deep(code) {
      background-color: rgba(var(--v-theme-on-surface), 0.08);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9em;
    }

    :deep(pre) {
      background-color: rgba(var(--v-theme-on-surface), 0.05);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;

      code {
        background: none;
        padding: 0;
      }
    }

    :deep(blockquote) {
      border-left: 3px solid rgba(var(--v-theme-on-surface), 0.2);
      padding-left: 16px;
      color: rgba(var(--v-theme-on-surface), 0.8);
      margin: 16px 0;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 24px;
      margin-bottom: 16px;
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }

    :deep(table) {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;

      th,
      td {
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        padding: 8px 12px;
      }

      th {
        background-color: rgba(var(--v-theme-on-surface), 0.05);
        font-weight: 600;
      }
    }
  }
}
</style>
