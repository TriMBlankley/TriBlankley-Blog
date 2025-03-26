<script setup lang="ts">
import HomeBackground from '../components/Background_C/homeBackground.vue';
</script>

<template>
  <div class="backround-control">
    <HomeBackground />
  </div>
</template>

<style scoped>
.backround-control {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -200;
  background: var(--background);
  transition: background-color 0.3s ease;
}
</style>