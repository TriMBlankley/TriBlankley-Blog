<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const hljs = ref<any>(null)

import PostTitle from '@/components/BlogPost_C/postTitle.vue'
import SettingsCog from '@/components/Settings_C/settingsCog.vue'
import BottomNav from '@/components/BlogPost_C/bottomNav.vue'
import TbBlogLogo from "@/assets/uiElements/tbBlogLogo.svg"

const router = useRouter()
const route = useRoute()
const renderedContent = ref('')

interface PostData {
  postId: number
  postTitle: string
  postAuthor: string
  postDate: string
  postContent: string
  postTopics: string[]
  contentType: string
  isPublished: boolean
  attachedFiles: Array<{
    filename: string
    fileId: string
    uploadDate: string
  }>
  postGroup?: {
    groupId: string
    groupName: string
    sequence: number
  }
}

const postData = ref<PostData | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Navigation data
const topicPosts = ref<PostData[]>([])
const groupPosts = ref<PostData[]>([])
const currentTopicIndex = ref(-1)
const currentGroupIndex = ref(-1)

const goToHome = () => router.push('/')

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

// Computed properties for navigation
const hasPreviousTopicPost = computed(() => currentTopicIndex.value > 0)
const hasNextTopicPost = computed(() => currentTopicIndex.value < topicPosts.value.length - 1)
const hasPreviousGroupPost = computed(() => currentGroupIndex.value > 0)
const hasNextGroupPost = computed(() => currentGroupIndex.value < groupPosts.value.length - 1)

const previousTopicPost = computed(() =>
  hasPreviousTopicPost.value ? topicPosts.value[currentTopicIndex.value - 1] : null
)
const nextTopicPost = computed(() =>
  hasNextTopicPost.value ? topicPosts.value[currentTopicIndex.value + 1] : null
)
const previousGroupPost = computed(() =>
  hasPreviousGroupPost.value ? groupPosts.value[currentGroupIndex.value - 1] : null
)
const nextGroupPost = computed(() =>
  hasNextGroupPost.value ? groupPosts.value[currentGroupIndex.value + 1] : null
)

// Navigation functions
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToPreviousTopicPost = () => {
  if (previousTopicPost.value) {
    router.push(`/BlogPage/${previousTopicPost.value.postId}`)
  }
}

const goToNextTopicPost = () => {
  if (nextTopicPost.value) {
    router.push(`/BlogPage/${nextTopicPost.value.postId}`)
  }
}

const goToPreviousGroupPost = () => {
  if (previousGroupPost.value) {
    router.push(`/BlogPage/${previousGroupPost.value.postId}`)
  }
}

const goToNextGroupPost = () => {
  if (nextGroupPost.value) {
    router.push(`/BlogPage/${nextGroupPost.value.postId}`)
  }
}

// Fetch posts by topic
// Fetch posts by topic
const fetchTopicPosts = async () => {
  if (!postData.value?.postTopics?.length) return

  try {
    const allPosts = await fetch('/api/posts').then(res => res.json())

    // Filter for published posts that share at least one topic with current post
    const postsWithSameTopics = allPosts.filter((post: PostData) =>
      post.isPublished &&
      post.postId !== postData.value?.postId &&
      post.postTopics && post.postTopics.length > 0 &&
      post.postTopics.some(topic => postData.value?.postTopics.includes(topic))
    )

    // Sort by postId in descending order (newest first) for consistent navigation
    topicPosts.value = postsWithSameTopics.sort((a: PostData, b: PostData) => b.postId - a.postId)

    // Find current post index in topic posts
    currentTopicIndex.value = topicPosts.value.findIndex(
      (post: PostData) => post.postId === postData.value?.postId
    )

    console.log('Topic posts found:', topicPosts.value.length)
    console.log('Current topic index:', currentTopicIndex.value)
  } catch (err) {
    console.error('Error fetching topic posts:', err)
  }
}

// Fetch posts by group
const fetchGroupPosts = async () => {
  if (!postData.value?.postGroup?.groupId) return

  try {
    const response = await fetch(`/api/posts/group/${postData.value.postGroup.groupId}`)
    if (response.ok) {
      groupPosts.value = await response.json()

      // Find current post index in group posts
      currentGroupIndex.value = groupPosts.value.findIndex(
        (post: PostData) => post.postId === postData.value?.postId
      )
    }
  } catch (err) {
    console.error('Error fetching group posts:', err)
  }
}

// Computed property to get images in upload order
const attachedImages = computed(() => {
  if (!postData.value?.attachedFiles) return []

  const images = postData.value.attachedFiles.filter(file =>
    file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
  )

  // Sort by upload date to maintain upload order
  return images.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )
})

const otherAttachedFiles = computed(() => {
  if (!postData.value?.attachedFiles) return []

  const otherFiles = postData.value.attachedFiles.filter(file =>
    !file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
  )

  // Sort other files by upload date as well
  return otherFiles.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )
})

