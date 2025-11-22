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
  <button @click="handleThemeToggle" class="theme-toggle">
    <component :is="isDarkMode ? LightMode : DarkMode" />
  </button>
</template>

<style>
.theme-toggle {
  /* Size -------- */
  padding: 3px 4.5px;

  /* Color */
  color: var(--text);
  background: none;
  border: none;

  /* Behaviour ----------- */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.theme-toggle svg {
  width: 25px;
  height: 25px;
}
</style>
