<script setup lang="ts">
import nextPostInGroup from "@/assets/uiElements/NextPostInGroup.svg";
import nextPostInTopic from "@/assets/uiElements/NextPostInTopic.svg";
import Arrow from "@/assets/uiElements/upDownArrow.svg";

import ThemeToggle from '@/components/Settings_C/ThemeToggle.vue';
import { ref, onMounted, onUnmounted } from 'vue';

defineProps<{
  hasPreviousTopic: boolean
  hasNextTopic: boolean
  hasPreviousGroup: boolean
  hasNextGroup: boolean
}>()

const emit = defineEmits<{
  'scroll-to-top': []
  'previous-topic': []
  'next-topic': []
  'previous-group': []
  'next-group': []
}>()

// Reactive state for hover tracking
const isHoveringTopic = ref(false);
const isHoveringGroup = ref(false);
const isHoveringScrollToTop = ref(false);
const isHoveringTheme = ref(false);
// const tooltipPosition = ref({ x: 0, y: 0 });
const currentTooltip = ref('');
const isTouchDevice = ref(false);
const activeTooltip = ref('');
const tooltipTimer = ref<number | null>(null);
// At the top with your other refs, add:
const tooltipPosition = ref({ x: -1000, y: -1000 }); // Start off-screen

// Detect touch device
onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
});

onUnmounted(() => {
  if (tooltipTimer.value) {
    clearTimeout(tooltipTimer.value);
  }
});

const updateTooltipPosition = (event: MouseEvent | TouchEvent, tooltipType: string) => {
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

  const x = clientX;
  const y = clientY;

  // Calculate tooltip dimensions (approximate)
  const tooltipWidth = 200;
  const tooltipHeight = 40;
  const offsetX = 10;
  const offsetY = 10;

  // Calculate proposed position (up and to the left)
  let proposedX = x - tooltipWidth - offsetX;
  let proposedY = y - tooltipHeight - offsetY;

  // Boundary checks
  if (proposedX < 5) {
    proposedX = x + offsetX;
  }

  if (proposedY < 5) {
    proposedY = y + offsetY;
  }

  if (proposedX + tooltipWidth > window.innerWidth - 5) {
    proposedX = window.innerWidth - tooltipWidth - 5;
  }

  if (proposedY + tooltipHeight > window.innerHeight - 5) {
    proposedY = window.innerHeight - tooltipHeight - 5;
  }

  tooltipPosition.value = {
    x: proposedX,
    y: proposedY
  };
  currentTooltip.value = tooltipType;
};

const showTooltip = (event: MouseEvent | TouchEvent, tooltipType: string) => {
  if (isTouchDevice.value) {
    // On touch devices, show tooltip immediately and keep it visible
    activeTooltip.value = tooltipType;
    updateTooltipPosition(event, tooltipType);

    // Clear any existing timer
    if (tooltipTimer.value) {
      clearTimeout(tooltipTimer.value);
    }
  } else {
    // On desktop, use hover behavior
    updateTooltipPosition(event, tooltipType);
    switch (tooltipType) {
      case 'scroll-to-top':
        isHoveringScrollToTop.value = true;
        break;
      case 'theme':
        isHoveringTheme.value = true;
        break;
      case 'previous-topic':
      case 'next-topic':
        isHoveringTopic.value = true;
        break;
      case 'previous-group':
      case 'next-group':
        isHoveringGroup.value = true;
        break;
    }
  }
};

const hideTooltip = (tooltipType: string) => {
  if (isTouchDevice.value) {
    // On touch devices, hide after a delay
    tooltipTimer.value = window.setTimeout(() => {
      if (activeTooltip.value === tooltipType) {
        activeTooltip.value = '';
      }
    }, 1500);
  } else {
    // On desktop, hide immediately
    switch (tooltipType) {
      case 'scroll-to-top':
        isHoveringScrollToTop.value = false;
        break;
      case 'theme':
        isHoveringTheme.value = false;
        break;
      case 'previous-topic':
      case 'next-topic':
        isHoveringTopic.value = false;
        break;
      case 'previous-group':
      case 'next-group':
        isHoveringGroup.value = false;
        break;
    }
  }
};

const handleTouchStart = (event: TouchEvent, tooltipType: string) => {
  showTooltip(event, tooltipType);
};

const handleTouchEnd = (tooltipType: string) => {
  hideTooltip(tooltipType);
};

const getTooltipText = (tooltipType: string) => {
  switch (tooltipType) {
    case 'scroll-to-top':
      return 'Scroll to Top';
    case 'theme':
      return 'Toggle Theme';
    case 'previous-topic':
      return 'Previous Post in Category';
    case 'next-topic':
      return 'Next Post in Category';
    case 'previous-group':
      return 'Previous Post in Group';
    case 'next-group':
      return 'Next Post in Group';
    default:
      return '';
  }
};

const shouldShowTooltip = (tooltipType: string) => {
  if (isTouchDevice.value) {
    return activeTooltip.value === tooltipType;
  } else {
    switch (tooltipType) {
      case 'scroll-to-top':
        return isHoveringScrollToTop.value;
      case 'theme':
        return isHoveringTheme.value;
      case 'previous-topic':
      case 'next-topic':
        return isHoveringTopic.value;
      case 'previous-group':
      case 'next-group':
        return isHoveringGroup.value;
      default:
        return false;
    }
  }
};
</script>

