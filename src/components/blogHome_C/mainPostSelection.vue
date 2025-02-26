<script setup lang="ts">
import FolderTab from './folderTab.vue';
import PostDescriptor from './postDescriptor.vue';

</script>

<template>
  <div class="mainPostSelection">
    <!-- This holds the stylized tabs of the posts that makes it look like an,
          old-shool file cabinet/ browser tab effect.-->
    <div class="folderTabPost">
      <FolderTab />
    </div>

    <!-- This div holds the cards of each individual post, including a title,
          photo or icon, and description-->
    <div class="PostListContainer">
      <PostDescriptor />
    </div>
  </div>
</template>

<style scoped>
.mainPostSelection{
    /* Size ------------- */

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
  border-radius: 15px;

  /* Size ------------- */
  height: 95%;

  /* Position ------------- */

  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
}
</style>





