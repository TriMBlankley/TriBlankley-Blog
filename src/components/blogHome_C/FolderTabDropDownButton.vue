<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import ClassPopOutButton from "@/assets/uiElements/classPopOutButton.svg"

  const emit = defineEmits(['click']);

  // Tooltip functionality - only for desktop
  const isHovering = ref(false);
  const isDesktop = ref(false);
  const tooltipPosition = ref({ x: -1000, y: -1000 });

  // Detect if it's desktop (not mobile/tablet)
  onMounted(() => {
    // Check if it's a desktop device (not touch primary)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    isDesktop.value = !hasTouch && !isMobile;
  });

  const handleClick = (event: Event) => {
    event.stopPropagation();
    emit('click', event);
  };

  const updateTooltipPosition = (event: MouseEvent) => {
    if (!isDesktop.value) return;

    const x = event.clientX;
    const y = event.clientY;

    // Calculate tooltip dimensions
    const tooltipWidth = 120;
    const tooltipHeight = 40;
    const offsetX = 10;
    const offsetY = -60;

    // Calculate proposed position
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

  const showTooltip = (event: MouseEvent) => {
    if (!isDesktop.value) return;

    updateTooltipPosition(event);
    isHovering.value = true;
  };

  const hideTooltip = () => {
    if (!isDesktop.value) return;

    isHovering.value = false;
  };

  const shouldShowTooltip = () => {
    return isDesktop.value && isHovering.value;
  };

  const getTooltipText = () => {
    return 'Show Folders';
  };
  </script>

  <template>
    <button class="button-div" @click="handleClick"
      @mouseenter="(e) => showTooltip(e)" @mouseleave="() => hideTooltip()"
      @mousemove="(e) => updateTooltipPosition(e)"
      aria-label="Show folders" alt="Show folders">
      <div class="svg">
        <ClassPopOutButton class="svg" />
      </div>
    </button>

    <!-- Tooltip element - only shows on desktop -->
    <div v-show="shouldShowTooltip()" class="tooltip" :style="{
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

  /* Tooltip styles - only for desktop */
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
    transition: opacity 0.3s ease;
  }
  </style>
