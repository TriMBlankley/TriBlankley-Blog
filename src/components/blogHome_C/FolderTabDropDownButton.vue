
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

import ClassPopOutButton from "@/assets/uiElements/ClassPopOutButton.svg"

const emit = defineEmits(['click']);

// Tooltip functionality
const isHovering = ref(false);
const isTouchDevice = ref(false);
const activeTooltip = ref('');
const tooltipTimer = ref<number | null>(null);
const tooltipPosition = ref({ x: -1000, y: -1000 });

// Detect touch device
onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
});

onUnmounted(() => {
  if (tooltipTimer.value) {
    clearTimeout(tooltipTimer.value);
  }
});

const handleClick = (event: Event) => {
  event.stopPropagation(); // Prevent event from bubbling to document
  emit('click', event);
};

const updateTooltipPosition = (event: MouseEvent | TouchEvent) => {
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

  const x = clientX;
  const y = clientY;

  // Calculate tooltip dimensions (approximate)
  const tooltipWidth = 120;
  const tooltipHeight = 40;
  const offsetX = 10;
  const offsetY = -60;

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
};

const showTooltip = (event: MouseEvent | TouchEvent) => {
  if (isTouchDevice.value) {
    // On touch devices, show tooltip immediately and keep it visible
    activeTooltip.value = 'folders';
    updateTooltipPosition(event);

    // Clear any existing timer
    if (tooltipTimer.value) {
      clearTimeout(tooltipTimer.value);
    }
  } else {
    // On desktop, use hover behavior
    updateTooltipPosition(event);
    isHovering.value = true;
  }
};

const hideTooltip = () => {
  if (isTouchDevice.value) {
    // On touch devices, hide after a delay
    tooltipTimer.value = window.setTimeout(() => {
      if (activeTooltip.value === 'folders') {
        activeTooltip.value = '';
      }
    }, 1500);
  } else {
    // On desktop, hide immediately
    isHovering.value = false;
  }
};

const handleTouchStart = (event: TouchEvent) => {
  showTooltip(event);
};

const handleTouchEnd = () => {
  hideTooltip();
};

const shouldShowTooltip = () => {
  if (isTouchDevice.value) {
    return activeTooltip.value === 'folders';
  } else {
    return isHovering.value;
  }
};

const getTooltipText = () => {
  return 'Show Folders';
};
</script>

<template>
  <button class="button-div" @click="handleClick"
    @mouseenter="(e) => showTooltip(e)" @mouseleave="() => hideTooltip()"
    @mousemove="(e) => updateTooltipPosition(e)"
    @touchstart="(e) => handleTouchStart(e)" @touchend="() => handleTouchEnd()"
    aria-label="Show folders" alt="Show folders">
    <div class="svg-container">
      <ClassPopOutButton class="svg" />
    </div>
  </button>

  <!-- Tooltip element -->
  <div v-show="shouldShowTooltip()" class="tooltip" :class="{ 'touch-tooltip': isTouchDevice }" :style="{
    left: `${tooltipPosition.x}px`,
    top: `${tooltipPosition.y}px`
  }">
    {{ getTooltipText() }}
  </div>
</template>

<style scoped>
.button-div {
  background: var(--background);
  border: 3px solid color-mix(in oklab, var(--background), var(--text) 20%);
  border-radius: 10px;
  padding: 2.5px, 2.5px;
  padding-top: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: auto;
}

.svg-container {
  width: 100%;
  height: 100%;
  color: var(--text);
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
[file content end]
