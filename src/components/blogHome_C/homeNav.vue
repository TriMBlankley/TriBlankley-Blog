<script setup lang="ts">
import nextPostInGroup from "@/assets/uiElements/NextPostInGroup.svg";
import nextPostInTopic from "@/assets/uiElements/NextPostInTopic.svg";
import Arrow from "@/assets/uiElements/upDownArrow.svg";

import ThemeToggle from '@/components/Settings_C/ThemeToggle.vue';
import { ref } from 'vue';

defineProps<{

}>()

const emit = defineEmits<{
  'scroll-to-top': []
}>()

// Reactive state for hover tracking
const isHoveringTopic = ref(false);
const isHoveringGroup = ref(false);
</script>

<template>
  <div class="home-nav">
    <button class="nav-btn" @click="emit('scroll-to-top')" style="height: 3em;">
        <Arrow style="height: 100%;"/>
    </button>

    <button class="nav-btn" style="height: 3em; width: 3em;">
      <ThemeToggle />
    </button>

    <div class="grow"></div>


  </div>
</template>

<style>
.home-nav {
  /* Size ------------- */
  height: 55px;

  /* Position ------------- */
  padding: 4px;
  margin-top: 3px;

  /* Color ------------- */
  background-color: var(--focused);

  border: none;
  border-radius: 7px;
  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  align-items: center;
}

.nav-btn {
  height: 1.75em;
  display: flex;
  border: none;
  border-radius: 7.5px;
  padding: 2.5px;
  margin-left: 2.5px;
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.2s;
  align-items: center;
}

.nav-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vertical-arrow {
  height: 100%;
  /* Make SVG fill the accent container height */
  width: auto;
}
.horozontal-arrow:deep(svg) {
  height: 100%;
  /* Make SVG fill the accent container height */
  width: auto;
  /* Maintain aspect ratio */
}

.horozontal-arrow.flipped:deep(svg) {
  transform: scaleX(-1);

}

.column {
  width: 350px;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;

}
.row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
}

.grow {
  display: flex;
  flex-grow: 2;
}

/* Ensure h3 elements don't take space when hidden */
h3 {
  margin: 0;
  white-space: nowrap;
  transition: opacity 0.2s;
}
</style>
