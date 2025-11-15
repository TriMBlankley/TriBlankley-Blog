<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import Layer1 from "@/assets/uiElements/FolderDrop-Down/Layer1.svg";
import Layer2 from "@/assets/uiElements/FolderDrop-Down/Layer2.svg";
import Layer3 from "@/assets/uiElements/FolderDrop-Down/Layer3.svg";
import Layer4 from "@/assets/uiElements/FolderDrop-Down/Layer4.svg";


</script>

<template>
  <button class="button-container">
    <Layer2 class="layer2" />
    <Layer1 class="layer1" />

    <Layer3 class="layer3" />
    <Layer4 class="layer4" />
  </button>
</template>

<style scoped>
.button-container {
  position: relative;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
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
