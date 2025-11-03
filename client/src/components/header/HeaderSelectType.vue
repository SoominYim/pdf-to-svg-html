<template>
  <div class="selectionType_wrap">
    <input type="radio" name="selectionType" id="choice" value="choice" v-model="selectionType" />
    <label for="choice">개별 선택</label>
    <input type="radio" name="selectionType" id="range" value="range" v-model="selectionType" />
    <label for="range">범위 선택</label>
  </div>
</template>


<script setup>
import { storeToRefs } from "pinia";
import { usePdfStore } from "../../stores/usePdfStore";

const pdfStore = usePdfStore();
const { selectionType } = storeToRefs(pdfStore);

</script>