// Function to replace markdown image syntax with actual file URLs
const processMarkdownContent = (content: string, images: any[]) => {
  let processedContent = content

  // First, find all image references in the markdown to see which ones are used
  const usedImageIndices = new Set()
  const imagePattern = /!\[([^\]]*)\]\(image(\d+)\)/g
  let match

  while ((match = imagePattern.exec(content)) !== null) {
    const imageNumber = parseInt(match[2])
    usedImageIndices.add(imageNumber)
  }

  // Replace image references with actual URLs
  images.forEach((image, index) => {
    const imageNumber = index + 1
    const imagePattern = new RegExp(`!\\[([^\\]]*)\\]\\(image${imageNumber}\\)`, 'g')
    const imageUrl = `/api/file/${image.fileId}`
    processedContent = processedContent.replace(
      imagePattern,
      `![$1](${imageUrl})`
    )
  })

  return processedContent
}

// Computed property to get images that weren't used in markdown
const unusedImages = computed(() => {
  if (!postData.value?.postContent || !attachedImages.value.length) return attachedImages.value

  const usedImageNumbers = new Set()
  const imagePattern = /!\[([^\]]*)\]\(image(\d+)\)/g
  let match

  while ((match = imagePattern.exec(postData.value.postContent)) !== null) {
    usedImageNumbers.add(parseInt(match[2]))
  }

  // Return images that weren't referenced in markdown
  return attachedImages.value.filter((image, index) => !usedImageNumbers.has(index + 1))
})

// Function to fetch and render post
const fetchPost = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await fetch(`/api/posts/${route.params.id}`)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Post not found')
      }
      throw new Error(`Failed to load post: ${response.statusText}`)
    }

    postData.value = await response.json()

    // Check if post is published
    if (postData.value && !postData.value.isPublished) {
      error.value = 'This post is not published yet'
      return
    }

    // Render content based on content type
    if (postData.value?.postContent) {
      let contentToRender = postData.value.postContent

      if (postData.value.contentType === 'markdown') {
        // Process markdown to replace image placeholders with actual file URLs
        contentToRender = processMarkdownContent(
          postData.value.postContent,
          attachedImages.value
        )

        // Parse markdown to HTML
        const rawHtml = marked.parse(contentToRender)
        renderedContent.value = DOMPurify.sanitize(rawHtml)
      } else {
        // For plain text or other content types
        renderedContent.value = DOMPurify.sanitize(
          postData.value.postContent.replace(/\n/g, '<br>')
        )
      }
    }

    // Fetch navigation data after post is loaded
    await Promise.all([fetchTopicPosts(), fetchGroupPosts()])
  } catch (err) {
    console.error('Error loading post:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    isLoading.value = false
  }
}

// Function to handle file downloads
const downloadFile = async (fileId: string, filename: string) => {

  const url = `/api/file/${fileId}`
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}


// Load highlight.js dynamically
const loadHighlightJS = async () => {
  if (typeof window !== 'undefined') {
    try {
      const hljsModule = await import('highlight.js')
      hljs.value = hljsModule.default

      marked.setOptions({
        highlight: function(code, lang) {
          if (hljs.value && lang && hljs.value.getLanguage(lang)) {
            try {
              return hljs.value.highlight(code, { language: lang }).value
            } catch (err) {
              console.warn('Error highlighting code:', err)
            }
          }
          return code
        }
      })
    } catch (err) {
      console.warn('Failed to load highlight.js:', err)
    }
  }
}

const getImageNumber = (image: any) => {
  const index = attachedImages.value.findIndex(img => img.fileId === image.fileId)
  return index + 1
}

onMounted(async () => {
  await loadHighlightJS()
  await fetchPost()
})

// Watch for route changes to load different posts
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await fetchPost()
  }
})
</script>



