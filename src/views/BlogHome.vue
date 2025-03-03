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

// Logic
const left_right_margin = ref('5vw');

</script>

<template>
  <div class="blog-home">

    <div class="post-view">
      <div class="tab-motif">
        <FolderTab />
      </div>
      <div class="post-cards">
        <PostDescriptor />
      </div>
    </div>


    <div class="logo-and-filter">
      <div class="logo-and-settings">
        <SettingsCog style="width: 50px;"/>
        <tbBlogLogo style="width: 100px;"/>
      </div>
      <div class="filter-and-news">
        <FilterAndNews />
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-home {
  /* Size ------------- */

  /* Position ------------- */

  /* Color ------------- */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
}

.post-view {
  /* Size ------------- */

  /* Position ------------- */
  /* top, right, bottom, left */
  margin: 2em 0.5em auto v-bind(left_right_margin);

  /* Color ------------- */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  flex-grow: 10;
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
  flex-grow: 10;
}

.post-cards {
  /* Size ------------- */

  /* Position ------------- */

  /* Color ------------- */
  background: color-mix(in oklab, var(--background), var(--focused) 20%);
  border: 7px solid var(--focused);
  border-radius: 15px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  flex-grow: 10;
}

.logo-and-filter {
  /* Size ------------- */

  /* Position ------------- */
  /* top, right, bottom, left */
  margin: 0 v-bind(left_right_margin) auto auto;

  /* Color ------------- */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
}


.logo-and-settings{
  /* Size ------------- */

  /* Position ------------- */
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
