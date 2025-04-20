<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { isDarkMode } = useTheme();
</script>

<template>
  <div class="home-background"
    :class="{ 'dark-mode': isDarkMode }"
    :key="String(isDarkMode)">
    </div>
</template>

<style>
.home-background {
  /* Size ---------- */
  height: 100vh;
  width: 100vw;

  /* Position -------- */
  background-size: cover;
  background-repeat: repeat;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -100;

  /* Backround ---------------- */
  background-size: 15px 15px;
  background-image: url('@/assets/Backgrounds/homeBackroundLight.svg');
  opacity: 15%;
  transition: background-image 0.2s ease;
}

.home-background.dark-mode {
  background-image: url('@/assets/Backgrounds/homeBackroundDark.svg');
}
</style>