<template>
  <div class="blog-page">
    <div class="logo-and-settings">
      <SettingsCog style="width: 30px;"/>
      <button @click="goToHome" class="logo-button">
        <TbBlogLogo style="width: 70px;"/>
      </button>
    </div>

    <template v-if="isLoading">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading post...</p>
      </div>
    </template>

    <template v-else-if="error">
      <div class="error-state">
        <h2>Unable to Load Post</h2>
        <p>{{ error }}</p>
        <button @click="goToHome" class="btn btn-primary">Return Home</button>
      </div>
    </template>

    <template v-else-if="postData">
      <PostTitle
        :postTitle="postData.postTitle"
        :postAuthor="postData.postAuthor"
        :postDate="postData.postDate"
      />

      <!-- Display topics if available -->
      <div v-if="postData.postTopics && postData.postTopics.length > 0" class="post-topics">
        <span
          v-for="topic in postData.postTopics"
          :key="topic"
          class="topic-tag"
        >
          {{ topic }}
        </span>
      </div>

      <div class="separator"></div>

      <!-- Main content area -->
      <div class="content-container">
        <!-- Markdown content -->
        <div
          class="markdown-content"
          v-html="renderedContent"
        ></div>

        <!-- Additional images gallery (images not used in markdown) -->
        <div v-if="unusedImages.length > 0" class="additional-images">
          <h3>Additional Images</h3>
          <p class="section-description">
            The following images were uploaded with this post but not embedded in the content.
          </p>
          <div class="images-grid">
            <div
              v-for="(image, index) in unusedImages"
              :key="image.fileId"
              class="image-item"
            >
              <img
                :src="`/api/file/${image.fileId}`"
                :alt="image.filename"
                class="gallery-image"
                @click="downloadFile(image.fileId, image.filename)"
              />
              <div class="image-info">
                <span class="image-name">{{ image.filename }}</span>
                <span class="image-number">Image {{ getImageNumber(image) }}</span>
                <button
                  @click="downloadFile(image.fileId, image.filename)"
                  class="download-btn"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- Other attached files section -->
        <div v-if="otherAttachedFiles.length > 0" class="attached-files">
          <h3>Attached Files</h3>
          <div class="files-list">
            <div
              v-for="file in otherAttachedFiles"
              :key="file.fileId"
              class="file-item"
              @click="downloadFile(file.fileId, file.filename)"
            >
              <div class="file-icon">📎</div>
              <div class="file-details">
                <span class="file-name">{{ file.filename }}</span>
                <span class="file-date">
                  Uploaded: {{ new Date(file.uploadDate).toLocaleDateString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav
        :has-previous-topic="hasPreviousTopicPost"
        :has-next-topic="hasNextTopicPost"
        :has-previous-group="hasPreviousGroupPost"
        :has-next-group="hasNextGroupPost"
        @scroll-to-top="scrollToTop"
        @previous-topic="goToPreviousTopicPost"
        @next-topic="goToNextTopicPost"
        @previous-group="goToPreviousGroupPost"
        @next-group="goToNextGroupPost"
      />
    </template>
  </div>
</template>

<style scoped>
.blog-page {
  max-width: 950px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 20px;
  background-color: var(--background);
  border-left: solid 3px;
  border-right: solid 3px;
  border-color: color-mix(in oklab, var(--background), var(--text) 45%);
  position: relative;
  scroll-behavior: smooth;
}

.logo-and-settings {
  position: fixed;
  top: 0;
  right: 20px;
  z-index: 10;
  gap: 10px;
  padding: 5px 10px;
  margin-top: .5em;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
}

.logo-button {
  background: var(--background);
  border-radius: 70px;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.logo-button svg {
  display: block;
}

.separator {
  width: 100%;
  height: 3px;
  margin-top: 5px;
  margin-bottom: 15px;
  background-color: var(--focused);
  border-radius: 5px;
  border: none;
}

/* Loading and error states */
.loading-state, .error-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--focused);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state h2 {
  color: #dc3545;
  margin-bottom: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.btn-primary {
  background-color: var(--focused);
  color: white;
}

/* Topics styling */
.post-topics {
  margin: 15px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  background-color: color-mix(in oklab, var(--focused), transparent 80%);
  color: var(--text);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--focused);
}

/* Content container */
.content-container {
  margin-bottom: 35px;
}

/* Attached files styling */
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
  padding: 12px;
  border: 1px solid color-mix(in oklab, var(--text), transparent 70%);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background-color: color-mix(in oklab, var(--focused), transparent 90%);
}

.file-icon {
  font-size: 20px;
  margin-right: 12px;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: var(--text);
}

.file-date {
  font-size: 12px;
  color: color-mix(in oklab, var(--text), transparent 40%);
}

/* Markdown content styling */
.markdown-content {
  line-height: 1.7;
  color: var(--text);
}

.markdown-content :deep(h1) {
  font-size: 2em;
  margin: 0.67em 0;
  color: var(--text);
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  margin: 0.83em 0;
  color: var(--text);
}

.markdown-content :deep(h3) {
  font-size: 1.17em;
  margin: 1em 0;
  color: var(--text);
}

.markdown-content :deep(p) {
  margin: 1em 0;
}

.markdown-content :deep(a) {
  color: var(--focused);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--focused);
  margin: 1em 0;
  padding-left: 1em;
  color: color-mix(in oklab, var(--text), transparent 30%);
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  border: 1px solid color-mix(in oklab, var(--text), transparent 70%);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(table th) {
  background-color: color-mix(in oklab, var(--focused), transparent 90%);
  font-weight: 600;
}

.markdown-content :deep(pre) {
  background-color: color-mix(in oklab, var(--background), black 5%);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-content :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background-color: color-mix(in oklab, var(--background), black 5%);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 1em 0;
}

[v-cloak] {
  display: none;
}

/* Additional images gallery */
.additional-images {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid color-mix(in oklab, var(--text), transparent 80%);
}

.additional-images h3 {
  margin-bottom: 10px;
  color: var(--text);
}

.section-description {
  color: color-mix(in oklab, var(--text), transparent 40%);
  font-size: 14px;
  margin-bottom: 20px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.image-item {
  border: 1px solid color-mix(in oklab, var(--text), transparent 80%);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.gallery-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

.image-info {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: color-mix(in oklab, var(--background), black 3%);
}

.image-name {
  font-size: 12px;
  color: var(--text);
  flex: 1;
  margin-right: 10px;
  word-break: break-all;
}

.download-btn {
  background: var(--focused);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}

.download-btn:hover {
  background: color-mix(in oklab, var(--focused), black 20%);
}


</style>
