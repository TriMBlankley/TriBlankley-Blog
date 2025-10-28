<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import "@/assets/base.css"
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const hljs = ref<any>(null)

// Import highlight.js styles
import 'highlight.js/styles/github-dark.css'

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
    fileType?: string
    sequence?: number
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

// Configure marked with highlight.js - SIMPLIFIED VERSION
const configureMarked = () => {
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false,
    highlight: function(code, lang) {
      if (!hljs.value) {
        return code
      }

      // Check if language is supported
      if (lang && hljs.value.getLanguage(lang)) {
        try {
          return hljs.value.highlight(code, { language: lang }).value
        } catch (err) {
          console.warn('Error highlighting code:', err)
          return code
        }
      }

      // Try to auto-detect language if no language specified
      try {
        const detected = hljs.value.highlightAuto(code)
        return detected.value
      } catch (err) {
        return code
      }
    }
  })
}

// Initialize marked configuration
configureMarked()

// Navigation functions
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// The computed properties and navigation functions stay the same
const hasPreviousTopicPost = computed(() => currentTopicIndex.value > 0)
const hasNextTopicPost = computed(() => currentTopicIndex.value < topicPosts.value.length - 1)

const previousTopicPost = computed(() =>
  hasPreviousTopicPost.value ? topicPosts.value[currentTopicIndex.value - 1] : null
)
const nextTopicPost = computed(() =>
  hasNextTopicPost.value ? topicPosts.value[currentTopicIndex.value + 1] : null
)

