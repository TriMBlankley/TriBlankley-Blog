<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import Layer1 from "@/assets/uiElements/FolderDrop-Down/Layer1.svg";
import Layer2 from "@/assets/uiElements/FolderDrop-Down/Layer2.svg";
import Layer3 from "@/assets/uiElements/FolderDrop-Down/Layer3.svg";
import Layer4 from "@/assets/uiElements/FolderDrop-Down/Layer4.svg";
import Layer5 from "@/assets/uiElements/FolderDrop-Down/Layer5.svg";
import Layer6 from "@/assets/uiElements/FolderDrop-Down/Layer6.svg";
import Layer7 from "@/assets/uiElements/FolderDrop-Down/Layer7.svg";
import Layer8 from "@/assets/uiElements/FolderDrop-Down/Layer8.svg";
import Layer9 from "@/assets/uiElements/FolderDrop-Down/Layer9.svg";


</script>

<template>
  <button class="button-container">
    <Layer1 class="layer1" />
    <Layer2 class="layer2" />
    <Layer3 class="layer3" />
    <Layer4 class="layer4" />
    <Layer5 class="layer5" />
    <Layer6 class="layer6" />
    <Layer7 class="layer7" />
    <Layer8 class="layer8" />
    <Layer9 class="layer9" />
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
  z-index: 101;
  background: none;
  color: color-mix(in oklab, var(--cd-lilac), var(--background) 33%);
}

.layer2 {
  position: absolute;
  z-index: 102;
  background: none;
  color: var(--cd-lilac);
}

.layer3 {
  position: absolute;
  z-index: 103;
  background: none;
  color: color-mix(in oklab, var(--cd-salmon), var(--background) 33%);
}

.layer4 {
  position: absolute;
  z-index: 104;
  background: none;
  color: var(--cd-salmon);
}

.layer5 {
  position: absolute;
  z-index: 105;
  background: none;
  color: color-mix(in oklab, var(--cd-orange), var(--background) 33%);
}

.layer6 {
  position: absolute;
  z-index: 106;
  background: none;
  color: var(--cd-orange);
}

.layer7 {
  position: absolute;
  z-index: 107;
  background: none;
  color: color-mix(in oklab, var(--cd-turqoise), var(--background) 33%);
}

.layer8 {
  position: absolute;
  z-index: 108;
  background: none;
  color: var(--cd-turqoise);
}

.layer9 {
  position: absolute;
  z-index: 109;
  background: none;
  color: var(--background) ;
}




































.background-offset {
  position: absolute;
  z-index: 101;
  background: none;
  color: color-mix(in oklab, var(--text), var(--background) 33%);
}
.ring-offset {
  position: absolute;
  z-index: 102;
  background: none;
  color: var(--cd-lilac);
}
.ring-runes {
  position: absolute;
  z-index: 103;
  background: none;
  color: var(--cd-lilac);
}
.chimera-fill {
  position: absolute;
  z-index: 104;
  background: none;
  color: var(--background)
}
.chimera-outline {
  position: absolute;

  z-index: 105;
  background: none;
  color: color-mix(in oklab, var(--background), var(--text) 20%);
}
.blue {
  position: absolute;
  z-index: 106;
  background: none;
  color: var(--cd-blue)
}
.yellow {
  position: absolute;
  z-index: 106;
  background: none;
  color: var(--cd-mustard)
}
.salmon {
  position: absolute;
  z-index: 106;
  background: none;
  color: var(--cd-salmon);
}
.orange {
  position: absolute;
  z-index: 106;
  background: none;
  color: var(--cd-orange);
}
.green
 {
  position: absolute;
  z-index: 106;
  background: none;
  color: var(--cd-turqoise);
}
.border {
  position: absolute;
  z-index: 107;
  background: none;
  color: var(--cd-lilac);
}

</style>
