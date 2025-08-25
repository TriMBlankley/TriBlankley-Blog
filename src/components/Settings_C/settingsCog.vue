<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import ThemeToggle from '@/components/Settings_C/themeToggle.vue';
import HomeSettings from '@/components/Settings_C/HomeSettings.vue';
import SettingsCogSVG from '@/assets/uiElements/settingsCog.svg';

const showThemeToggle = ref(false);
const showHomeSettings = ref(false);
const route = useRoute();

const isHomeRoute = computed(() => route.name === 'Home');

const toggleSettings = () => {
  if (isHomeRoute.value) {
    showHomeSettings.value = !showHomeSettings.value;
  } else {
    showThemeToggle.value = !showThemeToggle.value;
  }
};

const closeHomeSettings = () => {
  showHomeSettings.value = false;
};
</script>

<template>
  <div class="settings-container">
    <button class="settings-button" @click="toggleSettings">
      <SettingsCogSVG class="settings-icon" />
    </button>

    <div v-if="showThemeToggle && !isHomeRoute" class="theme-toggle-dropdown">
      <ThemeToggle />
    </div>

    <div v-if="showHomeSettings && isHomeRoute" class="settings-modal-overlay">
      <div class="settings-modal">
        <HomeSettings @close="closeHomeSettings" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  position: relative;
  display: inline-block;
  z-index: 1001; /* Higher than blog-home content */
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
  z-index: 1001;
  background: var(--focused);
  padding: 5px;
  border-radius: 8px;
  border: 1px solid var(--focused);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 5px;
}

.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* High z-index but lower than container */
}

.settings-modal {
  background: var(--focused);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative; /* Ensure stacking context */
}
</style>