// Fetch posts by topic
const fetchTopicPosts = async () => {
  if (!postData.value?.postTopics?.length) {
    console.log('❌ No post topics found for current post')
    return
  }

  try {
    console.log('🔄 Fetching topic posts...')
    const allPosts = await fetch('/api/posts').then(res => res.json())
    console.log('📋 Total posts fetched:', allPosts.length)

    const postsWithSameTopics = allPosts.filter((post: PostData) => {
      const hasCommonTopic = post.isPublished &&
        post.postTopics && post.postTopics.length > 0 &&
        post.postTopics.some(topic => postData.value?.postTopics.includes(topic))

      return hasCommonTopic
    })

    console.log(`🎯 Found ${postsWithSameTopics.length} posts with common topics`)

    topicPosts.value = postsWithSameTopics.sort((a: PostData, b: PostData) => a.postId - b.postId)

    currentTopicIndex.value = topicPosts.value.findIndex(
      (post: PostData) => post.postId === postData.value?.postId
    )

    console.log('📊 Topic posts array:', topicPosts.value.map(p => ({ id: p.postId, title: p.postTitle })))
    console.log('📍 Current topic index:', currentTopicIndex.value)
  } catch (err) {
    console.error('❌ Error fetching topic posts:', err)
  }
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

// Update computed properties with logging
const hasPreviousGroupPost = computed(() => {
  return currentGroupIndex.value > 0
})

const hasNextGroupPost = computed(() => {
  return currentGroupIndex.value < groupPosts.value.length - 1
})

const previousGroupPost = computed(() => {
  return hasPreviousGroupPost.value ? groupPosts.value[currentGroupIndex.value - 1] : null
})

const nextGroupPost = computed(() => {
  return hasNextGroupPost.value ? groupPosts.value[currentGroupIndex.value + 1] : null
})

// Fetch posts by group
const fetchGroupPosts = async () => {
  if (!postData.value?.postGroup?.groupId) {
    console.log('❌ No post group found for current post')
    return
  }

  try {
    const response = await fetch(`/api/posts/group/${postData.value.postGroup.groupId}`)
    if (response.ok) {
      groupPosts.value = await response.json()
      console.log('📦 Group posts fetched:', groupPosts.value.length)

      currentGroupIndex.value = groupPosts.value.findIndex(
        (post: PostData) => post.postId === postData.value?.postId
      )

      console.log('📍 Current group index:', currentGroupIndex.value)
    } else {
      console.error('❌ Failed to fetch group posts:', response.status, response.statusText)
    }
  } catch (err) {
    console.error('❌ Error fetching group posts:', err)
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

// FIXED: Get sequenced images (images with sequence numbers)
const sequencedImages = computed(() => {
  if (!postData.value?.attachedFiles) return []

  const sequenced = postData.value.attachedFiles.filter(file =>
    file.fileType === 'image' && file.sequence !== undefined
  )

  return sequenced.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
})

// FIXED: Get additional images (images without sequence numbers)
const additionalImages = computed(() => {
  if (!postData.value?.attachedFiles) return []

  const additional = postData.value.attachedFiles.filter(file =>
    file.fileType === 'image' && file.sequence === undefined
  )

  return additional.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )
})

// FIXED: Get other attached files (non-images)
const otherAttachedFiles = computed(() => {
  if (!postData.value?.attachedFiles) return []

  const otherFiles = postData.value.attachedFiles.filter(file =>
    file.fileType !== 'image'
  )

  return otherFiles.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )
})

// FIXED: Improved markdown image processing and content handling
const processMarkdownContent = (content: string) => {
  let processedContent = content

  sequencedImages.value.forEach((image, index) => {
    const imageNumber = index + 1
    const imagePattern = new RegExp(`!\\[([^\\]]*)\\]\\(image${imageNumber}\\)`, 'gi')
    const imageUrl = `/api/file/${image.fileId}`

    processedContent = processedContent.replace(
      imagePattern,
      `![$1](${imageUrl})`
    )
  })

  const genericImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  processedContent = processedContent.replace(genericImagePattern, (match, altText, src) => {
    if (src.startsWith('http') || src.startsWith('/api/file/') || src.startsWith('data:')) {
      return match
    }

    const matchingImage = [...sequencedImages.value, ...additionalImages.value].find(
      img => img.filename === src || img.filename.includes(src)
    )

    if (matchingImage) {
      return `![${altText}](/api/file/${matchingImage.fileId})`
    }

    return match
  })

  return processedContent
}

// FIXED: Load highlight.js dynamically with better error handling
const loadHighlightJS = async () => {
  if (typeof window !== 'undefined') {
    try {
      // Import highlight.js with specific languages to reduce bundle size
      const hljsModule = await import('highlight.js/lib/core')
      hljs.value = hljsModule.default

      // Import specific languages you need
      const rustLang = await import('highlight.js/lib/languages/rust')
      const cLang = await import('highlight.js/lib/languages/c')
      const haskellLang = await import('highlight.js/lib/languages/haskell')
      const pythonLang = await import('highlight.js/lib/languages/python')
      const javascriptLang = await import('highlight.js/lib/languages/javascript')
      const typescriptLang = await import('highlight.js/lib/languages/typescript')
      const xmlLang = await import('highlight.js/lib/languages/xml')

      // Register languages
      hljs.value.registerLanguage('rust', rustLang.default)
      hljs.value.registerLanguage('c', cLang.default)
      hljs.value.registerLanguage('haskell', haskellLang.default)
      hljs.value.registerLanguage('python', pythonLang.default)
      hljs.value.registerLanguage('javascript', javascriptLang.default)
      hljs.value.registerLanguage('typescript', typescriptLang.default)
      hljs.value.registerLanguage('html', xmlLang.default)

      console.log('✅ Highlight.js loaded successfully with languages:', [
        'rust', 'c', 'haskell', 'python', 'javascript', 'typescript', 'html'
      ])

      // Re-configure marked with the loaded highlight.js
      configureMarked()

      // If we already have content, re-render it with syntax highlighting
      if (postData.value?.postContent) {
        await renderMarkdownContent(postData.value.postContent)
      }

    } catch (err) {
      console.warn('❌ Failed to load highlight.js:', err)
      hljs.value = null
    }
  }
}

// FIXED: Separate markdown rendering function
const renderMarkdownContent = async (content: string) => {
  let processedContent = processMarkdownContent(content)

  try {
    const rawHtml = await marked.parse(processedContent)
    renderedContent.value = DOMPurify.sanitize(rawHtml)

    // Wait for DOM update and then apply copy buttons
    await nextTick()
    addCopyButtons()
  } catch (err) {
    console.error('Error rendering markdown:', err)
    // Fallback: render without highlighting
    renderedContent.value = DOMPurify.sanitize(processedContent)
  }
}

// FIXED: Function to fetch and render post
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
    console.log('📄 Post data loaded:', postData.value)

    if (postData.value && !postData.value.isPublished) {
      error.value = 'This post is not published yet'
      return
    }

    if (postData.value?.postContent) {
      await renderMarkdownContent(postData.value.postContent)
    }

    await Promise.all([fetchTopicPosts(), fetchGroupPosts()])
  } catch (err) {
    console.error('Error loading post:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    isLoading.value = false
  }
}

