<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import ThemeToggle from '@/components/Settings_C/ThemeToggle.vue';
  import HomeSettings from '@/components/Settings_C/HomeSettings.vue';
  import SettingsCogSVG from '@/assets/uiElements/settingsCog.svg';

  const showThemeToggle = ref(false);
  const showHomeSettings = ref(false);
  const route = useRoute();

  const isHomeRoute = computed(() => route.name === 'Home');

  // Close theme toggle when theme is changed
  const closeThemeToggle = () => {
    showThemeToggle.value = false;
  };

  const toggleSettings = () => {
    if (isHomeRoute.value) {
      // On home route, show home settings modal
      showHomeSettings.value = !showHomeSettings.value;
      showThemeToggle.value = false;
    } else {
      // On other routes, show theme toggle dropdown
      showThemeToggle.value = !showThemeToggle.value;
      showHomeSettings.value = false;
    }
  };

  const closeHomeSettings = () => {
    showHomeSettings.value = false;
  };

  // Handle the close event from HomeSettings
  const handleHomeSettingsClose = () => {
    showHomeSettings.value = false;
  };

  // Close dropdowns when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.settings-container')) {
      showThemeToggle.value = false;
    }
  };

  // Add click outside listener
  import { onMounted, onUnmounted } from 'vue';
  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
  </script>

  <template>
    <div class="settings-container">
      <button class="settings-button" @click="toggleSettings">
        <SettingsCogSVG class="nav-btn large-btn" />
      </button>

      <!-- Theme Toggle Dropdown (for non-home routes) -->
      <div v-if="showThemeToggle && !isHomeRoute" class="theme-toggle-dropdown">
        <ThemeToggle />
      </div>
    </div>

    <!-- Home Settings Modal Overlay -->
    <div v-if="showHomeSettings && isHomeRoute" class="settings-modal-overlay" @click.self="closeHomeSettings">
      <div class="settings-modal">
        <HomeSettings @close="handleHomeSettingsClose" />
      </div>
    </div>
  </template>

  <style scoped>
  .settings-container {
    position: relative;
    display: inline-block;
    z-index: 100;
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
    color: var(--text);

  }

  .theme-toggle-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--focused);
    padding: 5px;
    border-radius: 8px;
    border: 1px solid var(--focused);
    margin-top: 5px;
    z-index: 101;
  }

  /* Modal Overlay */
  .settings-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: color-mix(in oklab, var(--background), transparent 33%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  /* Modal Container */
  .settings-modal {
    background: var(--focused);

    border: 7.5px solid;
    border-color: var(--focused);
    border-radius: 10px;
    padding: 0;
    min-width: 0;
    max-width: 900px;
    height: 90vh;
    position: relative;
    z-index: 1001;
    animation: slideUp 0.3s ease-out;
    flex-grow: 1;
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .settings-modal {
      min-width: 95%;
      margin: 10px;
    }
  }

  @media (max-width: 768px) {
    .settings-modal {
      min-width: 98%;
      margin: 5px;
      max-height: 95vh;
    }
  }
  </style>
