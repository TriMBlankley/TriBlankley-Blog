<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import LightMode from "@/assets/uiElements/LightMode.svg";
import DarkMode from "@/assets/uiElements/DarkMode.svg";

const { isDarkMode, toggleTheme } = useTheme();
</script>

<template>
  <button @click="toggleTheme" class="theme-toggle">
    <component :is="isDarkMode ? LightMode : DarkMode" />
  </button>
</template>

<style>
.theme-toggle {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  background-color: var(--cd-turqoise);
  color: var(--text);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle svg {
  width: 20px;
  height: 20px;
}
</style>