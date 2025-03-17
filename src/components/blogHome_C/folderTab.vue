<script setup lang="ts">
// VueJS imports
import { ref } from 'vue';

// Component Imports

//SVG imports
import folderTabAccent from "@/assets/uiElements/folderTab.svg";

// Logic ---------------------------------------------------

// Post Data ----------
const tabTitle = "Horny Hobbies";
const tabColor = tabColorPicker('lilac');

// This binds the color of the tab to the result it gets from the databse
// const tabFormatting = ref('folder-tab');

// const tabColor = tabFormatting;

// const tabColorPicker = (colorIn: string) => {
//     tabColor.value = tabFormatting.value +" " + colorIn + "-tab";
// };

function tabColorPicker(colorIn: string): string {
  return "color: var(--cd-" + colorIn + ");";
};


</script>

<template>

  <!-- <div v-bind:class="tabColor"> -->
  <div class="folder-tab" v-bind:style="tabColor">
                  <!-- top, right, bottom, left -->
    <div style="margin: 0 -1px -1.5px 0;">
      <folderTabAccent style="height: 100%;"/>
    </div>

    <h1 style="background-color: currentColor;">
      <div class="tab-text">
      {{ tabTitle }}
    </div>
    </h1>

    <div style="-webkit-transform: scaleX(-1); transform: scaleX(-1); margin: 0 0 -1.5px -1px;">
      <folderTabAccent style="height: 100%;"/>
    </div>  <!-- For svg transform-->
  </div> <!-- folderTab -->
</template>

<style scoped>
.folder-tab {
  /* Size ------------- */
  height: auto;
  width: auto;

  /* Position ------------- */

  /* Color -------------  */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  white-space: nowrap;


}

.tab-text {
  color: var(--text);
}
</style>
