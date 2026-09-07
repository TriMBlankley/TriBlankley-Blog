<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

import WebsiteLogo from "@/assets/uiElements/blogLogo.svg"

const router = useRouter()

const goToHome = () => router.push('/')

</script>

<template>
  <button class="button-div" @click="goToHome"
    aria-label="Go to home" alt="Go to home">
    <div class="svg-container">
      <WebsiteLogo class="svg" />
    </div>
  </button>
</template>

<style scoped>
.button-div {
  /* background: var(--background); */
  border: none;
  /* border-radius: 100px; */
  /* padding: 2.5px, 2.5px; */
  /* padding-top: 4px; */
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  width: 4rem;
  height: auto;
}

.svg-container {
  width: 100%;
  height: 100%;
  /* color: var(--text); */
}
</style>
