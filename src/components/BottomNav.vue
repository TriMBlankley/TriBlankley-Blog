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

// ... rest of the existing script code remains the same ...
// Reactive state for hover tracking
const isHoveringTopic = ref(false);
const isHoveringGroup = ref(false);
const isHoveringScrollToTop = ref(false);
const isHoveringTheme = ref(false);
const currentTooltip = ref('');
const isTouchDevice = ref(false);
const activeTooltip = ref('');
const tooltipTimer = ref<number | null>(null);
const tooltipPosition = ref({ x: -1000, y: -1000 }); // Start off-screen

// New state for pull-up functionality
const isPulledUp = ref(false);
const touchStartTime = ref(0);
const touchCount = ref(0);

// New state for hint dismissal
const showHint = ref(true);

// Detect touch device and check cookies
onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check if user has dismissed the hint
  checkHintDismissal();

  // Add event listeners for pull-up functionality
  setupPullUpListeners();
});

onUnmounted(() => {
  if (tooltipTimer.value) {
    clearTimeout(tooltipTimer.value);
  }
  cleanupPullUpListeners();
});

// Cookie management functions
const checkHintDismissal = () => {
  const dismissed = getCookie('bottomNavHintDismissed');
  showHint.value = dismissed !== 'true';
};

const setHintDismissed = () => {
  // Set cookie to expire in 1 year
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  document.cookie = `bottomNavHintDismissed=true; expires=${date.toUTCString()}; path=/`;
  showHint.value = false;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const clearHintDismissal = () => {
  document.cookie = 'bottomNavHintDismissed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  showHint.value = true;
};

const setupPullUpListeners = () => {
  if (isTouchDevice.value) {
    // Mobile: two-finger tap
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
  } else {
    // Desktop: right click
    document.addEventListener('contextmenu', handleContextMenu);
  }

  // Add scroll listener to push down when scrolling
  document.addEventListener('scroll', handleScroll, { passive: true });
};

const cleanupPullUpListeners = () => {
  if (isTouchDevice.value) {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
  } else {
    document.removeEventListener('contextmenu', handleContextMenu);
  }

  document.removeEventListener('scroll', handleScroll);
};

// Mobile two-finger tap handlers
const handleTouchStart = (event: TouchEvent) => {
  // Don't trigger if touching a button or interactive element
  const target = event.target as HTMLElement;
  if (target.closest('button') || target.closest('a') || target.closest('.nav-btn') || target.closest('.hint-close-btn')) {
    return;
  }

  touchCount.value = event.touches.length;
  touchStartTime.value = Date.now();
};

const handleTouchEnd = (event: TouchEvent) => {
  // Check if this was a two-finger tap
  if (touchCount.value === 2 && event.touches.length === 0) {
    const touchDuration = Date.now() - touchStartTime.value;

    // Consider it a tap if it was quick (less than 500ms)
    if (touchDuration < 500) {
      togglePullUp();
    }
  }

  // Reset touch tracking
  touchCount.value = 0;
  touchStartTime.value = 0;
};

// Desktop right click handler
const handleContextMenu = (event: MouseEvent) => {
  // Don't trigger if right-clicking on interactive elements
  const target = event.target as HTMLElement;
  if (target.closest('button') || target.closest('a') || target.closest('.nav-btn') || target.closest('.hint-close-btn')) {
    return;
  }

  event.preventDefault();
  togglePullUp();
};

// Scroll handler to push down the nav
const handleScroll = () => {
  if (isPulledUp.value) {
    // Push down after a short delay when scrolling starts
    if (tooltipTimer.value) {
      clearTimeout(tooltipTimer.value);
    }
    tooltipTimer.value = window.setTimeout(() => {
      isPulledUp.value = false;
    }, 300);
  }
};

const togglePullUp = () => {
  isPulledUp.value = !isPulledUp.value;
};

const updateTooltipPosition = (event: MouseEvent | TouchEvent, tooltipType: string) => {
  // Disable tooltips on mobile
  if (isTouchDevice.value) return;

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
  // Disable tooltips on mobile
  if (isTouchDevice.value) return;

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
};

const hideTooltip = (tooltipType: string) => {
  // Disable tooltips on mobile
  if (isTouchDevice.value) return;

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
};

const handleTouchStartButton = (event: TouchEvent, tooltipType: string) => {
  // Disable tooltips on mobile - no action needed
};

const handleTouchEndButton = (tooltipType: string) => {
  // Disable tooltips on mobile - no action needed
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
  // Only show tooltips on desktop
  return !isTouchDevice.value && (
    (tooltipType === 'scroll-to-top' && isHoveringScrollToTop.value) ||
    (tooltipType === 'theme' && isHoveringTheme.value) ||
    ((tooltipType === 'previous-topic' || tooltipType === 'next-topic') && isHoveringTopic.value) ||
    ((tooltipType === 'previous-group' || tooltipType === 'next-group') && isHoveringGroup.value)
  );
};
</script>

<template>
  <div class="bottom-nav" >
    <!-- Scroll to Top Button - conditionally rendered -->
    <button v-if="showScrollToTop" class="nav-btn large-btn" @click="emit('scroll-to-top')"
      @mouseenter="(e) => showTooltip(e, 'scroll-to-top')" @mouseleave="() => hideTooltip('scroll-to-top')"
      @mousemove="(e) => updateTooltipPosition(e, 'scroll-to-top')"
      @touchstart="(e) => handleTouchStartButton(e, 'scroll-to-top')"
      @touchend="() => handleTouchEndButton('scroll-to-top')" aria-label="Scroll to top" alt="Scroll to top">
      <Arrow class="btn-icon rotate-90-left" />
    </button>

    <!-- Theme Toggle Button - conditionally rendered -->
    <div v-if="showThemeToggle" @mouseenter="(e) => showTooltip(e, 'theme')"
      @mouseleave="() => hideTooltip('theme')" @mousemove="(e) => updateTooltipPosition(e, 'theme')"
      @touchstart="(e) => handleTouchStartButton(e, 'theme')" @touchend="() => handleTouchEndButton('theme')"
      aria-label="Toggle theme" alt="Toggle theme">
      <ThemeToggle />
    </div>

    <div class="grow"></div>

    <!-- Navigation Buttons (Topic/Group) - conditionally rendered -->
    <div v-if="showNavigationButtons" class="column">
      <div class="row">
        <button class="nav-btn short" @click="emit('previous-topic')" :disabled="!hasPreviousTopic"
          @mouseenter="(e) => showTooltip(e, 'previous-topic')" @mouseleave="() => hideTooltip('previous-topic')"
          @mousemove="(e) => updateTooltipPosition(e, 'previous-topic')"
          @touchstart="(e) => handleTouchStartButton(e, 'previous-topic')"
          @touchend="() => handleTouchEndButton('previous-topic')" aria-label="Previous post in category"
          alt="Previous post in category">
          <nextPostInTopic class="btn-icon flipped short" />
        </button>
        <button class="nav-btn short" @click="emit('next-topic')" :disabled="!hasNextTopic"
          @mouseenter="(e) => showTooltip(e, 'next-topic')" @mouseleave="() => hideTooltip('next-topic')"
          @mousemove="(e) => updateTooltipPosition(e, 'next-topic')"
          @touchstart="(e) => handleTouchStartButton(e, 'next-topic')"
          @touchend="() => handleTouchEndButton('next-topic')" aria-label="Next post in category"
          alt="Next post in category">
          <nextPostInTopic class="btn-icon short" />
        </button>
      </div>

      <div class="row">
        <button class="nav-btn short" @click="emit('previous-group')" :disabled="!hasPreviousGroup"
          @mouseenter="(e) => showTooltip(e, 'previous-group')" @mouseleave="() => hideTooltip('previous-group')"
          @mousemove="(e) => updateTooltipPosition(e, 'previous-group')"
          @touchstart="(e) => handleTouchStartButton(e, 'previous-group')"
          @touchend="() => handleTouchEndButton('previous-group')" aria-label="Previous post in group"
          alt="Previous post in group">
          <nextPostInGroup class="btn-icon flipped short" />
        </button>
        <button class="nav-btn short" @click="emit('next-group')" :disabled="!hasNextGroup"
          @mouseenter="(e) => showTooltip(e, 'next-group')" @mouseleave="() => hideTooltip('next-group')"
          @mousemove="(e) => updateTooltipPosition(e, 'next-group')"
          @touchstart="(e) => handleTouchStartButton(e, 'next-group')"
          @touchend="() => handleTouchEndButton('next-group')" aria-label="Next post in group" alt="Next post in group">
          <nextPostInGroup class="btn-icon short" />
        </button>
      </div>
    </div>

    <!-- Single tooltip element that changes content - only render on desktop -->
    <div v-show="shouldShowTooltip(currentTooltip)" class="tooltip" :class="{ 'touch-tooltip': isTouchDevice }" :style="{
      left: `${tooltipPosition.x}px`,
      top: `${tooltipPosition.y}px`
    }">
      {{ getTooltipText(currentTooltip) }}
    </div>
  </div>

  <!-- Hint message with close button -->
  <!-- <div v-if="showHint && !isPulledUp" class="hint-message" :class="{ 'mobile-hint': isTouchDevice }">
    <span class="hint-text">
      {{ isTouchDevice ? 'Two-finger tap anywhere to pull up navigation' : 'Right-click anywhere to pull up navigation'
      }}
    </span>
    <button class="hint-close-btn" @click="setHintDismissed" aria-label="Dismiss hint">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M14.7,1.3c-0.4-0.4-1-0.4-1.4,0L8,6.6L2.7,1.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4L6.6,8l-5.3,5.3c-0.4,0.4-0.4,1,0,1.4 C1.5,14.9,1.7,15,2,15s0.5-0.1,0.7-0.3L8,9.4l5.3,5.3c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L9.4,8l5.3-5.3 C15.1,2.3,15.1,1.7,14.7,1.3z" />
      </svg>
    </button>
  </div> -->
</template>

<style>
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
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
