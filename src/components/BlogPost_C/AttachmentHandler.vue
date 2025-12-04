<script setup lang="ts">
import { computed } from 'vue'

import DownloadIcon from "@/assets/uiElements/download.svg"
import FilePostIcon from "@/assets/uiElements/filePost.svg"

interface AttachedFile {
  filename: string
  fileId: string
  uploadDate: string
  fileType?: string
  sequence?: number
}

interface Props {
  attachedFiles: AttachedFile[]
}

interface Emits {
  (e: 'download-file', fileId: string, filename: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Get other attached files (non-images)
const otherAttachedFiles = computed(() => {
  if (!props.attachedFiles) return []

  const otherFiles = props.attachedFiles.filter(file =>
    file.fileType !== 'image'
  )

  return otherFiles.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )
})

const handleDownload = (fileId: string, filename: string) => {
  emit('download-file', fileId, filename)
}
</script>

<template>
  <div v-if="otherAttachedFiles.length > 0" class="attached-files">
    <h3>Attached Files</h3>
    <div class="files-list">
      <div
        v-for="file in otherAttachedFiles"
        :key="file.fileId"
        class="file-item"
      >
        <div class="file-icon">
          <FilePostIcon />
        </div>
        <div class="file-details">
          <span class="file-name">{{ file.filename }}</span>
          <span class="file-date">
            Uploaded: {{ new Date(file.uploadDate).toLocaleDateString() }}
          </span>
        </div>
        <button
          class="nav-btn large-btn download-btn"
          @click="handleDownload(file.fileId, file.filename)"
          :aria-label="`Download ${file.filename}`"
        >
          <DownloadIcon class="btn-icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attached-files {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid color-mix(in oklab, var(--text), transparent 80%);
}

.attached-files h3 {
  margin-bottom: 15px;
  color: var(--text);
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 5px;
  border: 1px solid color-mix(in oklab, var(--text), transparent 70%);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.file-icon {
  font-size: 20px;

  flex-shrink: 0;
  height: 2em;
  margin: 5px;
  margin-right: 10px;
}

.file-details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0; /* Allow text truncation */
}

.file-name {
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-date {
  font-size: 12px;
  color: color-mix(in oklab, var(--text), transparent 40%);
}

.download-btn {
  margin-left: 12px;
  flex-shrink: 0;
}

.download-btn:hover {
  background-color: color-mix(in oklab, var(--focused), transparent 66%);
}
</style>
