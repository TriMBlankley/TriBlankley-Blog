<script setup lang="ts">
// VueJS imports
import { ref } from 'vue';


// Component Imports
import FolderTab from '@/components/blogHome_C/folderTab.vue';
import PostDescriptor from '@/components/blogHome_C/postDescriptor.vue';
import SettingsCog from '@/components/Settings_C/settingsCog.vue';
import FilterAndNews from '@/components/blogHome_C/filterAndNews.vue';

//SVG imports
import tbBlogLogo from "@/assets/uiElements/tbBlogLogo.svg"
import HomeNav from '@/components/blogHome_C/homeNav.vue';

// Logic
const left_right_margin = ref('5vw');

</script>

<template>
  <div class="blog-home">

    <div class="post-view">
      <div class="tab-motif">
        <FolderTab />
      </div>
      <div class="post-container">
        <div class="post-cards">
          <PostDescriptor />
        </div>
        <HomeNav />
      </div>

    </div>


    <div class="logo-and-filter">
      <div class="logo-and-settings">
        <SettingsCog style="width: 30px;" />
        <tbBlogLogo style="width: 70px;" />
      </div>
      <div class="filter-and-news">
        <FilterAndNews />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* MAIN CSS for Display ---------------------- */
.blog-home {
  /* Size ------------- */
  height: 100vh;

  /* Position ------------- */

  /* Color ------------- */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  overflow-y: auto;
}

/* Posts and Tabs ---------------------------- */
.post-view {
  /* Size ------------- */
  /* height: calc(100vh - 3em); */

  /* Position ------------- */
  position: relative; /* Needed for absolute positioning of children */
  z-index: 100;
  /* top, right, bottom, left */
  margin: 1.5em 0.5em auto v-bind(left_right_margin);

  /* Color ------------- */

  /* Behaviour ------------- */
  flex: 1;
  display: flex;
  flex-direction: column;


  scroll-behavior: smooth;
  /* overflow-y: auto; */
}

.tab-motif {
  /* Size ------------- */

  /* Position ------------- */

  /* top&bottom, right&left */
  margin: 0 15px;

  /* Color ------------- */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
}

.post-container {
  /* Size ------------- */
  flex: 1;
  min-height: 0; /* Important for flex children to respect overflow */

  /* Position ------------- */

  /* Color ------------- */
  background: var(--focused);
  border: 7px solid var(--focused);
  border-radius: 15px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;

}
.post-cards {
  /* Size ------------- */
  flex: 1;
  min-height: 0;

  /* Position ------------- */
  padding: 7px;

  /* Color ------------- */
  background: color-mix(in oklab, var(--background), var(--focused) 20%);

  border-radius: 7px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent nested scrolling */
}

/* Logo and Filter --------------------------- */
.logo-and-filter {
  /* Size ------------- */

  /* Position ------------- */
  position: sticky;
  top: 0;
  /* top, right, bottom, left */
  margin: 0 v-bind(left_right_margin) auto auto;

  /* Color ------------- */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
}

.logo-and-settings {
  /* Size ------------- */

  /* Position ------------- */
  z-index: 10;
  /* top, right, bottom, left */
  margin-top: .5em;

  /* Color ------------- */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
}

.filter-and-news {

  /* Size ------------- */
  width: 200px;

  /* Position ------------- */
  z-index: 1;
  /* top, right, bottom, left */
  margin: 1em 0 auto .5em;

  /* Color ------------- */
  background: color-mix(in oklab, var(--background), var(--focused) 20%);
  border: 7px solid var(--focused);
  border-radius: 15px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
}
</style>
