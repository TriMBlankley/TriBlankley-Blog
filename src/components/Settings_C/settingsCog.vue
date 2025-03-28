<script setup lang="ts">
import { ref } from 'vue';
import ThemeToggle from '@/components/Settings_C/themeToggle.vue';
import SettingsCogSVG from '@/assets/uiElements/settingsCog.svg';

const showThemeToggle = ref(false);

const toggleSettings = () => {
  showThemeToggle.value = !showThemeToggle.value;
};
</script>

<template>
  <div class="settings-container">
    <button class="settings-button" @click="toggleSettings">
      <SettingsCogSVG class="settings-icon" />
    </button>
    <div class="theme-toggle-dropdown" v-if="showThemeToggle">
      <ThemeToggle />
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  position: relative;
  display: inline-block;
}

.settings-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-icon {
  width: 100%;
  height: 100%;
  color: var(--text);
}

.theme-toggle-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  background: var(--focused);
  padding: 5px;
  border-radius: 8px;
  border: 1px solid var(--focused);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 5px;
}
</style>