<template>
  <div class="bottom-nav">
    <button class="nav-btn large-btn" @click="emit('scroll-to-top')"
      @mouseenter="(e) => showTooltip(e, 'scroll-to-top')" @mouseleave="() => hideTooltip('scroll-to-top')"
      @mousemove="(e) => updateTooltipPosition(e, 'scroll-to-top')"
      @touchstart="(e) => handleTouchStart(e, 'scroll-to-top')" @touchend="() => handleTouchEnd('scroll-to-top')"
      aria-label="Scroll to top" alt="Scroll to top">
      <Arrow class="btn-icon" />
    </button>

    <button class="nav-btn large-btn" @mouseenter="(e) => showTooltip(e, 'theme')"
      @mouseleave="() => hideTooltip('theme')" @mousemove="(e) => updateTooltipPosition(e, 'theme')"
      @touchstart="(e) => handleTouchStart(e, 'theme')" @touchend="() => handleTouchEnd('theme')"
      aria-label="Toggle theme" alt="Toggle theme">
      <ThemeToggle />
    </button>

    <div class="grow"></div>

    <div class="column">
      <div class="row">
        <button class="nav-btn short" @click="emit('previous-topic')" :disabled="!hasPreviousTopic"
          @mouseenter="(e) => showTooltip(e, 'previous-topic')" @mouseleave="() => hideTooltip('previous-topic')"
          @mousemove="(e) => updateTooltipPosition(e, 'previous-topic')"
          @touchstart="(e) => handleTouchStart(e, 'previous-topic')" @touchend="() => handleTouchEnd('previous-topic')"
          aria-label="Previous post in category" alt="Previous post in category">
          <nextPostInTopic class="btn-icon flipped short" />
        </button>
        <button class="nav-btn short" @click="emit('next-topic')" :disabled="!hasNextTopic"
          @mouseenter="(e) => showTooltip(e, 'next-topic')" @mouseleave="() => hideTooltip('next-topic')"
          @mousemove="(e) => updateTooltipPosition(e, 'next-topic')"
          @touchstart="(e) => handleTouchStart(e, 'next-topic')" @touchend="() => handleTouchEnd('next-topic')"
          aria-label="Next post in category" alt="Next post in category">
          <nextPostInTopic class="btn-icon short" />
        </button>
      </div>

      <div class="row">
        <button class="nav-btn short" @click="emit('previous-group')" :disabled="!hasPreviousGroup"
          @mouseenter="(e) => showTooltip(e, 'previous-group')" @mouseleave="() => hideTooltip('previous-group')"
          @mousemove="(e) => updateTooltipPosition(e, 'previous-group')"
          @touchstart="(e) => handleTouchStart(e, 'previous-group')" @touchend="() => handleTouchEnd('previous-group')"
          aria-label="Previous post in group" alt="Previous post in group">
          <nextPostInGroup class="btn-icon flipped short" />
        </button>
        <button class="nav-btn short" @click="emit('next-group')" :disabled="!hasNextGroup"
          @mouseenter="(e) => showTooltip(e, 'next-group')" @mouseleave="() => hideTooltip('next-group')"
          @mousemove="(e) => updateTooltipPosition(e, 'next-group')"
          @touchstart="(e) => handleTouchStart(e, 'next-group')" @touchend="() => handleTouchEnd('next-group')"
          aria-label="Next post in group" alt="Next post in group">
          <nextPostInGroup class="btn-icon short" />
        </button>
      </div>
    </div>

    <!-- Single tooltip element that changes content -->
    <div v-show="shouldShowTooltip(currentTooltip)" class="tooltip" :class="{ 'touch-tooltip': isTouchDevice }" :style="{
      left: `${tooltipPosition.x}px`,
      top: `${tooltipPosition.y}px`
    }">
      {{ getTooltipText(currentTooltip) }}
    </div>
  </div>
</template>

<style>
.bottom-nav {
  /* Size ------------- */
  height: auto;

  /* Position ------------- */
  padding: 4px;
  padding-left: 6px;

  /* Color ------------- */
  background-color: var(--focused);

  border: none;
  border-radius: 7px;
  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
}

.nav-btn {
  display: flex;
  border: none;
  border-radius: 7.5px;
  padding: 6px;
  margin-left: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.2s;
  align-items: center;
  justify-content: center;
  /* Consistent base styling */
  height: 2.5em;
}

.nav-btn.short {
  height: auto;
}


/* Larger buttons for scroll-to-top and theme */
.nav-btn.large-btn {
  height: 3em;
  width: 3em;
}

.nav-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Consistent icon styling */
.btn-icon {
  height: 1.5em;
  width: auto;
}

.btn-icon.short {
  height: 1em;
}

.btn-icon.flipped {
  transform: scaleX(-1);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: opacity 0.3s ease;
}

/* Enhanced tooltip for touch devices */
.tooltip.touch-tooltip {
  font-size: 16px;
  padding: 10px 14px;
  border-width: 3px;
}
</style>
