<template>
  <div class="Qtest">
    <h1>
      {{ posts }}
    </h1>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const posts = ref({});

async function fetchPosts() {
  const postsResponce = await fetch('/api/blogPost');
  const postsJson = await postsResponce.json();

  posts.value = postsJson;
}

fetchPosts();
</script>

<style scoped>
@media (min-width: 1024px) {
  .Qtest {
    min-height: 5vh;
    display: flex;
    align-items: center;
    color: blue;
  }
}
</style>
