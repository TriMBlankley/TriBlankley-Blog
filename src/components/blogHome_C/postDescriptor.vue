<script setup lang="ts">

import { computed } from 'vue';
import { useRouter } from 'vue-router';

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

</script>

<template>
  <div class="post" @click="navigateToPost" role="button" tabindex="0">
    <div class="postIcon" :class="{ 'has-image': hasImage }" :style="postIconStyle">
      <component v-if="shouldShowSVG" :is="contentTypeSVG" class="content-type-svg" />

    </div>

    <div class="postDescriptor">
      <div class="post-header">
        <h1>{{ post.postTitle }}</h1>

        <div class="post-meta">
          <span>By {{ post.postAuthor.join(', ') }}</span>
          <span>{{ post.postDate }}</span>
        </div>
        <div v-if="hasGroup" class="group-indicator" :style="groupColorStyle"></div>

      </div>

      <p style="overflow: hidden;">
        {{ truncatedContent }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.post {
  /* Size ------------- */

  /* Position ------------- */
  margin: 5px;

  /* Color ------------- */
  background-color: color-mix(in oklab, var(--background), var(--focused) 80%);

  border: 5px solid;
  border-color: color-mix(in oklab, var(--background), var(--focused) 80%);
  border-radius: 5px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  cursor: pointer;
}

.postDescriptor {
  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  border-radius: 5px;
  border: none;
  padding: 7px;
  width: 100%;
}

.post-header {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  /* justify-content: space-between; */
  align-items: flex-start;
  gap: 10px;
}

.post-header h1 {
  margin: 0;
  flex: 1;

}

.content-type-badge {
  background: var(--accent-light);
  color: var(--accent);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.postIcon {
  margin-right: 5px;
  display: flex;
  width: 10em;
  height: 12em;
  align-items: center;
  justify-content: center;
  min-width: 60px; /* Adjust as needed */
  min-height: 60px; /* Adjust as needed */
  background-color: var(--background);
  border-radius: 5px;
  position: relative; /* Added for group indicator positioning */
}

.content-type-svg {
  height: 100%;
  margin: 1em auto;
  width: 7.5em;
  max-width: 90%;
}

/* Group indicator styles */
.group-indicator {
  margin: auto 5px auto auto;
  width: 20px;
  height: 80%;
  border-radius: 5px;
  border: 2px solid color-mix(in oklab, var(--background), transparent 50%);

  z-index: 3; /* Ensure it appears above the overlay and SVG */
}

/* Styles only applied when post has an image */
.postIcon.has-image {
  position: relative;
  border-radius: 5px;
  overflow: hidden;
}

.postIcon.has-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: color-mix(in oklab, var(--background), transparent 60%); /* Dark overlay for better SVG visibility */
  z-index: 1;
}

.postIcon.has-image .content-type-svg {
  position: relative;
  z-index: 2;
  filter: brightness(1.2); /* Improve SVG visibility on dark backgrounds */
}

.post-meta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-offset);
  margin: 0.25rem 0;
}

.post-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.topic-tag {
  padding: 0.25rem 0.5rem;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: 4px;
  font-size: 0.75rem;
}
</style>
