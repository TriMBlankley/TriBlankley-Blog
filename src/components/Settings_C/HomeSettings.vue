<script setup lang="ts">
import { ref } from 'vue';
import TopicEditor from '@/components/Settings_C/TopicEditor.vue';
import ThemeToggle from '@/components/Settings_C/ThemeToggle.vue';
import PostCreator from '@/components/Settings_C/PostCreator.vue';
import PostEditor from '@/components/Settings_C/PostEditor.vue';
import GroupEditor from '@/components/Settings_C/GroupEditor.vue';
import PasswordDialog from '@/components/Settings_C/PasswordDialog.vue';
import ChangePassword from '@/components/Settings_C/ChangePassword.vue'; // Add this import
import XButton from '@/components/XButton.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Update the activeTab type to include 'changePassword'
const activeTab = ref<'settings' | 'blogTopics' | 'postCreator' | 'postEditor' | 'groupEditor' | 'changePassword'>('settings');
const isAuthenticated = ref(false);
const showPasswordDialog = ref(false);
const pendingTab = ref<string | null>(null);

const handleClose = () => {
  emit('close');
};

const handleTabClick = (tab: string) => {
  if (tab === 'settings') {
    activeTab.value = tab as any;
    return;
  }

  // Don't require password for change password tab
  if (tab === 'changePassword') {
    activeTab.value = tab as any;
    return;
  }

  if (!isAuthenticated.value) {
    pendingTab.value = tab;
    showPasswordDialog.value = true;
  } else {
    activeTab.value = tab as any;
  }
};

const handlePasswordSuccess = () => {
  isAuthenticated.value = true;
  showPasswordDialog.value = false;

  if (pendingTab.value) {
    activeTab.value = pendingTab.value as any;
    pendingTab.value = null;
  }
};

const handlePasswordCancel = () => {
  showPasswordDialog.value = false;
  pendingTab.value = null;
};

// Add function to handle password change success
const handlePasswordChangeSuccess = () => {
  // Optionally reset authentication if sessions were invalidated
  const token = localStorage.getItem('settingsSessionToken');
  if (!token) {
    isAuthenticated.value = false;
  }
  // You could also show a message or switch to a different tab
};
</script>

<!-- Update the template section -->
<template>
  <div class="home-settings">
    <div class="title-nav">
      <h1 class="top-banner">
        Settings:
        <ThemeToggle style="margin-left: 20px;" />
      </h1>
      <XButton @close="handleClose" aria-label="Close settings" />
    </div>

    <div class="h-rule"></div>

    <div class="settings-content">
      <div class="settings-class">
        <button @click="handleTabClick('blogTopics')" :class="{ active: activeTab === 'blogTopics' }">
          Blog Topics
        </button>
        <button @click="handleTabClick('groupEditor')" :class="{ active: activeTab === 'groupEditor' }">
          Group Editor
        </button>
        <button @click="handleTabClick('postCreator')" :class="{ active: activeTab === 'postCreator' }">
          Post Creator
        </button>
        <button @click="handleTabClick('postEditor')" :class="{ active: activeTab === 'postEditor' }">
          Post Editor
        </button>

        <div class="grow"></div>

        <!-- Add Change Password button -->
        <button @click="handleTabClick('changePassword')" :class="{ active: activeTab === 'changePassword' }"
          class="change-password-btn">
          🔐 Change Password
        </button>
      </div>

      <div class="v-rule"></div>

      <div class="class-options">
        <!-- Blog Topics content will appear here -->
        <TopicEditor v-if="activeTab === 'blogTopics'" :require-auth="!isAuthenticated" />

        <!-- Group Editor -->
        <GroupEditor v-if="activeTab === 'groupEditor'" :require-auth="!isAuthenticated" />

        <!-- Blog Post Creator -->
        <PostCreator v-if="activeTab === 'postCreator'" :require-auth="!isAuthenticated" />

        <!-- Post Editor -->
        <PostEditor v-if="activeTab === 'postEditor'" :require-auth="!isAuthenticated" />

        <!-- Change Password Component -->
        <ChangePassword v-if="activeTab === 'changePassword'" @success="handlePasswordChangeSuccess"
          @cancel="() => activeTab = 'settings'" />
      </div>
    </div>

    <!-- Password Dialog -->
    <PasswordDialog v-if="showPasswordDialog" @success="handlePasswordSuccess" @cancel="handlePasswordCancel" />
  </div>
</template>

<style>
.home-settings {
  /* Size ------------- */
  /* width: 100%; */
  height: 100%;

  /* Position ------------- */
  z-index: 1000;
  position: relative;

  /* Color ------------- */
  background-color: var(--background);
  border: none;
  border-radius: 5px;

  /* max-width: 50px; */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.title-nav {
  /* Size ------------- */
  height: 60px;
  /* padding: 0 20px; */
  padding: 0 10px;

  /* Position ------------- */
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--background);

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.h-rule {
  background-color: color-mix(in oklab, var(--background) 60%, var(--text) 66%);
  height: 3px;
  margin: 0px 10px;
  border-radius: 10px;
  position: sticky;
  top: 60px;
  /* Height of title-nav */
  z-index: 10;
  flex-shrink: 0;
}

.settings-content {
  /* Size ------------- */
  flex: 1;
  min-height: 0;
  /* Important for flex child scrolling */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.settings-class {
  /* Size ------------- */
  width: 150px;
  height: 100%;

  padding: 0;

  /* Position ------------- */
  position: sticky;
  left: 0;
  align-self: flex-start;
  z-index: 5;

  /* Color ------------- */
  /* border-right: 1px solid #e0e0e0; */
  background-color: var(--background);

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  max-height: calc(100vh - 63px);
  /* Adjust based on title-nav + h-rule */
  overflow-y: auto;
  /* Allow scrolling if content exceeds height */
}

.settings-class button {
  margin: 5px;
  padding: 10px 10px;
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: 5px;
  flex-shrink: 0;
}

.settings-class .grow {
  flex-grow: 1;
}

.grow {
  display: flex;
  flex-grow: 1;
}

.v-rule {
  background-color: color-mix(in oklab, var(--background) 60%, var(--text) 66%);
  width: 3px;
  margin: 10px 0px;
  border-radius: 10px;
  position: sticky;
  /* left: 105px; */
  /* Width of settings-class */
  align-self: flex-start;
  z-index: 5;
  flex-shrink: 0;
  height: 78vh;
  /* Adjust based on total sticky heights */
}

.class-options {
  /* Size ------------- */
  flex: 1;
  padding: 20px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  /* Important for scrolling */
}

.top-banner {
  display: flex;
  flex-direction: row;
  padding-left: 0px;
}

/* Update change-password-btn styles */
.change-password-btn {
  margin-top: auto;
  /* This pushes it to the bottom */
  margin-bottom: 10px;
  /* Add some bottom spacing */
  color: var(--ac-red);
  background-color: transparent;
  transition: background-color 0.2s ease;
}

/* Fix the hover and active states - remove the nested button selector */
.change-password-btn:hover {
  background-color: color-mix(in oklab, var(--background), var(--ac-red) 30%);
}

.change-password-btn.active {
  background-color: color-mix(in oklab, var(--background), var(--ac-red) 20%);
  color: var(--ac-red);
}

/* Also ensure regular buttons have proper hover states */
.settings-class button:not(.change-password-btn):hover {
  background-color: color-mix(in oklab, var(--background) 80%, var(--text) 40%);
}

.settings-class button:not(.change-password-btn).active {
  background-color: color-mix(in oklab, var(--background) 80%, var(--text) 25%);
}
</style>
