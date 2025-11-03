<script setup lang="ts">
import { computed, ref } from 'vue'

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

// Get sequenced images (images with sequence numbers)
const sequencedImages = computed(() => {
  if (!props.attachedFiles) return []

  const sequenced = props.attachedFiles.filter(file =>
    file.fileType === 'image' && file.sequence !== undefined
  )

  return sequenced.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
})

// Get additional images (images without sequence numbers)
const additionalImages = computed(() => {
  if (!props.attachedFiles) return []

  const additional = props.attachedFiles.filter(file =>
    file.fileType === 'image' && file.sequence === undefined
  )

  return additional.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )
})

// Carousel state
const currentImageIndex = ref(0)
const allImages = computed(() => [...sequencedImages.value, ...additionalImages.value])

const nextImage = () => {
  if (currentImageIndex.value < allImages.value.length - 1) {
    currentImageIndex.value++
  }
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const goToImage = (index: number) => {
  currentImageIndex.value = index
}

const handleDownload = (fileId: string, filename: string) => {
  emit('download-file', fileId, filename)
}

const getImageNumber = (image: AttachedFile) => {
  const sequencedIndex = sequencedImages.value.findIndex(img => img.fileId === image.fileId)
  if (sequencedIndex !== -1) return sequencedIndex + 1

  const additionalIndex = additionalImages.value.findIndex(img => img.fileId === image.fileId)
  return additionalIndex + 1
}
</script>

<template>
  <div v-if="allImages.length > 0" class="carousel-gallery">

    <div class="carousel-container">
      <!-- Navigation arrows -->
      <button
        v-if="allImages.length > 1"
        class="carousel-nav carousel-nav-prev"
        @click="prevImage"
        :disabled="currentImageIndex === 0"
      >
        ‹
      </button>

      <!-- Main carousel image -->
      <div class="carousel-main">
        <div class="image-container">
          <img
            :src="`/api/file/${allImages[currentImageIndex].fileId}`"
            :alt="allImages[currentImageIndex].filename"
            class="carousel-image"
          />
        </div>

        <!-- Image info and download button -->
        <div class="image-info">
          <div class="info-left">
            <span class="image-name">{{ allImages[currentImageIndex].filename }}</span>
            <span class="image-counter">
              Image {{ getImageNumber(allImages[currentImageIndex]) }} of {{ allImages.length }}
            </span>
          </div>
          <button
            @click="handleDownload(allImages[currentImageIndex].fileId, allImages[currentImageIndex].filename)"
            class="download-btn"
          >
            Download
          </button>
        </div>
      </div>

      <!-- Navigation arrows -->
      <button
        v-if="allImages.length > 1"
        class="carousel-nav carousel-nav-next"
        @click="nextImage"
        :disabled="currentImageIndex === allImages.length - 1"
      >
        ›
      </button>
    </div>

    <!-- Thumbnail navigation -->
    <div v-if="allImages.length > 1" class="thumbnail-container">
      <div
        v-for="(image, index) in allImages"
        :key="image.fileId"
        class="thumbnail"
        :class="{ active: index === currentImageIndex }"
        @click="goToImage(index)"
      >
        <img
          :src="`/api/file/${image.fileId}`"
          :alt="image.filename"
          class="thumbnail-image"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.carousel-gallery {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid color-mix(in oklab, var(--text), transparent 80%);
}

.carousel-gallery h3 {
  margin-bottom: 10px;
  color: var(--text);
}

.section-description {
  color: color-mix(in oklab, var(--text), transparent 40%);
  font-size: 14px;
  margin-bottom: 20px;
}

.carousel-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  position: relative;
}

.carousel-main {
  flex: 1;
  max-width: 800px;
  border: 1px solid color-mix(in oklab, var(--text), transparent 80%);
  border-radius: 12px;
  overflow: hidden;
  background-color: color-mix(in oklab, var(--background), black 2%);
}

.image-container {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(in oklab, var(--background), black 5%);
}

.carousel-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.carousel-nav {
  background: var(--focused);
  color: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.carousel-nav:hover:not(:disabled) {
  background: color-mix(in oklab, var(--focused), black 20%);
  transform: scale(1.05);
}

.carousel-nav:disabled {
  background: color-mix(in oklab, var(--text), transparent 70%);
  cursor: not-allowed;
  opacity: 0.5;
}

.image-info {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: color-mix(in oklab, var(--background), black 3%);
  border-top: 1px solid color-mix(in oklab, var(--text), transparent 80%);
}

.info-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.image-counter {
  font-size: 12px;
  color: color-mix(in oklab, var(--text), transparent 40%);
}

.download-btn {
  background: var(--focused);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.download-btn:hover {
  background: color-mix(in oklab, var(--focused), black 20%);
}

.thumbnail-container {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 10px;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.thumbnail:hover {
  opacity: 0.9;
  transform: scale(1.05);
}

.thumbnail.active {
  border-color: var(--focused);
  opacity: 1;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Responsive design */
@media (max-width: 768px) {
  .carousel-container {
    flex-direction: column;
    gap: 10px;
  }

  .carousel-nav {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .image-container {
    height: 300px;
  }

  .image-info {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .thumbnail {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 480px) {
  .image-container {
    height: 250px;
  }

  .thumbnail-container {
    gap: 8px;
  }

  .thumbnail {
    width: 40px;
    height: 40px;
  }
}
</style>
