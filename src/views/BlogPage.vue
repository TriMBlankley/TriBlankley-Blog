<script setup lang="ts">
// Vue Imports
import { useRouter } from 'vue-router';

// Component Imports
import PostContent from '@/components/BlogPost_C/postContent.vue';
import PostTitle from '@/components/BlogPost_C/postTitle.vue';
import SettingsCog from '@/components/Settings_C/settingsCog.vue';
import BottomNav from '@/components/BlogPost_C/bottomNav.vue';

// SVG import as component
import TbBlogLogo from "@/assets/uiElements/tbBlogLogo.svg"


const router = useRouter();

const goToHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="blog-page">
    <div class="logo-and-settings">
      <SettingsCog style="width: 30px;"/>
      <button @click="goToHome" class="logo-button">
        <TbBlogLogo style="width: 70px;"/>
      </button>
    </div>

    <PostTitle />
    <div class="separator"></div>
    <PostContent style="margin-bottom: 35px;"/>
    <BottomNav />

  </div>
</template>

<style scoped>
.blog-page {
  max-width: 950px;
  max-height: 100vh; /* Ensure it takes at least full viewport height */

  margin: 0 auto;
  padding: 20px;

    /* Left and Right Border (Color of backround effect) */
  background-color: var(--background);
  border-left: solid 3px;
  border-Right: solid 3px;
  border-color: color-mix(in oklab, var(--background), var(--text) 45%);


  position: relative; /* Needed for absolute positioning of children */

  scroll-behavior: smooth;
  overflow-y: auto;
}


.logo-and-settings {
  position: fixed; /* Changed from absolute to fixed */
  top: 0;
  right: 20px; /* Match the padding of blog-page */
  z-index: 10;

  gap: 10px;
  padding: 5px 10px;

  margin-top: .5em;


  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
}

.logo-button {
  background: var(--background);
  border-radius: 70px;
  border: none;
  padding: 0;

  cursor: pointer;
  display: flex;
  align-items: center;
}

.logo-button svg {
  display: block;
}

.separator{
  width: 100%;
  height: 3px;

  margin-top: 5px;
  margin-bottom: 15px;

  background-color: var(--focused);

  border-radius: 5px;
  border: none;
}

[v-cloak] {
  display: none;
}
input {
  margin: 10px;
  display: block;
}
</style>