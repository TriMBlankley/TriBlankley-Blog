<script setup lang="ts">

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import filePostSVG from "@/assets/uiElements/filePost.svg";

const router = useRouter();

// Properly type the emitted events
const emit = defineEmits<{
  (e: 'click-post', postId: number): void
}>();

const props = defineProps({
  post: {
    type: Object as () => {
      postId: number;
      postTitle: string;
      postAuthor: string;
      postDate: string;
      postContent: string;
      postTopics: string[];
    },
    required: true,
    default: () => ({
      postId: 0,
      postTitle: 'Untitled Post',
      postAuthor: 'Unknown Author',
      postDate: new Date().toLocaleDateString(),
      postContent: 'No content available',
      postTopics: []
    })
  }
});

const navigateToPost = () => {
  console.log('Navigating to post with ID:', props.post.postId); // Debug log
  emit('click-post', props.post.postId);

  // Use postId instead of postTitle for consistency
  router.push({
    name: 'BlogPage', // Use named route for better reliability
    params: { id: props.post.postId }
  }).catch(err => {
    console.error('Navigation error:', err);
  });
};

// Truncate content for preview
const truncatedContent = computed(() => {
  const content = props.post.postContent || '';
  return content.length > 200 ? content.substring(0, 200) + '...' : content;
});
</script>

<template>
  <div class="post" @click="navigateToPost" role="button" tabindex="0">
    <div class="postIcon">
      <filePostSVG style="height: 100%; margin: 5px;"/>
    </div>

    <div class="postDescriptor">
      <h1>{{ post.postTitle }}</h1>
      <div class="post-meta">
        <span>By {{ post.postAuthor }}</span>
        <span>{{ post.postDate }}</span>
      </div>
      <p style="overflow: hidden;">
        {{ truncatedContent }}
      </p>
      <div class="post-topics" v-if="post.postTopics && post.postTopics.length > 0">
        <span v-for="topic in post.postTopics" :key="topic" class="topic-tag">
          {{ topic }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post {
  /* Size ------------- */

  /* Position ------------- */
  margin: 5px;

  /* Color ------------- */
  background-color: color-mix(in oklab, var(--background), var(--focused) 80%);

  border: 5px solid;
  border-color: color-mix(in oklab, var(--background), var(--focused) 80%);
  border-radius: 5px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  cursor: pointer;
}

.postDescriptor {
  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  border-radius: 5px;
  border: none;
  padding: 7px;
  width: 100%;
}

.postIcon {
  margin-right: 5px;
}

.post-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-offset);
  margin: 0.25rem 0;
}

.post-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.topic-tag {
  padding: 0.25rem 0.5rem;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: 4px;
  font-size: 0.75rem;
}
</style>
