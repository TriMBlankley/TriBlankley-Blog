<script setup lang="ts">
  import { ref } from 'vue';
  import TopicEditor from '@/components/Settings_C/TopicEditor.vue';
  import ThemeToggle from '@/components/Settings_C/ThemeToggle.vue';
  import PostCreator from '@/components/Settings_C/PostCreator.vue';
  import PostEditor from '@/components/Settings_C/PostEditor.vue';
  import GroupEditor from '@/components/Settings_C/GroupEditor.vue';
  import PasswordDialog from '@/components/Settings_C/PasswordDialog.vue';
  import ChangePassword from '@/components/Settings_C/ChangePassword.vue';

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

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

    // Require password for ALL tabs except settings (including changePassword)
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

  const handlePasswordChangeSuccess = () => {
    const token = localStorage.getItem('settingsSessionToken');
    if (!token) {
      isAuthenticated.value = false;
      // Optionally switch back to settings tab when password is changed and sessions are invalidated
      activeTab.value = 'settings';
    }
  };
  </script>

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

          <!-- This button now requires authentication like the others -->
          <button @click="handleTabClick('changePassword')" :class="{ active: activeTab === 'changePassword' }"
            class="change-password-btn">
            🔐 Change Password
          </button>
        </div>

        <div class="v-rule"></div>

        <div class="class-options">
          <TopicEditor v-if="activeTab === 'blogTopics'" :require-auth="!isAuthenticated" />
          <GroupEditor v-if="activeTab === 'groupEditor'" :require-auth="!isAuthenticated" />
          <PostCreator v-if="activeTab === 'postCreator'" :require-auth="!isAuthenticated" />
          <PostEditor v-if="activeTab === 'postEditor'" :require-auth="!isAuthenticated" />
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
    height: 100%;
    z-index: 1000;
    position: relative;
    background-color: var(--background);
    border: none;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .title-nav {
    height: 60px;
    padding: 0 10px;
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: var(--background);
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
    z-index: 10;
    flex-shrink: 0;
  }

  .settings-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }

  .settings-class {
    width: 150px;
    height: 100%;
    padding: 0;
    position: sticky;
    left: 0;
    align-self: flex-start;
    z-index: 5;
    background-color: var(--background);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    max-height: calc(100vh - 63px);
    overflow-y: auto;
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
    align-self: flex-start;
    z-index: 5;
    flex-shrink: 0;
    height: 78vh;
  }

  .class-options {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-height: 0;
  }

  .top-banner {
    display: flex;
    flex-direction: row;
    padding-left: 0px;
  }

  /* Update all buttons to have consistent styling */
  .settings-class button {
    background-color: transparent;
    transition: background-color 0.2s ease;
    color: var(--text);
  }

  .settings-class button:hover {
    background-color: color-mix(in oklab, var(--background), var(--text) 20%);
  }

  .settings-class button.active {
    background-color: color-mix(in oklab, var(--background), var(--text) 10%);
  }

  /* Change password button specific styling */
  .change-password-btn {
    margin-top: auto;
    margin-bottom: 10px;
    color: var(--ac-red);
  }

  .change-password-btn:hover {
    background-color: color-mix(in oklab, var(--background), var(--ac-red) 30%);
  }

  .change-password-btn.active {
    background-color: color-mix(in oklab, var(--background), var(--ac-red) 20%);
  }
  </style>
