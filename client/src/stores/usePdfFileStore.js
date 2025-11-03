import { defineStore } from "pinia";
import { ref } from "vue";

export const usePdfFileStore = defineStore("pdfFile", () => {
  const file = ref(null);
  const fileName = ref("");
  const isFile = ref(false);

  return {
    file,
    fileName,
    isFile,
  };
});
