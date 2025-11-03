<template>
  <div class="convertLoading"
    style="background: rgba(0, 0, 0, 0.3); width: 100vw; height: 100vh; position: absolute; z-index: 9999"
    v-if="isConvert || isUpload">
    <div class="loading-overlay">
      <div class="loader"></div>
    </div>
    <div style="position: relative; font-size: 50px; color: #f3f3f3; top: calc(50% - -75px); text-align: center">
      <span v-if="isConvert">변환중</span>
      <span v-if="isUpload">파일 업로드중</span>
    </div>
  </div>
</template>


<script setup>
import { storeToRefs } from "pinia";
import { usePdfStore } from "../stores/usePdfStore";

const pdfStore = usePdfStore();
const { isConvert, isUpload } = storeToRefs(pdfStore);
</script>

<style scoped>
.convertLoading {
  background: rgba(0, 0, 0, 0.3);
  width: 100vw;
  height: 100vh;
  position: absolute;
  z-index: 9999;
}
</style>