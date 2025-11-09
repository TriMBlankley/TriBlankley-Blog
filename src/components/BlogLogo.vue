<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import logoBackground from "@/assets/Logo/BackgroundOffset.svg";
import ringOffset from "@/assets/Logo/RingOffset.svg"
import ringRunes from "@/assets/Logo/RingRunes.svg"
import chimeraFill from "@/assets/Logo/Text.svg"
import chimeraOutline from "@/assets/Logo/TextOffset.svg"
import blue from "@/assets/Logo/Blue.svg"
import yellow from "@/assets/Logo/Yellow.svg"
import salmon from "@/assets/Logo/Salmon.svg"
import orange from "@/assets/Logo/Orange.svg"
import green from "@/assets/Logo/Green.svg"
import border from "@/assets/Logo/LilacBorder.svg"

const router = useRouter()
const route = useRoute()

const goToHome = () => router.push('/')

</script>

<template>
  <button @click="goToHome" class="logo-container">
    <logoBackground class="background-offset" />
    <ringOffset class="ring-offset" />
    <ringRunes class="ring-runes" />
    <chimeraFill class="chimera-fill" />
    <chimeraOutline class="chimera-outline" />
    <blue class="blue" />
    <yellow class="yellow" />
    <salmon class="salmon" />
    <orange class="orange" />
    <green class="green" />
    <border class="border" />
  </button>
</template>

<style scoped>
.logo-container {
  position: relative;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.background-offset {
  position: absolute;
  z-index: 101;
  background: none;
  color: color-mix(in oklab, var(--text), var(--background) 15%);
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
