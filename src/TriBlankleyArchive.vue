<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

const LazyBackground = defineAsyncComponent({
  loader: () => import('./views/BackgroundControl.vue'),
  loadingComponent: () => null,
  delay: 200,
  timeout: 3000,
  suspensible: false
});
</script>

<template>
  <router-view />

  <LazyBackground />

</template>

<style scoped>

</style>