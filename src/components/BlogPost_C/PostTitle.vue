<script setup lang="ts">
import BlogLogo from '@/components/BlogLogo.vue';

defineProps({
  postTitle: {
    type: String,
    required: true
  },
  postAuthor: {
    type: String,
    required: true
  },
  postDate: {
    type: String,
    required: true
  }
});
</script>

<template>
  <div class="post-header">
    <div class="post-header-content">
      <h1>{{ postTitle }}</h1>
      <div class="post-data">
        <h2>{{ postAuthor.join(', ') }}</h2>
        <h2>{{ postDate }}</h2>
      </div>
    </div>

    <div class="grow"></div>

    <BlogLogo />
  </div>
</template>

<style>
.post-header {
    /* Size ------------- */
    width: 100%;

    /* Behaviour ------------- */
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    flex-wrap: nowrap;
}

.post-header-content {
    /* Size ------------- */
    width: auto;

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
}



.post-header h1 {
    /* Behaviour ------------- */
    flex: 0 0 auto; /* Don't grow or shrink */

}

.post-data {
    /* Size ------------- */
    flex: 0 0 auto; /* Don't grow or shrink */

    /* Color ------------- */
    color: var(--text-offset);

    /* Text ----------------- */
    font-size: .75em;
    text-align: left;

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
    gap: 0.25em; /* Add some space between author and date */
}

.grow {
  display: flex;
  flex-grow: 1;
}
</style>
