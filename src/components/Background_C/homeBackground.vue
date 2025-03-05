<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";

import homeBackroundSVG from '@/assets/Backgrounds/homeBackround.svg'

// Check if the div is overflowing! this code was found from: https://stackoverflow.com/questions/143815/determine-if-an-html-elements-content-overflows
const divRef = ref<HTMLElement | null>(null);


function checkOverflow(el: HTMLElement): boolean {
  const { scrollWidth, clientWidth, scrollHeight, clientHeight } = el;
  return scrollWidth > clientWidth || scrollHeight > clientHeight;
}

// Fill div with clones ---------------------------------------
const cloneCount = ref(0);

const fillContainer = async () => {
  if (!divRef.value) return;
  cloneCount.value = 0; // Reset count

  let maxAttempts = 5000; // Safety limit
  while (maxAttempts-- > 0) {
    cloneCount.value++;
    await nextTick();

    if (divRef.value && checkOverflow(divRef.value)) {
      cloneCount.value--; // Remove last one
      break;
    }
  }
};

// Start filling on mount
onMounted(fillContainer);

</script>


<template>
  <div class="backround-control">
    <div class="tile-backround" ref="divRef">

      <component
        :is="homeBackroundSVG"
        v-for="n in cloneCount"
        :key="n"
        class="tile"/>

    </div>
  </div>
</template>


<style>
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

  /* Color ------------- */


  /* Behaviour ------------- */
  display: flex;
  justify-content: center;
  align-content: center;
  overflow: hidden;
}

.tile-backround {
  height: 100vh;
  width: 100vw;
  /* Change this to 100 when finished ---------- */

  /* Position ------------- */
  z-index: 1;
  margin: 0; padding: 0;

  /* Color ------------- */

  /* Behaviour ------------- */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  grid-auto-rows: 50px;
  gap: 0;
  justify-content: start;
  align-content: start;
}

.tile {
  width: 100%;
  height: 100%;

  z-index: 1;
  margin: 0; padding: 0;
  box-sizing: border-box;

  color: var(--text);
  opacity: 75%;
  /* This is where you change the opacity */
}

</style>
