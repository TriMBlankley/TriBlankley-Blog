<script setup lang="ts">
// VueJS imports
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';


// Component Imports
import FolderTab from '@/components/blogHome_C/folderTab.vue';
import PostDescriptor from '@/components/blogHome_C/postDescriptor.vue';
import SettingsCog from '@/components/Settings_C/settingsCog.vue';
import FilterAndNews from '@/components/blogHome_C/filterAndNews.vue';
import BlogLogo from '@/components/BlogLogo.vue';
import FolderTabDropDownButton from '@/components/blogHome_C/FolderTabDropDownButton.vue';

//SVG imports
import BottomNav from '@/components/BottomNav.vue';

// Navigation functions
const scrollToTop = () => {
  // Try scrolling the main blog container first
  const blogHome = document.querySelector('.blog-home') as HTMLElement;
  if (blogHome) {
    blogHome.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Also try window scrolling as fallback
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // And the document elements
  document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.scrollTo({ top: 0, behavior: 'smooth' });
}

// State
const topics = ref<any[]>([]);
const posts = ref<any[]>([]);
const activeTabColor = ref(localStorage.getItem('activeTabColor') || 'var(--cd-blue)');
const left_right_margin = ref('5vw');

// Add responsive state
const isMobile = ref(false);
const windowWidth = ref(window.innerWidth);

const allTopicsTab = computed(() => ({
  topicName: "All Topics",
  topicColor: "#6e93b9",
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

// Add reactive refs for tab calculations
const tabMotifWidth = ref(0);
const tabContainerRef = ref<HTMLElement | null>(null);

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

// Add responsive handlers
const checkScreenSize = () => {
  windowWidth.value = window.innerWidth;
  isMobile.value = windowWidth.value < 750;
};

// Get current active tab for mobile view
const currentActiveTab = computed(() => {
  if (activeTopic.value) {
    return topics.value.find(topic => topic.topicName === activeTopic.value);
  } else {
    return allTopicsTab.value;
  }
});


// Add reactive state for dropdown visibility
const showDropdown = ref(false);

// Method to handle topic selection from dropdown
const handleDropdownTopicSelect = (topic: any) => {
  handleTabClick({
    color: topic.topicColor,
    topicName: topic.topicName
  });
  showDropdown.value = false; // Close dropdown after selection
};

// Method to handle "All Topics" selection from dropdown
const handleAllTopicsSelect = () => {
  handleTabClick({
    color: allTopicsTab.value.topicColor,
    topicName: allTopicsTab.value.topicName
  });
  showDropdown.value = false; // Close dropdown after selection
};

// Close dropdown when clicking outside
const closeDropdown = () => {
  showDropdown.value = false;
};




// Lifecycle hooks
onMounted(() => {
  fetchTopics();
  fetchPosts();

  // Initialize responsive state
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);

  document.addEventListener('click', closeDropdown);

  // Set All Topics as active if no topic is selected
  if (!activeTopic.value) {
    document.documentElement.style.setProperty('--focused', "#6e93b9");
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
  document.removeEventListener('click', closeDropdown);
});

// Watchers
watch(activeTabColor, (color) => {
  document.documentElement.style.setProperty('--focused', color);
}, { immediate: true });
</script>


<template>
  <div class="blog-home">
    <div class="post-view">

      <!-- Mobile Layout: Dropdown Button + Active Tab -->
      <template v-if="isMobile">
        <div class="mobile-tab-container" @click.stop>
          <FolderTabDropDownButton @click="showDropdown = !showDropdown" />
          <FolderTab v-if="currentActiveTab" :key="currentActiveTab.topicName" :title="currentActiveTab.topicName"
            :color="currentActiveTab.topicColor" :is-active="true" @tab-clicked="handleTabClick" />
          <div class="tab-accent flipped">
            <MobileFolderTab />
          </div>

          <div class="grow"></div>

          <BlogLogo />

          <!-- Dropdown Menu -->
          <div v-if="showDropdown" class="dropdown-menu">
            <div class="dropdown-item" :class="{ 'active': !activeTopic }" @click="handleAllTopicsSelect">
              All Topics
            </div>
            <div v-for="topic in topics" :key="topic.topicName" class="dropdown-item"
              :class="{ 'active': activeTopic === topic.topicName }" @click="handleDropdownTopicSelect(topic)">
              {{ topic.topicName }}
            </div>
          </div>
        </div>
      </template>

      <!-- Desktop Layout: All Tabs -->
      <template v-else>
        <div class="tab-motif" ref="tabContainerRef">
          <FolderTab v-for="topic in topics" :key="topic.topicName" :title="topic.topicName" :color="topic.topicColor"
            :is-active="activeTopic === topic.topicName" @tab-clicked="handleTabClick" />

          <FolderTab :title="allTopicsTab.topicName" :color="allTopicsTab.topicColor" :is-active="!activeTopic"
            @tab-clicked="handleTabClick" />
        </div>
      </template>

      <div class="post-container">
        <div class="post-cards">
          <PostDescriptor v-for="post in posts" :key="post.postId" :post="post" @click-post="handlePostClick" />
        </div>
        <!-- In the template section, update the BottomNav usage: -->
        <BottomNav @scroll-to-top="scrollToTop" :show-navigation-buttons="false" :show-scroll-to-top="true"
          :show-theme-toggle="true" :has-previous-topic="false" :has-next-topic="false" :has-previous-group="false"
          :has-next-group="false" />
      </div>
    </div>

    <!-- Hide logo-and-settings on mobile -->
    <div v-if="!isMobile" class="logo-and-settings">
      <BlogLogo />
      <SettingsCog style="width: 2rem;" />
    </div>
  </div>
</template>

<style scoped>
/* MAIN CSS for Display ---------------------- */
.blog-home {
  /* Size ------------- */
  height: 100vh;
  min-width: 0;

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
  flex-grow: 1;
  min-width: 0;

  /* Position ------------- */
  position: relative;
  margin: 1.5em 0.5em auto v-bind(left_right_margin);

  /* Behaviour ------------- */
  flex: 1;
  display: flex;
  flex-direction: column;

  /* FIX: Remove min-height constraints that cause scrolling issues */
  min-height: auto;
}

.tab-motif {
  /* Size ------------- */
  min-width: 0;

  /* Position ------------- */
  margin: 0 15px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
}

.post-container {
  /* Size ------------- */
  flex: 1;

  /* FIX: Allow natural height and remove min-height constraints */
  min-height: auto;
  height: auto;

  /* Position ------------- */
  z-index: 1;
  margin-bottom: 7.5px;

  /* Color ------------- */
  background: var(--focused);
  border: 7px solid var(--focused);
  border-radius: 15px;


  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;

  /* FIX: Allow natural overflow */
  overflow: visible;
}

.post-cards {
  /* Size ------------- */
  flex: 1;

  /* FIX: Remove min-height constraints and allow natural sizing */
  min-height: auto;
  height: auto;

  /* Position ------------- */
  padding: 7px;

  /* Color ------------- */
  background: color-mix(in oklab, var(--background), var(--focused) 20%);
  border-radius: 7px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;

  /* FIX: Change from hidden to auto to enable scrolling */
  overflow-y: auto;

  /* FIX: Allow the container to grow naturally */
  flex-shrink: 0;
}

/* Logo and Filter --------------------------- */
.logo-and-settings {
  /* Size ------------- */
  /* height: 70px; */
  width: auto;

  /* Position ------------- */
  position: sticky;
  top: 0;
  right: 0;
  z-index: 10;

  padding: 2em;
  gap: 10px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.folder-tab-drop-down-button {
  width: 125px;
  margin-top: -70px;
  margin-left: -40px;
}

.filter-and-news {
  width: 200px;
  margin: 1em 0 auto .5em;
  background: color-mix(in oklab, var(--background), var(--focused) 20%);
  border: 7px solid var(--focused);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
}

/* Responsive adjustments */
@media (max-width: 1250px) {
  .post-view {
    margin: 1.5em 0.5em auto 0.5em;
  }

  .tab-motif {
    margin: 0 5px;
  }
}

/* FIX: Mobile-specific responsive adjustments */
@media (max-width: 750px) {
  .blog-home {
    /* FIX: Ensure proper mobile scrolling */
    height: 100vh;
    overflow-y: auto;
  }

  .post-view {
    /* FIX: Allow natural height on mobile */
    height: auto;
    min-height: auto;
    margin: 1em 0.5em;
  }

  .post-container {
    /* FIX: Remove height constraints on mobile */
    height: auto;
    min-height: auto;
  }

  .post-cards {
    /* FIX: Ensure posts can scroll naturally on mobile */
    overflow-y: visible;
    flex-shrink: 0;
  }
}

.grow {
  display: flex;
  flex-grow: 1;
}

/* Dropdown Menu Styles */
.dropdown-menu {
  position: absolute;
  top: 0;
  left: 50px;
  z-index: 1000;
  background: var(--background);
  border: 3px solid color-mix(in oklab, var(--background), var(--text) 20%);
  border-radius: 10px;
  margin-top: 5px;
  min-width: 150px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 5px;
}

.dropdown-item {
  padding: 12px 16px;
  margin: 2.5px;
  cursor: pointer;
  border: 1px solid color-mix(in oklab, var(--background), var(--text) 20%);
  border-radius: 5px;
  transition: background-color 0.2s ease;
  color: var(--text);
}


.dropdown-item:hover {
  background-color: color-mix(in oklab, var(--background), var(--focused) 20%);
}

.dropdown-item.active {
  background-color: color-mix(in oklab, var(--background), var(--focused) 30%);
  font-weight: bold;
}

.mobile-tab-container {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 1vh;
}
</style>
