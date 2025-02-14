<script setup lang="ts">
import testComponent from '../components/testComponent.vue';
import apiTest from '../components/apiTest.vue';
import queryTest from '../components/queryTest.vue';
import physicalHobbiesBackround from '@/components/physicalHobbiesBackround.vue';
</script>

<template>
  <div v-cloak>
    <h1>Awawawa!</h1>
    <testComponent />
    <AxiosTest />
    <apiTest />
    <queryTest />
  </div>
</template>

<style>
.box {
  background-color: blueviolet;
}

[v-cloak] {
  display: none;
}
input {
  margin: 10px;
  display: block;
}
</style>
