<script setup lang="ts">

import { useRouter } from 'vue-router';
import { defineProps, defineEmits, ref, computed, onMounted, onUnmounted } from 'vue';

// Content type svg's
import filePostSVG from "@/assets/uiElements/filePost.svg";
import musicPostSVG from "@/assets/uiElements/musicPost.svg";
import videoPostSVG from "@/assets/uiElements/videoPost.svg";
import codePostSVG from "@/assets/uiElements/codePost.svg";
import textPostSVG from "@/assets/uiElements/textPost.svg";


const router = useRouter();

// Properly type the emitted events
const emit = defineEmits<{
  (e: 'click-post', postId: number): void
}>();

const props = defineProps({
  post: {
    type: Object as () => {
      postId: number;
      postTitle: string;
      postAuthor: string[];
      postDate: string;
      postContent: string;
      contentType: string;
      postTopics: string[];
      postGroup?: {
        groupId: string;
        groupName: string;
        groupColor: string;
        sequence: number;
      };
      attachedFiles: Array<{
        filename: string;
        fileId: string;
        uploadDate: string;
      }>;
    },
    required: true,
    default: () => ({
      postId: 0,
      postTitle: 'Untitled Post',
      postAuthor: 'Unknown Author',
      postDate: new Date().toLocaleDateString(),
      postContent: 'No content available',
      contentType: 'Text',
      postTopics: [],
      attachedFiles: []
    })
  }
});

const navigateToPost = () => {
  console.log('Navigating to post with ID:', props.post.postId); // Debug log
  emit('click-post', props.post.postId);

  // Use postId instead of postTitle for consistency
  router.push({
    name: 'BlogPage', // Use named route for better reliability
    params: { id: props.post.postId }
  }).catch(err => {
    console.error('Navigation error:', err);
  });
};

// Truncate content for preview
const truncatedContent = computed(() => {
  const content = props.post.postContent || '';
  return content.length > 200 ? content.substring(0, 200) + '...' : content;
});

// Get the first image from attached files
const firstImage = computed(() => {
  if (!props.post.attachedFiles || props.post.attachedFiles.length === 0) {
    return null;
  }

  const imageFiles = props.post.attachedFiles.filter(file =>
    file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)
  );

  return imageFiles.length > 0 ? imageFiles[0] : null;
});

// Check if post has images
const hasImage = computed(() => firstImage.value !== null);

