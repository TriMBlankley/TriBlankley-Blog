<script setup lang="ts">
import BackgroundTileTest from '@/components/Background_C/BackgroundTileTest.vue';
import HomeBackground from '../components/Background_C/homeBackground.vue';
</script>

<template>
  <div class="backround-control">
    <HomeBackground />
    <!-- <BackgroundTileTest /> -->
  </div>
</template>

<style scoped>
.backround-control {
  /* Size ------------- */
  width: 100vw;
  height: 100vh;

  /* Position ----------- */
  position: absolute;
  top: 0;
  left: 0;
  z-index: -200;

  /* Color ------------------ */
  background: var(--background);
  transition: background-color 0.2s ease;

  /* Behaviour ------------------ */
  overflow: hidden;
}
</style>