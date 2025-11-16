<script setup lang="ts">

import { defineEmits } from 'vue';

import ClassPopOutButton from "@/assets/uiElements/ClassPopOutButton.svg"
import Layer1 from "@/assets/uiElements/FolderDrop-Down/Layer1.svg";
import Layer2 from "@/assets/uiElements/FolderDrop-Down/Layer2.svg";
import Layer3 from "@/assets/uiElements/FolderDrop-Down/Layer3.svg";
import Layer4 from "@/assets/uiElements/FolderDrop-Down/Layer4.svg";

const emit = defineEmits(['click']);

const handleClick = (event: Event) => {
  event.stopPropagation(); // Prevent event from bubbling to document
  emit('click', event);
};

</script>

<template>
  <button class="button-div" @click="handleClick">
    <div class="svg-container">
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
  /* right: 50%; */
}

.layer1 {
  position: absolute;
  z-index: 104;
  background: none;
  color: var(--text);
}

.layer2 {
  position: absolute;
  z-index: 103;
  background: none;
  color: var(--cd-turqoise);
}

.layer3 {
  position: absolute;
  z-index: 102;
  background: none;
  color: var(--cd-salmon);
}

.layer4 {
  position: absolute;
  z-index: 101;
  background: none;
  color: var(--cd-lilac);
}

</style>
