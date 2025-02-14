<script setup lang="ts">
const message = 'Login Form 2';
</script>

<template>
  <div class="test">
    <h1>
      {{ message }}
    </h1>
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {
  .test {
    min-height: 5vh;
    display: flex;
    align-items: center;
    color: blueviolet;
  }
}
</style>
