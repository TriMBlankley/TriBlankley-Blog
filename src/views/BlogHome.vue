<script setup lang="ts">
// VueJS imports
import { ref, onMounted, watch, computed } from 'vue';

// Component Imports
import FolderTab from '@/components/blogHome_C/folderTab.vue';
import PostDescriptor from '@/components/blogHome_C/postDescriptor.vue';
import SettingsCog from '@/components/Settings_C/settingsCog.vue';
import FilterAndNews from '@/components/blogHome_C/filterAndNews.vue';

//SVG imports
import tbBlogLogo from "@/assets/uiElements/tbBlogLogo.svg"
import HomeNav from '@/components/blogHome_C/homeNav.vue';

// State
const topics = ref<any[]>([]);
const posts = ref<any[]>([]);
const activeTabColor = ref(localStorage.getItem('activeTabColor') || 'var(--cd-blue)');
const left_right_margin = ref('5vw');


const allTopicsTab = computed(() => ({
  topicName: "All Topics",
  topicColor: "#b78fbc",
  topicOrder: 100 // Place it after all other topics
}));

// Data fetching
const fetchTopics = async () => {
  try {
    const response = await fetch('/api/topics');
    if (!response.ok) throw new Error('Failed to fetch topics');
    const data = await response.json();
    topics.value = data.sort((a: any, b: any) => a.topicOrder - b.topicOrder);
  } catch (error) {
    console.error('Error in fetchTopics:', error);
  }
};

const activeTopic = ref<string | null>(null);

const fetchPosts = async () => {
  try {
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('Failed to fetch posts');
    let allPosts = await response.json();

    // Filter by published status first
    allPosts = allPosts.filter((post: any) => post.isPublished);

    // Then filter by topic if one is selected
    if (activeTopic.value) {
      allPosts = allPosts.filter((post: any) =>
        post.postTopics.includes(activeTopic.value)
      );
    }

    posts.value = allPosts;
  } catch (error) {
    console.error('Error in fetchPosts:', error);
  }
};

const handleTabClick = (tabData: { color: string, topicName: string }) => {
  if (tabData.topicName === "All Topics") {
    activeTopic.value = null;
    activeTabColor.value = tabData.color;
  } else {
    activeTabColor.value = tabData.color;
    activeTopic.value = tabData.topicName;
  }

  localStorage.setItem('activeTabColor', tabData.color);
  document.documentElement.style.setProperty('--focused', tabData.color);
  fetchPosts();
};

// Add a method to clear topic filter if needed
const clearTopicFilter = () => {
  activeTopic.value = null;
  fetchPosts();
};

const handlePostClick = (postId: number) => {
  console.log('Post clicked:', postId);
  // Add any additional post-click logic here
};

// Lifecycle hooks
onMounted(() => {
  fetchTopics();
  fetchPosts();

  // Set All Topics as active if no topic is selected
  if (!activeTopic.value) {
    document.documentElement.style.setProperty('--focused', "#b78fbc");
  }
});

// Watchers
watch(activeTabColor, (color) => {
  document.documentElement.style.setProperty('--focused', color);
}, { immediate: true });
</script>

<template>
  <div class="blog-home">
    <div class="post-view">
      <div class="tab-motif">
        <FolderTab
          v-for="topic in topics"
          :key="topic.topicName"
          :title="topic.topicName"
          :color="topic.topicColor"
          :is-active="activeTabColor === topic.topicColor"
          @tab-clicked="handleTabClick"
        />

        <FolderTab
          :title="allTopicsTab.topicName"
          :color="allTopicsTab.topicColor"
          :is-active="!activeTopic"
          @tab-clicked="handleTabClick"
        />
      </div>
      <div class="post-container">
        <div class="post-cards">
          <PostDescriptor
            v-for="post in posts"
            :key="post.postId"
            :post="post"
            @click-post="handlePostClick"
          />
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
  /* z-index: 100; */
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
