<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import homeBackroundSVG from '@/assets/Backgrounds/homeBackroundLight.svg';

const width = ref<number>(0);
const height = ref<number>(0);

const tileNum = ref<number>(0);
const tileSize = 16; // Adjusted tile size for better division
const unit = ref<'px' | 'em'>('px');

const getScreenSize = (scale: 'px' | 'em' = 'px') => {
  const baseFontSize = 16;
  const w = window.innerWidth;
  const h = window.innerHeight;

  return scale === 'em'
    ? { width: w / baseFontSize, height: h / baseFontSize }
    : { width: w, height: h };
};

const updateSize = () => {
  const size = getScreenSize(unit.value);
  width.value = Math.ceil(size.width / tileSize) * tileSize; // Round to nearest tile size
  height.value = Math.ceil(size.height / tileSize) * tileSize;
};

const tileCount = () => {
  const cols = Math.ceil(width.value / tileSize);
  const rows = Math.ceil(height.value / tileSize);
  tileNum.value = cols * rows;
};

onMounted(() => {
  updateSize();
  tileCount();
  window.addEventListener('resize', updateSize);
  window.addEventListener('resize', tileCount);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateSize);
  window.removeEventListener('resize', tileCount);
});
</script>

<template>

  <div class="tiles-container">
    <component :is="homeBackroundSVG"
               v-for="n in tileNum"
               :key="n"
               class="tile" />
  </div>

</template>

<style scoped>
.tiles-container {
  width: v-bind(width);
  height: v-bind(height);

  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16px, 1fr));
  grid-template-rows: repeat(auto-fill, minmax(16px, 1fr));
  gap: 0;
  opacity: 20%;
}

.tile {
  height: 16px;
  width: 16px;
  transform: translateZ(0);
  /* Force pixel-perfect rendering */
  will-change: transform;
  /* Optimize rendering */
}
</style>