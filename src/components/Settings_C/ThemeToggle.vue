<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import LightMode from "@/assets/uiElements/lightMode.svg";
import DarkMode from "@/assets/uiElements/darkMode.svg";


const { isDarkMode, toggleTheme } = useTheme();

const emit = defineEmits<{
  themeChanged: []
}>();

const handleThemeToggle = () => {
  toggleTheme();
  // Emit event after theme is changed
  emit('themeChanged');
};
</script>

<template>
  <button @click="handleThemeToggle" class="nav-btn large-btn">
    <component :is="isDarkMode ? LightMode : DarkMode" />
  </button>
</template>

<style>

</style>
