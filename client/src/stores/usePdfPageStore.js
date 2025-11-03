import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const usePdfPageStore = defineStore("pdfPage", () => {
  const page = ref(1);
  const pages = ref(0);
  const startPage = ref(1);
  const lastPage = ref(1);
  const selectedPage = ref([]);

  const filteredPages = computed(() => {
    const pages = [];
    for (let page = startPage.value; page <= lastPage.value; page++) {
      pages.push(page);
    }
    return pages;
  });

  return {
    page,
    pages,
    startPage,
    lastPage,
    selectedPage,

    filteredPages,
  };
});
