<script setup lang="ts">
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
})
</script>

<template>
  <div class="post-header">
    <h1>{{ postTitle }}</h1>
    <div class="post-data">
      <h2>{{ postAuthor }}</h2>
      <h2>{{ postDate }}</h2>
    </div>
  </div>
</template>

<style>
.post-header {
    /* Size ------------- */
    width: 100%;

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-items: flex-start;
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
    text-align: right;

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
    gap: 0.25em; /* Add some space between author and date */
}
</style>
