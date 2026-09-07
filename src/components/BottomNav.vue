<script setup lang="ts">
import nextPostInGroup from "@/assets/uiElements/nextPostInGroup.svg";
import nextPostInTopic from "@/assets/uiElements/nextPostInTopic.svg";
import Arrow from "@/assets/uiElements/leftRightArrow.svg";

import ThemeToggle from '@/components/Settings_C/ThemeToggle.vue';
import { ref, onMounted, onUnmounted } from 'vue';

// Define props with default values in a single call
const props = withDefaults(defineProps<{
  hasPreviousTopic: boolean
  hasNextTopic: boolean
  hasPreviousGroup: boolean
  hasNextGroup: boolean
  showNavigationButtons?: boolean
  showScrollToTop?: boolean
  showThemeToggle?: boolean
}>(), {
  showNavigationButtons: false,
  showScrollToTop: true,
  showThemeToggle: true
})

const emit = defineEmits<{
  'scroll-to-top': []
  'previous-topic': []
  'next-topic': []
  'previous-group': []
  'next-group': []
}>()

</script>

<template>
  <div class="bottom-nav" >
    <!-- Scroll to Top Button - conditionally rendered -->
    <button v-if="showScrollToTop" class="nav-btn large-btn"
      @click="emit('scroll-to-top')"
      aria-label="Scroll to top" 
      alt="Scroll to top">
      <Arrow class="btn-icon rotate-90-left" />
    </button>

    <!-- Theme Toggle Button - conditionally rendered -->
    <div v-if="showThemeToggle"
      aria-label="Toggle theme" alt="Toggle theme">
      <ThemeToggle />
    </div>

    <div class="grow"></div>

    <!-- Navigation Buttons (Topic/Group) - conditionally rendered -->
    <div v-if="showNavigationButtons" class="column">
      <div class="row">
        <button class="nav-btn short" 
          @click="emit('previous-topic')" :disabled="!hasPreviousTopic"
          aria-label="Previous post in category"
          alt="Previous post in category">
          <nextPostInTopic class="btn-icon flipped short" />
        </button>
        <button class="nav-btn short" 
          @click="emit('next-topic')" :disabled="!hasNextTopic"
          aria-label="Next post in category"
          alt="Next post in category">
          <nextPostInTopic class="btn-icon short" />
        </button>
      </div>

      <div class="row">
        <button class="nav-btn short" 
          @click="emit('previous-group')" :disabled="!hasPreviousGroup"
          aria-label="Previous post in group"
          alt="Previous post in group">
          <nextPostInGroup class="btn-icon flipped short" />
        </button>
        <button class="nav-btn short" 
          @click="emit('next-group')" :disabled="!hasNextGroup"
          aria-label="Next post in group"
          alt="Next post in group">
          <nextPostInGroup class="btn-icon short" />
        </button>
      </div>
    </div>

  </div>


</template>

<style scoped>
.bottom-nav {
  /* Size ------------- */
  height: auto;

  /* Position ------------- */
  padding: 4px;
  /* padding-left: 6px; */

  /* Color ------------- */
  background-color: var(--focused);

  border: none;
  border-radius: 7px;
  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;

  /* Default position - at bottom of content */
  margin-top: 7.5px;
  transition: transform 0.3s ease, position 0.3s ease;
}

/* Pulled up state - fixed at bottom of viewport */
.bottom-nav.pulled-up {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 950px;
  z-index: 1000;
  margin-top: 0;
}



.column {
  width: auto;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 2px;
}

.row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
}

.grow {
  display: flex;
  flex-grow: 2;
}

h3 {
  margin: 0;
  white-space: nowrap;
  transition: opacity 0.2s;
}

/* Tooltip styles */
.tooltip {
  position: fixed;
  background-color: var(--focused);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  border: 2.5px solid color-mix(in oklab, var(--background), var(--focused) 20%);
  z-index: 1000;
  pointer-events: none;
  /* max-width: 200px;  */
  text-align: center;
  transition: opacity 0.3s ease;
}

/* Enhanced tooltip for touch devices */
.tooltip.touch-tooltip {
  font-size: 16px;
  padding: 10px 14px;
  border-width: 3px;
}

/* Hint message styles */
.hint-message {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--focused);
  color: var(--text);
  padding: 8px 12px 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  opacity: 0.9;
  z-index: 999;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 90%;
  pointer-events: auto;
}

.hint-message.mobile-hint {
  font-size: 11px;
  padding: 10px 12px 10px 16px;
}

.hint-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hint-close-btn {
  background: none;
  border: none;
  color: var(--text);
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease, background-color 0.2s ease;
  flex-shrink: 0;
}

.hint-close-btn:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.2);
}

.hint-close-btn:active {
  background-color: rgba(255, 255, 255, 0.3);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .hint-message {
    font-size: 11px;
    padding: 10px 12px 10px 14px;
  }

  .hint-close-btn {
    padding: 3px;
  }

  .hint-close-btn svg {
    width: 14px;
    height: 14px;
  }
}
</style>
