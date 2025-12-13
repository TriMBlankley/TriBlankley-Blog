[file name]: HomeSettings.vue
<!-- Update the script section -->
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
          <ThemeToggle style="margin-left: 20px;"/>
      </h1>
      <XButton @close="handleClose" aria-label="Close settings"/>
    </div>

    <div class="settings-content">
      <div class="settings-class">
        <button
          @click="handleTabClick('blogTopics')"
          :class="{ active: activeTab === 'blogTopics' }"
        >
          Blog Topics
        </button>
        <button
          @click="handleTabClick('groupEditor')"
          :class="{ active: activeTab === 'groupEditor' }"
        >
          Group Editor
        </button>
        <button
          @click="handleTabClick('postCreator')"
          :class="{ active: activeTab === 'postCreator' }"
        >
          Post Creator
        </button>
        <button
          @click="handleTabClick('postEditor')"
          :class="{ active: activeTab === 'postEditor' }"
        >
          Post Editor
        </button>
        <!-- Add Change Password button -->
        <button
          @click="handleTabClick('changePassword')"
          :class="{ active: activeTab === 'changePassword' }"
          class="change-password-btn"
        >
          🔐 Change Password
        </button>
      </div>

      <div class="class-options">
        <!-- Blog Topics content will appear here -->
        <TopicEditor
          v-if="activeTab === 'blogTopics'"
          :require-auth="!isAuthenticated"
        />

        <!-- Group Editor -->
        <GroupEditor
          v-if="activeTab === 'groupEditor'"
          :require-auth="!isAuthenticated"
        />

        <!-- Blog Post Creator -->
        <PostCreator
          v-if="activeTab === 'postCreator'"
          :require-auth="!isAuthenticated"
        />

        <!-- Post Editor -->
        <PostEditor
          v-if="activeTab === 'postEditor'"
          :require-auth="!isAuthenticated"
        />

        <!-- Change Password Component -->
        <ChangePassword
          v-if="activeTab === 'changePassword'"
          @success="handlePasswordChangeSuccess"
          @cancel="() => activeTab = 'settings'"
        />
      </div>
    </div>

    <!-- Password Dialog -->
    <PasswordDialog
      v-if="showPasswordDialog"
      @success="handlePasswordSuccess"
      @cancel="handlePasswordCancel"
    />
  </div>
</template>

<style>
.home-settings {
    /* Size ------------- */
    width: 100%;
    height: 100%;

    /* Position ------------- */
    z-index: 10000;
    position: relative;

    /* Color ------------- */
    background-color: var(--background);
    border: none;
    border-radius: 5px;

    /* max-width: 50px; */


    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
}

.title-nav {
    /* Size ------------- */
    height: 60px;
    /* padding: 0 20px; */
    padding: 0 10px;

    /* Position ------------- */

    /* Color ------------- */
    border-bottom: 1px solid #e0e0e0;

    /* Behaviour ------------- */
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.tabs button {
    padding: 8px 16px;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: #666;
    border-bottom: 2px solid transparent;
}

.tabs button.active {
    color: #007bff;
    border-bottom-color: #007bff;
    font-weight: 600;
}


.exit-button:hover {
    background: #e0e0e0;
}

.settings-content {
    /* Size ------------- */
    flex: 1;

    /* Position ------------- */

    /* Color ------------- */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: row;
}

.settings-class {
    /* Size ------------- */
    width: 125px;
    padding: 10px 0;

    /* Position ------------- */

    /* Color ------------- */
    /* border-right: 1px solid #e0e0e0; */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
}

.settings-class button {
    padding: 10px 10px;
    border: none;
    cursor: pointer;
    text-align: left;
    /* color: #333; */
    border-left: 3px solid transparent;
}

.settings-class button:hover {
    /* background: #f0f0f0; */
}

.settings-class button.active {
    /* font-weight: 500; */
}

.top-banner {
  display: flex;
  flex-direction: row;
  padding-left: 0px;
}

.class-options {
    /* Size ------------- */
    flex: 1;
    padding: 20px;

    /* Position ------------- */

    /* Color ------------- */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}


.change-password-btn {
  margin-top: 20px;
  background-color: #f8f9fa;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.change-password-btn:hover {
  background-color: #dc3545;
  color: white;
}

.change-password-btn.active {
  background-color: #dc3545;
  color: white;
}

</style>
