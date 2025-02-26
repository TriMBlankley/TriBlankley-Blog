<script setup lang="ts">
import homeBackroundSVG from '@/assets/Backgrounds/homeBackround.svg'
</script>

<template>
  <div class="svgBackground"></div>
</template>

<style>
.homeBackground {
  z-index: -1;
  width: 100vw;
  height: 100vh;

  position: absolute;
  left: 0;
  top: 0;

  background-image: url('@/assets/Backgrounds/homeBackround.svg');
  opacity: 1;

  background-size: 1%;
  background-repeat: repeat;
}

.svgBackground {
  z-index: -1;
  width: 100vw;
  height: 100vh;

  position: absolute;
  left: 0;
  top: 0;

  background-image: url("data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3csvg%20width='100%25'%20height='100%25'%20viewBox='0%200%2036%2036'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20xmlns:serif='http://www.serif.com/'%20style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3e%3cg%20id='homeBackround'%3e%3cpath%20d='M36,12l-24,24l12,0l12,-12l-0,-12Z'%20style='fill:%233d4142;'%20/%3e%3cpath%20d='M12,0l-12,12l0,12l24,-24l-12,0Z'%20style='fill:%233d4142;'%20/%3e%3c/g%3e%3c/svg%3e");
  opacity: 0.03;

  background-size: 1%;
  background-repeat: repeat;
}
</style>
