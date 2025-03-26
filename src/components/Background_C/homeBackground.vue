<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import { ref, watch, onMounted } from 'vue';
import homeBackroundLight from '@/assets/Backgrounds/homeBackroundLight.svg';
import homeBackroundDark from '@/assets/Backgrounds/homeBackroundDark.svg';

const { isDarkMode } = useTheme();
const bgClasses = ref(['home-background', isDarkMode.value ? 'dark-mode' : 'light-mode']);

watch(isDarkMode, (newVal) => {
  // Start transition
  bgClasses.value = ['home-background', 'fade-out'];

  // After fade out completes, switch background and fade in
  setTimeout(() => {
    bgClasses.value = ['home-background', newVal ? 'dark-mode' : 'light-mode'];
  }, 300);
});

// Set initial class
onMounted(() => {
  bgClasses.value = ['home-background', isDarkMode.value ? 'dark-mode' : 'light-mode'];
});
</script>

<template>
  <div :class="bgClasses"></div>
</template>

<style>
.home-background {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -100;
  background-size: 15px 15px;
  background-repeat: repeat;
  opacity: 0.2;
  transition: opacity 0.3s ease;
}

.home-background.light-mode {
  background-image: url('@/assets/Backgrounds/homeBackroundLight.svg');
}

.home-background.dark-mode {
  background-image: url('@/assets/Backgrounds/homeBackroundDark.svg');
}

.home-background.fade-out {
  opacity: 0;
}
</style>