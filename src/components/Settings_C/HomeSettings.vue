<script setup lang="ts">
import { ref } from 'vue';
import TopicEditor from '@/components/Settings_C/TopicEditor.vue';
import ThemeToggle from '@/components/Settings_C/ThemeToggle.vue';
import PostCreator from '@/components/Settings_C/PostCreator.vue';
import PostEditor from '@/components/Settings_C/PostEditor.vue';
import GroupEditor from '@/components/Settings_C/GroupEditor.vue';
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const activeTab = ref<'settings' | 'blogTopics' | 'postCreator' | 'postEditor' | 'groupEditor'>('settings'); // Update this line

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div class="home-settings">
    <div class="title-nav">
      <div class="tabs">
        <button
          @click="activeTab = 'settings'"
          :class="{ active: activeTab === 'settings' }"
        >
          Settings
        </button>
      </div>
      <button @click="handleClose" class="exit-button" aria-label="Close settings">
        <span class="exit-icon">×</span>
      </button>
    </div>

    <div class="settings-content">
      <div class="settings-class">
        <button
          @click="activeTab = 'blogTopics'"
          :class="{ active: activeTab === 'blogTopics' }"
        >
          Blog Topics
        </button>
        <button
          @click="activeTab = 'groupEditor'"
          :class="{ active: activeTab === 'groupEditor' }"
        >
          Group Editor
        </button>
        <button
          @click="activeTab = 'postCreator'"
          :class="{ active: activeTab === 'postCreator' }"
        >
          Post Creator
        </button>
        <button
          @click="activeTab = 'postEditor'"
          :class="{ active: activeTab === 'postEditor' }"
        >
          Post Editor
        </button>



      </div>

      <div class="class-options">
        <!-- General settings content can go here -->
        <div v-if="activeTab === 'settings'">
          <h3>General Settings</h3>
          <!-- Add your general settings here -->
          <ThemeToggle />
        </div>

        <!-- Blog Topics content will appear here -->
        <TopicEditor v-if="activeTab === 'blogTopics'" />

        <!-- Group Editor -->
        <GroupEditor v-if="activeTab === 'groupEditor'" />

        <!-- Blog Post Creator -->
        <PostCreator v-if="activeTab === 'postCreator'" />

        <!-- Post Editor -->
        <PostEditor v-if="activeTab === 'postEditor'" />
      </div>
    </div>
  </div>
</template>

<style>
.home-settings {
    /* Size ------------- */

    /* Position ------------- */
    z-index: 10000;

    /* Color ------------- */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
}

.title-nav {
    /* Size ------------- */

    /* Position ------------- */

    /* Color ------------- */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.settings-content {
    /* Size ------------- */

    /* Position ------------- */

    /* Color ------------- */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: row;

}

.settings-class {
    /* Size ------------- */

    /* Position ------------- */

    /* Color ------------- */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
}

.class-options {
    /* Size ------------- */

    /* Position ------------- */

    /* Color ------------- */

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
}
</style>
