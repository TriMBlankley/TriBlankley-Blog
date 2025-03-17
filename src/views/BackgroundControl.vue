<script setup lang="ts">
import BackroundTileTest from '@/components/Background_C/BackroundTileTest.vue';
// import PhysicalHobbiesBackground from '@/components/Background_C/physicalHobbiesBackground.vue';
// import HomeBackground from '../components/Background_C/homeBackground.vue';
</script>

<template>
    <div class="backround-control">
      <BackroundTileTest />
      <!-- <HomeBackground /> -->
      <!-- <PhysicalHobbiesBackround />  -->
    </div>
</template>

<style scoped>
.backround-control {
  /* Size ------------- */
  height: 100vh;
  width: 100vw;
  /* Change this to 100 when finished ---------- */

  /* Position ------------- */
  position: absolute;
  top: 0;
  left: 0;

  z-index: 1;
  margin: 0; padding: 0;

  /* Behaviour ------------- */
  justify-content: center;
  align-content: center;
  overflow: hidden;
}
</style>
