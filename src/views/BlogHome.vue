<script setup lang="ts">
import homeBackround from '@/components/Backround_C/homeBackround.vue';
import mainPostSelection from '@/components/blogHome_C/mainPostSelection.vue';
import SettingsCog from '@/components/Settings_C/settingsCog.vue';
</script>

<template>
  <div class="SettingsCog">
    <SettingsCog />
  </div>

  <div class="mainPostSelection">
    <mainPostSelection />
  </div>
</template>

<style scoped>
.mainPostSelection {
    /* Size ------------- */
    height: 90vh;
    width: 90vw;

    /* Position ------------- */
    position: absolute;
      top: 50%;
      left: 50%;
      margin-right: -50%;
      transform: translate(-50%, -50%);

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
}

.SettingsCog {
    /* Size ------------- */
    height: 30px;
    width: 30px;

    /* Position ------------- */
    position: absolute;
    top: 4vh;
    left: 90vw;
}

</style>
