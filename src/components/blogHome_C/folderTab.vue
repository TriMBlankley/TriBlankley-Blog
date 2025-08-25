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
  }
});

// Emit the topic to change the site color, and apply filtering
const emit = defineEmits(['tab-clicked']);


console.log(`Rendering tab: ${props.title}`, {
  color: props.color,
  isActive: props.isActive
});

const tabStyle = {
  color: props.color,
};

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

    <h1 style="background-color: currentColor;">
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
  width: auto;

  /* Position ------------- */

  /* Color -------------  */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab-text {
  color: var(--text);
}
</style>
