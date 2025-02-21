<script setup lang="ts"></script>

<template>
  <div class="svg-background"></div>
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

.svg-background {
  z-index: -1;
  width: 100vw;
  height: 100vh;

  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 150 150' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xml:space='preserve' xmlns:serif='http://www.serif.com/' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;' path d='M50,0L0,50L0,100L100,0L50,0Z' style='fill:currentColor;stroke:white;stroke-width:0px;' g transform='matrix(1,0,0,1,44.007,50)' path d='M105.993,0L5.993,100L55.993,100L105.993,50L105.993,0Z' style='fill:currentColor;stroke:white;stroke-width:0px;");
}
</style>


   
