<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

// Initialize lowlight
const lowlight = createLowlight()
lowlight.register('javascript', javascript)

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    CodeBlockLowlight.configure({ lowlight }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
  ],
  onUpdate: () => {
    emit('update:modelValue', editor.value?.getHTML() || '')
  }
})

// Add image handler
const addImage = () => {
  const url = window.prompt('Enter the URL of the image:')
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run()
  }
}

// Add table handler
const addTable = () => {
  editor.value?.chain().focus().insertTable({
    rows: 3,
    cols: 3,
    withHeaderRow: true,
  }).run()
}
</script>

<template>
  <div class="editor-container">
    <div class="menu-bar" v-if="editor">
      <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
        Bold
      </button>
      <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }">
        Italic
      </button>
      <button @click="addImage">
        Image
      </button>
      <button @click="addTable">
        Table
      </button>
      <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ 'is-active': editor.isActive('codeBlock') }">
        Code
      </button>
    </div>
    <editor-content :editor="editor" />
  </div>
</template>

<style>
/* Your existing styles remain the same */
.editor-container {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.menu-bar {
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e8f0;
}

.menu-bar button {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
}

.menu-bar button.is-active {
  background: #e2e8f0;
}

.ProseMirror {
  min-height: 200px;
  padding: 12px;
}

.ProseMirror:focus {
  outline: none;
}

/* Table styling */
.ProseMirror table {
  border-collapse: collapse;
  margin: 0;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
}

.ProseMirror table td,
.ProseMirror table th {
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
  min-width: 1em;
  padding: 0.5rem;
  position: relative;
  vertical-align: top;
}

.ProseMirror table th {
  background-color: #f1f5f9;
  font-weight: bold;
  text-align: left;
}

/* Image styling */
.ProseMirror img {
  max-width: 100%;
  height: auto;
}

.ProseMirror img.ProseMirror-selectednode {
  outline: 3px solid #6366f1;
}

.ProseMirror pre {
  background: #0d0d0d;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}
</style>
