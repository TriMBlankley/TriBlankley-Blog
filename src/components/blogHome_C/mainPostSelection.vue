<script setup lang="ts">
import FolderTab from './folderTab.vue';
import PostDescriptor from './postDescriptor.vue';

</script>

<template>
  <div class="mainPostSelection">
    <div class="folderTabPost">
      <FolderTab />
    </div>

    <!-- The following 3 divs are to make the post look correct-->
    <div class="PostListContainer">

      <PostDescriptor />

    </div> 
  </div>
</template>

<style scoped>
.mainPostSelection{
    /* Size ------------- */
    height: 100;
    width: 100;
  
    /* Position ------------- */
    position: relative;

    /* Behaviour ------------- */
    display: flex;
    flex-direction: column;
}

.folderTabPost {
    /* Size ------------- */
    width: 100%;
  
    /* Position ------------- */
  
    /* Color ------------- */
    /* Behaviour ------------- */
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;

}

.PostListContainer{
  /* Backround and Color------------- */
  background: color-mix(in oklab, var(--background), var(--cd-turqoise) 20%);
  border: 7px solid var(--cd-turqoise);

  /* Size ------------- */
  height: 91%;
  width: 100%;
  border-radius: 15px;
  
  /* Position ------------- */
}
</style>