// Get background image style
const postIconStyle = computed(() => {
  if (!firstImage.value) {
    return {};
  }

  return {
    backgroundImage: `url(/api/file/${firstImage.value.fileId})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
});

// Get appropriate SVG based on content type
const contentTypeSVG = computed(() => {
  const contentType = props.post.contentType || 'Text';

  switch (contentType) {
    case 'File':
      return filePostSVG;
    case 'Music':
      return musicPostSVG;
    case 'Video':
      return videoPostSVG;
    case 'Code':
      return codePostSVG;
    case 'Text':
      return textPostSVG;
    case 'None':
    default:
      return null;
  }
});

// Check if we should show an SVG
const shouldShowSVG = computed(() => {
  return contentTypeSVG.value !== null;
});

// Get content type display name
const contentTypeDisplay = computed(() => {
  return props.post.contentType || 'Text';
});

// Check if post has a group
const hasGroup = computed(() => {
  return props.post.postGroup && props.post.postGroup.groupColor;
});

// Get group color style
const groupColorStyle = computed(() => {
  if (!hasGroup.value) return {};

  return {
    backgroundColor: props.post.postGroup!.groupColor
  };
});


// Logic ---------------------------------------------------
const isMobile = ref(false);
const windowWidth = ref(window.innerWidth);

const checkScreenSize = () => {
  windowWidth.value = window.innerWidth;
  isMobile.value = windowWidth.value < 750;
};






// Lifecycle hooks
onMounted(() => {
  // Initialize responsive state
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});

</script>

<template>
  <template v-if="isMobile">
    <div class="post" @click="navigateToPost" role="button" tabindex="0">

      <template v-if="!hasImage">
      <div class="post-descriptor">
        <div class="post-header">

          <h1>{{ post.postTitle }}</h1>

        </div>
        <div class="post-meta">
          <div class="grow"></div>
          <span>By {{ post.postAuthor.join(', ') }}</span>
        </div>

        <p style="overflow: hidden;">
          {{ truncatedContent }}
        </p>

        <component v-if="shouldShowSVG" :is="contentTypeSVG" class="content-type-svg no-image" />

      </div>
      </template>


      <template v-if="hasImage">
      <div class="postIcon" :class="{ 'has-image': hasImage }" :style="postIconStyle">
        <div class="grow"></div>
        <component v-if="shouldShowSVG" :is="contentTypeSVG" class="content-type-svg has-image" />

      </div>

      <div class="post-descriptor">
        <div class="post-header">
          <h1>{{ post.postTitle }}</h1>
        </div>
        <div class="post-meta">
          <div class="grow"></div>
          <span>By {{ post.postAuthor.join(', ') }}</span>
        </div>

        <p style="overflow: hidden;">
          {{ truncatedContent }}
        </p>
      </div>
      </template>
    </div>
  </template>


  <template v-else>
    <div class="post" @click="navigateToPost" role="button" tabindex="0">

      <div class="postIcon" :class="{ 'has-image': hasImage }" :style="postIconStyle">

        <component v-if="shouldShowSVG" class="content-type-svg-background" />
        <component v-if="shouldShowSVG" :is="contentTypeSVG" class="content-type-svg" />

      </div>

      <div class="post-descriptor">
        <div class="post-header">
          <h1>{{ post.postTitle }}</h1>

          <div class="grow"></div>

          <div class="post-meta">
            <span>By {{ post.postAuthor.join(', ') }}</span>
            <span>{{ post.postDate }}</span>
          </div>
          <!-- <div v-if="hasGroup" class="group-indicator" :style="groupColorStyle"></div> -->

        </div>

        <p style="overflow: hidden;">
          {{ post.postContent }}
        </p>
      </div>
    </div>
  </template>
</template>

<style scoped>
.post {
  /* Size ------------- */
  max-height: 300px;
  height: 300px; /* Add fixed height for consistency */

  /* Position ------------- */
  margin: 5px;

  /* Color ------------- */
  background-color: color-mix(in oklab, var(--background), var(--focused) 80%);
  border: 5px solid;
  border-color: color-mix(in oklab, var(--background), var(--focused) 80%);
  border-radius: 5px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  cursor: pointer;
  overflow: hidden; /* Add this to contain all content */
}

.post-descriptor {
  position: relative; /* For SVG positioning */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  border-radius: 2.5px;
  border: none;
  padding: 7px;
  width: 100%;
  height: 100%; /* Ensure it takes full height */
  box-sizing: border-box; /* Include padding in height calculation */
  overflow: hidden; /* Contain content */
}


.post-descriptor p {
  overflow: hidden;
  margin: 0;
  flex: 1; /* Allow paragraph to grow and take available space */
  position: relative; /* Ensure proper stacking context */
  z-index: 1; /* Text should be above SVG background but below the icon */
}

.content-type-svg-background {
  background-color: var(--background);
  opacity: 33%;

  width: 100%;
  height: 100%;

  position: absolute;
  z-index: 11;
}
.content-type-svg {
  height: 3.5em;
  width: 3.5em;
  max-width: 90%;
  background-color: var(--focused);
  padding: 5px;
  border-radius: 5px;

  pointer-events: none; /* Allow clicks to pass through to underlying elements */
  position: relative;
  z-index: 12;
}

.content-type-svg.no-image {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 2; /* Above text but below interactive elements */

}

.content-type-svg.has-image {
  z-index: 2; /* Above text but below interactive elements */
  margin: 5px;
}


/* For posts with images - ensure consistent height */
.postIcon {
  margin-bottom: 5px;
  box-sizing: border-box;
  align-items: flex-start;
  justify-content: center;
  min-width: 60px;
  min-height: 120px;
  max-height: 120px; /* Limit image height */
  background-color: var(--background);
  border-radius: 2.5px;
  position: relative;
  padding: 5px;
  overflow: hidden; /* Contain image */
}

/* Desktop layout */
@media (min-width: 768px) {
  .post {
    max-height: 166px;
    height: 166px; /* Fixed height for desktop */
    display: flex;
    flex-direction: row;
  }

  .postIcon {
    margin-right: 5px;
    margin-bottom: 0;
    display: flex;
    width: 10em;
    height: 100%; /* Take full height of post */
    min-height: auto;
    max-height: none; /* Remove max-height constraint */
    align-items: center;
    justify-content: center;
    min-width: 60px;
    background-color: var(--background);
    position: relative;
    flex-shrink: 0; /* Prevent image area from shrinking */
  }

  .post-descriptor {
    flex: 1; /* Take remaining space */
    min-height: 0; /* Allow shrinking */
  }

  .content-type-svg:not(.no-image) {
    height: 100%;
    width: 7.5em;
    max-width: 90%;
  }
}

.post-header {
  display: flex;
  flex-direction: row;
}
.post-meta {
  display: flex;
  flex-direction: column;
}

/* Mobile layout adjustments */
@media (min-width: 767px) {
  .post {
    height: 150px; /* Allow natural height on mobile */
  }

  /* For mobile posts with images, ensure image doesn't dominate */
  .postIcon {
    max-height: 150px; /* Reasonable max height for mobile images */
    flex-shrink: 0; /* Prevent image from shrinking */
  }

  .content-type-svg {
    background-color: transparent;
  }
}
</style>
