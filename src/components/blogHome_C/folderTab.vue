<script setup lang="ts">
// VueJS imports
import { defineProps, defineEmits, ref, computed, onMounted, onUnmounted } from 'vue';

// Component Imports

//SVG imports
import folderTabAccent from "@/assets/uiElements/folderTab.svg";

// Logic ---------------------------------------------------

// Post Data defined with props ----------
const props = defineProps({
  title: {
    type: String,
    default: "Default Title"
  },
  color: {
    type: String,
    default: "#000000" // Default to black if no color provided
  },
  isActive: {
    type: Boolean,
    default: false
  },
});

console.log(`Rendering tab: ${props.title}`, {
  color: props.color,
  isActive: props.isActive,
});

const tabStyle = computed(() => {
  const baseStyle = {
    color: props.color,
  };

  return baseStyle;
});

// Emit the topic to change the site color, and apply filtering
const emit = defineEmits(['tab-clicked']);

const handleClick = () => {
  console.log(`Tab clicked: ${props.title}`, {
    color: props.color,
    topicName: props.title,
    currentTime: new Date().toISOString()
  });
  emit('tab-clicked', {
    color: props.color,
    topicName: props.title
  });
};
</script>

<template>
  <div class="folder-tab"
       v-bind:style="tabStyle"
       @click="handleClick">
    <!-- top, right, bottom, left -->
    <div class="tab-accent">
      <folderTabAccent />
    </div>

    <h1 class="tab-ribbon">
      <div class="tab-text">
        {{ title }}
      </div>
    </h1>

    <div class="tab-accent flipped">
      <folderTabAccent />
    </div>
  </div> <!-- folderTab -->
</template>

<style scoped>
.folder-tab {
  /* Size ------------- */
  height: auto;
  min-width: 0;

  /* Position ------------- */

  /* Color -------------  */

  /* Flex Behaviour ------------- */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  flex: .33 1 auto;

  /* Msc Behaviour */
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: pointer;

}

.tab-accent {
  /* Size ------------- */
  flex-shrink: 0; /* Prevent SVG accents from shrinking */

  /* Position ------------- */
  margin: 0 -1px -1.5px 0;

  /* Behaviour ------------- */
  display: flex;
  align-items: stretch;

}

.tab-accent.flipped {
  transform: scaleX(-1);
  margin: 0 0 -1.5px -1px;
}

.tab-accent :deep(svg) {
  height: 100%; /* Make SVG fill the accent container height */
  width: auto; /* Maintain aspect ratio */
}

.tab-ribbon {
  /* Reset h1 defaults */
  margin: 0;
  padding: 0;

  /* Size ------------- */
  flex: 1 1 auto; /* Allow to grow and shrink with auto basis */
  min-width: 0; /* Crucial for text truncation in flex children */

  /* Color ------------- */
  background-color: currentColor;

  /* Behaviour ------------- */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative; /* For proper text containment */

}

.tab-text {
  color: var(--text);
  white-space: nowrap;

  /* Ensure text is properly contained and centered */
  text-align: center;
  box-sizing: border-box;

  /* Take full available width of parent */
  width: 100%;
  max-width: 100%;

  /* Ensure proper text containment */
  overflow: hidden;
  position: relative;
  text-overflow: "-";
}


</style>
