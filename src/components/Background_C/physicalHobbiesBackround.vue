<script setup lang="ts"></script>

<template>
  <div class="physicalHobbiesBackround"></div>
</template>

<style>
.physicalHobbiesBackround {
  z-index: -1;
  width: calc(((sqrt(2) * 100vw) + (sqrt(2) * 100vh)) / 2);
  height: calc(((sqrt(2) * 100vw) + (sqrt(2) * 100vh)) / 2);
  transform: rotate(45deg);

  background-image: url('@/assets/Backgrounds/homeBackground.svg');

  position: absolute;
  left: -50vmin;
  top: -50vmax;

  overflow: clip;
}
</style>
