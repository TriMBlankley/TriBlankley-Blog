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
