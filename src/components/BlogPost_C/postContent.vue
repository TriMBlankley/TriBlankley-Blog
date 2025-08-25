<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'

const route = useRoute()
const postId = ref(route.params.id)
const postContent = ref('')

onMounted(async () => {
  try {
    const response = await fetch(`http://localhost:8050/api/posts/${postId.value}`)
    if (!response.ok) throw new Error('Post not found')

    const postData = await response.json()
    postContent.value = marked.parse(postData.postContent)
  } catch (error) {
    console.error('Error fetching post content:', error)
    postContent.value = '<p>Error loading post content.</p>'
  }
})
</script>

<template>
  <div class="post-content">
    <p v-html="postContent"></p>
  </div>
</template>

<style>
.post-content {
    /* Size ------------- */
    height: 100%;
    width: 100%;

    /* Position ------------- */

    /* Color ------------- */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
}
</style>
