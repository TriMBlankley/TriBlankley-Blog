<script>
export default {
  data() {
    return {
      tabColor: "--cd-turqoise"
    }
  },
  // ... other component options
}

</script>

<template>
  <div class="folderTab">

    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%"
      height="100%" viewBox="0 0 18 37" version="1.1" xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"
      style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
      <g id="folderTab">
        <path
          d="M5.4,29.04l3.6,-21.6c0.624,-3.861 1.33,-4.679 1.8,-5.28c1.021,-1.306 2.808,-1.958 7.2,-1.92l-0,36l-18,0c3.087,-0.011 3.788,-1.299 4.23,-2.04c0.508,-0.852 0.599,-1.66 1.17,-5.16Z"
          style="fill:currentColor;" />
      </g>
    </svg>
    <h1 style="color: var(--text); background-color: var(--cd-turqoise);">Folder Tab</h1>

    <div style="-webkit-transform: scaleX(-1); transform: scaleX(-1);">
      
      <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg
        width="100%" height="100%" viewBox="0 0 18 37" version="1.1" xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"
        style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
        <g id="folderTab">
          <path
            d="M5.4,29.04l3.6,-21.6c0.624,-3.861 1.33,-4.679 1.8,-5.28c1.021,-1.306 2.808,-1.958 7.2,-1.92l-0,36l-18,0c3.087,-0.011 3.788,-1.299 4.23,-2.04c0.508,-0.852 0.599,-1.66 1.17,-5.16Z"
            style="fill:currentColor;" />
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.folderTab {
  /* Size ------------- */
  height: 100%;
  width: auto;

  /* Position ------------- */
  position: absolute;
  bottom: 0;

  /* Color ------------- 
  background-color: var(v-bind(tabColor));
  color: var(v-bind(tabColor)); */
  color: var(--cd-turqoise);

  /* CHANGE THIS ----------------------------*/
  /* Behaviour ------------- */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  float: left;



  margin: 0%;
  gap: 0;
}
</style>
