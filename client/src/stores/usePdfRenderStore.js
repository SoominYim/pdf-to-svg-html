import { defineStore } from "pinia";
import { ref } from "vue";

export const usePdfRenderStore = defineStore("pdfRender", () => {
  const renderedPages = ref([]); // 현재 렌더링된 페이지들
  const isLoadingMore = ref(false); // 로딩 중 여부
  const loadedCount = ref(0); // 렌더링 완료된 페이지 수
  const lastChunkEnd = ref(0); // 한 번에 5페이지씩
  const renderCount = ref(0); // 마지막 청크의 끝 인덱스
  const text_layer = ref(true); // 청크 타임아웃 ID

  return {
    renderedPages,
    isLoadingMore,
    loadedCount,
    lastChunkEnd,
    renderCount,
    text_layer,
  };
});
