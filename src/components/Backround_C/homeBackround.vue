<script setup lang="ts"></script>

<template>
  <div class="homeBackground">
  </div>
</template>

<style>
.homeBackground {
  z-index: -1;
  width: 100vw;
  height: 100vh;

  position: absolute;
  left: 0;
  top: 0;

  background-image: url('@/assets/Backgrounds/homeBackground.svg');
  opacity: 0.03;

  background-size: 1%;
  background-repeat: repeat;
}
</style>
