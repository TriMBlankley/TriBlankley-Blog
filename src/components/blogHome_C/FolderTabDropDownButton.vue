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

</script>


<template>
  <button class="button-div" @click="handleClick"
    aria-label="Show folders" alt="Show folders">
    <div class="svg">
      <ClassPopOutButton class="svg" />
    </div>
  </button>
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
</style>
