<script setup lang="ts">
import testComponent from '../components/LearningComponents/testComponent.vue';
import apiTest from '../components/LearningComponents/apiTest.vue';
import queryTest from '../components/LearningComponents/queryTest.vue';
import physicalHobbiesBackround from '@/components/Backround_C/physicalHobbiesBackround.vue';
</script>

<template>
  <div v-cloak>
     <!-- <physicalHobbiesBackround />  -->
      
    <h1>Awawawa!</h1>
    <testComponent />
    <AxiosTest />
    <apiTest />
    <queryTest />
  </div>
</template>

<style scoped>
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
