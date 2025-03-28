<script setup lang="ts">
import filePostSVG from "@/assets/uiElements/filePost.svg";
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateToPost = () => {
  router.push('/BlogPage'); // Adjust this route to match your actual route for BlogPage
};
</script>

<template>
  <div class="post" @click="navigateToPost" role="button" tabindex="0">
    <div class="postIcon">
      <filePostSVG style="height: 100%; margin: 5px;"/>
    </div>

    <div class="postDescriptor">
      <h1>Post Title</h1>
      <p style="overflow: hidden;">
        Lorem ipsum dolor sit amet. Quo minima porro et corrupti incidunt ad eligendi doloribus et odio perferendis et esse sint a velit esse qui adipisci nemo. Qui laudantium asperiores et nihil quae et impedit quod qui tenetur amet non dolor omnis aut quia nihil?
      </p>
    </div>
  </div>
</template>

<style scoped>
.post {
  /* Size ------------- */

  /* Position ------------- */
  margin: 5px;

  /* Color ------------- */
  background-color: color-mix(in oklab, var(--background), var(--focused) 80%);

  border: 5px solid;
  border-color: color-mix(in oklab, var(--background), var(--focused) 80%);
  border-radius: 5px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  cursor: pointer; /* Changes cursor to indicate clickable */
}


.postDescriptor {
  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;

  background-color: var(--background);
  border-radius: 5px;
  border: none;

  padding: 0px 7px 7px 7px;
}

.postIcon {
  margin-right: 5px;

}
</style>