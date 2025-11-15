<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import "@/assets/base.css"


import PostTitle from '@/components/BlogPost_C/PostTitle.vue'
import BottomNav from '@/components/BlogPost_C/BottomNav.vue'
import MarkdownRenderer from '@/components/BlogPost_C/MarkdownRenderer.vue'
import GalleryRenderer from '@/components/BlogPost_C/GalleryRenderer.vue'
import AttachmentHandler from '@/components/BlogPost_C/AttachmentHandler.vue'


const router = useRouter()
const route = useRoute()

interface PostData {
  postId: number
  postTitle: string
  postAuthor: string
  postDate: string
  postContent: string
  postTopics: string[]
  contentType: string
  isPublished: boolean
  showGalleryView: boolean
  attachedFiles: Array<{
    filename: string
    fileId: string
    uploadDate: string
    fileType?: string
    attachmentType?: string
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

// Navigation functions
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Computed properties for navigation
const hasPreviousTopicPost = computed(() => currentTopicIndex.value > 0)
const hasNextTopicPost = computed(() => currentTopicIndex.value < topicPosts.value.length - 1)

const previousTopicPost = computed(() =>
  hasPreviousTopicPost.value ? topicPosts.value[currentTopicIndex.value - 1] : null
)
const nextTopicPost = computed(() =>
  hasNextTopicPost.value ? topicPosts.value[currentTopicIndex.value + 1] : null
)

const hasPreviousGroupPost = computed(() => currentGroupIndex.value > 0)
const hasNextGroupPost = computed(() => currentGroupIndex.value < groupPosts.value.length - 1)

const previousGroupPost = computed(() =>
  hasPreviousGroupPost.value ? groupPosts.value[currentGroupIndex.value - 1] : null
)
const nextGroupPost = computed(() =>
  hasNextGroupPost.value ? groupPosts.value[currentGroupIndex.value + 1] : null
)

// Get audio files from attached files
const audioFiles = computed(() => {
  if (!postData.value?.attachedFiles) return []

  return postData.value.attachedFiles.filter(file => {
    // Check fileType first
    if (file.fileType === 'audio') return true

    // Check attachmentType
    if (file.attachmentType === 'audio') return true

    // Check filename extension as fallback
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']
    return audioExtensions.some(ext =>
      file.filename.toLowerCase().endsWith(ext)
    )
  })
})

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

// Function to handle file downloads
const downloadFile = async (fileId: string, filename: string) => {
  try {
    const url = `/api/file/${fileId}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (err) {
    console.error('Error downloading file:', err)
    // Fallback to direct link
    const link = document.createElement('a')
    link.href = `/api/file/${fileId}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Fetch post data
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
    console.log('🎵 Audio files found:', audioFiles.value)

    if (postData.value && !postData.value.isPublished) {
      error.value = 'This post is not published yet'
      return
    }

    await Promise.all([fetchTopicPosts(), fetchGroupPosts()])
  } catch (err) {
    console.error('Error loading post:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
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
        <!-- Markdown content with inline audio widgets -->
        <MarkdownRenderer
          :postContent="postData.postContent"
          :attachedFiles="postData.attachedFiles"
        >
          <!-- Audio widgets are now rendered inline within the markdown content -->
        </MarkdownRenderer>

        <!-- Image gallery -->
        <GalleryRenderer
          v-if="postData.showGalleryView"
          :attachedFiles="postData.attachedFiles"
          @download-file="downloadFile"
        />

        <!-- Attached files (non-image, non-audio) -->
        <AttachmentHandler
          :attachedFiles="postData.attachedFiles"
          @download-file="downloadFile"
        />
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

/* Content container */
.content-container {
  margin-bottom: 35px;
}

/* Remove the old audio section styles since audio widgets are now inline */
</style>
