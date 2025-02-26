<script setup lang="ts">
import folderTabAccent from "@/assets/uiElements/folderTab.svg";

let tabTitle: string = "Physical Hobbies";
</script>

<template>

  <div class="folderTab" style="margin-left: 15px;">
    <div class="folderTabAcent">
      <folderTabAccent style="height: 100%;"/>
    </div>

    <h1 style="color: var(--text); background-color: var(--cd-turqoise);">
      Physical Hobbies
      <!-- {{ tabTitle }} -->
    </h1>

    <div style="-webkit-transform: scaleX(-1); transform: scaleX(-1);">
      <folderTabAccent style="height: 100%;"/>
    </div>  <!-- For svg transform-->
  </div> <!-- folderTab -->
</template>

<style scoped>
.folderTab {
  /* Size ------------- */
  height: auto;
  width: auto;

  /* Position ------------- */


  /* Color -------------  */
  color: var(--cd-turqoise); /* CHANGE THIS ----------------------------*/

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: stretch;
}

folderTabAcent {
  height: 100%;
  color: var(--cd-turqoise);
  fill: var(--cd-turqoise)
}
</style>
