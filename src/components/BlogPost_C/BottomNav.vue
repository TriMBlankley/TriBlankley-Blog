<script setup lang="ts">
defineProps<{
  hasPreviousTopic: boolean
  hasNextTopic: boolean
  hasPreviousGroup: boolean
  hasNextGroup: boolean
}>()

const emit = defineEmits<{
  'scroll-to-top': []
  'previous-topic': []
  'next-topic': []
  'previous-group': []
  'next-group': []
}>()
</script>

<template>
  <div class="post-nav">
    <button
      class="nav-btn"
      @click="emit('scroll-to-top')"
    >
      Back to top of page
    </button>
    <button
      class="nav-btn"
      @click="emit('previous-topic')"
      :disabled="!hasPreviousTopic"
    >
      Previous post in Topic
    </button>
    <button
      class="nav-btn"
      @click="emit('next-topic')"
      :disabled="!hasNextTopic"
    >
      Next post in Topic
    </button>
    <button
      class="nav-btn"
      @click="emit('previous-group')"
      :disabled="!hasPreviousGroup"
    >
      Previous post in Group
    </button>
    <button
      class="nav-btn"
      @click="emit('next-group')"
      :disabled="!hasNextGroup"
    >
      Next post in Group
    </button>
  </div>
</template>

<style>
.post-nav {
    /* Size ------------- */
    height: 40px;

    /* Position ------------- */

    /* Color ------------- */
    background-color: var(--focused);

    border: none;
    border-radius: 7px;
    /* Behaviour ------------- */
    display: flex;
    flex-direction: row;
}

.nav-btn {
    flex: 1;
    margin: 0 2px;
    border: none;
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
}

.nav-btn:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.3);
}

.nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
