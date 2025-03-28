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
  background-color: color-mix(in oklab, var(--background), var(--cd-turqoise) 20%);
  border: 5px solid var(--cd-turqoise);
  border-radius: 6px;

  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  cursor: pointer; /* Changes cursor to indicate clickable */
  transition: transform 0.2s, box-shadow 0.2s; /* Smooth transition for hover effect */
}


.postDescriptor {
  /* Behaviour ------------- */
  display: flex;
  flex-direction: column;
}

.postIcon {
  margin-right: 5px;
  border: 5px solid var(--cd-turqoise);
  border-radius: 6px;
}
</style>