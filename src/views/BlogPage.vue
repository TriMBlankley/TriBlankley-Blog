<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Lazy-load highlight.js to avoid SSR issues
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
  postContent: string // This will now store markdown
  postTopics: string[]
}

const postData = ref<PostData | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const goToHome = () => router.push('/')

// More complete type definition
type MarkedOptions = {
  highlight?: (code: string, lang: string, callback?: (error: any, code: string) => void) => string | void
  // Add other marked options you might need
}

const markedOptions: MarkedOptions = {
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (error) {
        console.error('Error highlighting code:', error)
        return code // Return unhighlighted code on error
      }
    }
    return hljs.highlightAuto(code).value
  }
}

marked.setOptions(markedOptions)

const markdownOptions = {
  highlight(code: string, lang: string) {
    if (hljs.value) {
      try {
        return hljs.value.highlight(code, { language: lang }).value
      } catch {
        return hljs.value.highlightAuto(code).value
      }
    }
    return code
  }
}

onMounted(async () => {
  try {
    const response = await fetch(`http://localhost:8050/api/posts/${route.params.id}`)
    if (!response.ok) throw new Error('Post not found')
    postData.value = await response.json()

    // Sanitize and render the content
    if (postData.value?.postContent) {
      renderedContent.value = DOMPurify.sanitize(
        marked.parse(postData.value.postContent)
      )
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    isLoading.value = false
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
      <div>Loading...</div>
    </template>
    <template v-else-if="error">
      <div>Error: {{ error }}</div>
    </template>
    <template v-else-if="postData">
      <PostTitle
        :postTitle="postData.postTitle"
        :postAuthor="postData.postAuthor"
        :postDate="postData.postDate"
      />
      <div class="separator"></div>

      <!-- Replace PostContent with vue-markdown-render -->
      <div
        class="markdown-content"
        v-html="renderedContent"
        style="margin-bottom: 35px;"
      ></div>

      <BottomNav />
    </template>
  </div>
</template>

<style scoped>
.blog-page {
  max-width: 950px;
  height: 100vh; /* Ensure it takes at least full viewport height */

  margin: 0 auto;
  padding: 20px;

    /* Left and Right Border (Color of backround effect) */
  background-color: var(--background);
  border-left: solid 3px;
  border-Right: solid 3px;
  border-color: color-mix(in oklab, var(--background), var(--text) 45%);


  position: relative; /* Needed for absolute positioning of children */

  scroll-behavior: smooth;
  overflow-y: auto;
}


.logo-and-settings {
  position: fixed; /* Changed from absolute to fixed */
  top: 0;
  right: 20px; /* Match the padding of blog-page */
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

.separator{
  width: 100%;
  height: 3px;

  margin-top: 5px;
  margin-bottom: 15px;

  background-color: var(--focused);

  border-radius: 5px;
  border: none;
}

[v-cloak] {
  display: none;
}
input {
  margin: 10px;
  display: block;
}


/* Add these styles for better markdown rendering */
.markdown-content {
  line-height: 1.6;
}

.markdown-content p {
  margin: 1em 0;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-content table th,
.markdown-content table td {
  border: 1px solid #ddd;
  padding: 8px;
}

.markdown-content table th {
  background-color: #f2f2f2;
}

.markdown-content pre {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content code {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
}
</style>