// Add copy button functionality
const addCopyButtons = () => {
  const preElements = document.querySelectorAll('.markdown-content pre')
  preElements.forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return

    const code = pre.querySelector('code')
    if (!code) return

    const copyBtn = document.createElement('button')
    copyBtn.className = 'copy-btn'
    copyBtn.textContent = 'Copy'
    copyBtn.onclick = async () => {
      try {
        // Get the raw text content, not HTML
        const textToCopy = code.textContent || ''
        await navigator.clipboard.writeText(textToCopy)
        copyBtn.textContent = 'Copied!'
        setTimeout(() => {
          copyBtn.textContent = 'Copy'
        }, 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
        copyBtn.textContent = 'Failed'
        setTimeout(() => {
          copyBtn.textContent = 'Copy'
        }, 2000)
      }
    }

    pre.style.position = 'relative'
    pre.appendChild(copyBtn)
  })
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

const getImageNumber = (image: any) => {
  const sequencedIndex = sequencedImages.value.findIndex(img => img.fileId === image.fileId)
  if (sequencedIndex !== -1) return sequencedIndex + 1

  const additionalIndex = additionalImages.value.findIndex(img => img.fileId === image.fileId)
  return additionalIndex + 1
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

      <div class="separator"></div>

      <!-- Main content area -->
      <div class="content-container">
        <!-- Markdown content -->
        <div
          class="markdown-content"
          v-html="renderedContent"
        ></div>

        <!-- Additional images gallery (images not sequenced) -->
        <div v-if="additionalImages.length > 0" class="additional-images">
          <h3>Additional Images</h3>
          <p class="section-description">
            The following images were uploaded with this post but not embedded in the content.
          </p>
          <div class="images-grid">
            <div
              v-for="(image, index) in additionalImages"
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
  border: solid 5px;
  border-radius: 15px;
  border-color: color-mix(in oklab, var(--background), var(--text) 45%);
  position: relative;
  scroll-behavior: smooth;
  background-color: var(--background);
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
  text-indent: 2em;
}

.markdown-content :deep(a) {
  color: var(--focused);
  text-decoration: none;
}

.markdown-content :deep(strong) {
  font-weight: bold;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
  color: color-mix(in oklab, var(--text), var(--focused) 60%);
  background-color: color-mix(in oklab, var(--background), var(--focused) 40%);
  border-radius: 5px;
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

.markdown-content :deep(hr) {
  border: none;
  height: 2px;
  background-color: color-mix(in oklab, var(--text), transparent 70%);
  margin: 2em 0;
  border-radius: 1px;
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

/* Enhanced code block styling */
.markdown-content :deep(pre) {
  position: relative;
  background-color: #1e1e1e !important;
  color: #d4d4d4 !important;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid color-mix(in oklab, var(--text), transparent 80%);
}

.markdown-content :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace, 'OpenDyslexicMono';
  background-color: transparent !important;
  padding: 0;
  border-radius: 0;
  font-size: 0.9em;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  display: block;
  color: inherit;
}

/* Copy button styling */
.markdown-content :deep(.copy-btn) {
  position: absolute;
  top: 8px;
  right: 8px;
  background: color-mix(in oklab, var(--focused), transparent 20%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.markdown-content :deep(.copy-btn:hover) {
  opacity: 1;
  background: var(--focused);
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 1em 0;
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
