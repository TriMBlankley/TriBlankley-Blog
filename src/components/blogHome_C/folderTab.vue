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
  width: {
    type: Number,
    default: 0
  },
  totalTabs: {
    type: Number,
    default: 1
  }
});

console.log(`Rendering tab: ${props.title}`, {
  color: props.color,
  isActive: props.isActive,
  width: props.width,
  totalTabs: props.totalTabs
});


const tabStyle = computed(() => ({
  color: props.color,
  maxWidth: props.width > 0 ? `${props.width}px` : 'none',
  flex: props.width > 0 ? '0 1 auto' : '1'
}));

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

  <!-- <div v-bind:class="tabColor"> -->
  <div class="folder-tab"
       v-bind:style="tabStyle"
       @click="handleClick">
                <!-- top, right, bottom, left -->
    <div style="margin: 0 -1px -1.5px 0;">
      <folderTabAccent style="height: 100%;" />
    </div>

    <h1 class="tab-title">
      <div class="tab-text">
        {{ title }}
      </div>
    </h1>

    <div style="-webkit-transform: scaleX(-1); transform: scaleX(-1); margin: 0 0 -1.5px -1px;">
      <folderTabAccent style="height: 100%;" />
    </div> <!-- For svg transform-->
  </div> <!-- folderTab -->
</template>

<style scoped>
.folder-tab {
  /* Size ------------- */
  height: auto;
  min-width: 0;

  /* Position ------------- */


  /* Color -------------  */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: pointer;
  flex: 0 1 auto; /* Don't grow, can shrink, basis auto for content size */
}

.tab-title {
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
  justify-content: center; /* Center content horizontally */
}

.tab-text {
  color: var(--text);
  padding: 0 12px; /* Add some padding so text doesn't touch edges */
  white-space: nowrap;

  /* Ensure text is centered and properly aligned */
  text-align: center;
  box-sizing: border-box; /* Include padding in width calculation */

  /* Only apply truncation when constrained by max-width */
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}



.folder-tab[style*="max-width"] .tab-text {
  /* When max-width is set, allow truncation */
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
