<script setup lang="ts">
import FolderTab from './folderTab.vue';
import PostDescriptor from './postDescriptor.vue';

</script>

<template>
  <div class="mainPostSelection">
    <div class="folderTabPost">\
      <FolderTab />
    </div>

    <!-- The following 3 divs are to make the post look correct-->
    <div class="PostListContainer removeBakcroundTile"></div>
    <div class="PostListContainer backOpacity"></div>
    <div class="PostListContainer outline">

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
    height: 9vh;
    width: 100vw;
  
    /* Position ------------- */
    position: relative;
    top: auto;
    left: auto;
  
    /* Color ------------- */
    /* Behaviour ------------- */
    display: flex;
    flex-direction: row;

}

.PostListContainer{
  /* Size ------------- */
    height: 91%;
    width: 100%;
    border-radius: 15px;
  
    /* Position ------------- */
    position: absolute;
    top: 9%;
    left: 0;
}

.removeBakcroundTile {
  /* Color ------------- */
  background-color: var(--background);

  /* Behaviour ------------- */
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.backOpacity {

  /* Color ------------- */
  background-color: var(--cd-turqoise); /* CHANGE THESE -------------------------------------------- */   

  -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";       /* IE 8 */
  filter: alpha(opacity=50);  /* IE 5-7 */
  -moz-opacity: 0.5;          /* Netscape */
  -khtml-opacity: 0.5;        /* Safari 1.x */
  opacity: 0.20; 

  /* Behaviour ------------- */
  z-index: 2;
  overflow: hidden;
}

.outline {

  /* Color ------------- */
  border: 7px solid var(--cd-turqoise);    /* CHANGE THESE -------------------------------------------- */   
  background-color: none;

  /* Behaviour ------------- */
  z-index: 3;
}
</style>





