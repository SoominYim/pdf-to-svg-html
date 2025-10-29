import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const usePdfStore = defineStore("pdf", () => {
  // ========== 파일 관련 ==========
  const file = ref(null);
  const fileName = ref("");
  const isFile = ref(false);
  const isUpload = ref(false);

  // ========== 페이지 관련 ==========
  const page = ref(1);
  const pages = ref(0);
  const startPage = ref(1);
  const lastPage = ref(1);
  const selectedPage = ref([]);

  // ========== 선택 타입 ==========
  const selectionType = ref("range");

  // ========== 스케일 관련 ==========
  const scale = ref(1.4);
  const displayScale = ref(1.4);

  // ========== 렌더링 관련 ==========
  const renderedPages = ref([]); // 현재 렌더링된 페이지들
  const isLoadingMore = ref(false); // 로딩 중 여부
  const loadedCount = ref(0); // 렌더링 완료된 페이지 수
  const lastChunkEnd = ref(0); // 한 번에 5페이지씩
  const renderCount = ref(0); // 마지막 청크의 끝 인덱스
  const text_layer = ref(true); // 청크 타임아웃 ID

  // ========== UI 상태 ==========
  const open = ref(false);
  const isConvert = ref(false);

  // ========== Computed ==========

  const filteredPages = computed(() => {
    const pages = [];
    for (let page = startPage.value; page <= lastPage.value; page++) {
      pages.push(page);
    }
    return pages;
  });

  // ========== Actions ==========

  return {
    // State
    file,
    fileName,
    isFile,
    isUpload,
    page,
    pages,
    startPage,
    lastPage,
    selectedPage,
    selectionType,
    scale,
    displayScale,
    renderedPages,
    isLoadingMore,
    loadedCount,
    lastChunkEnd,
    renderCount,
    text_layer,
    open,
    isConvert,

    // Computed
    filteredPages,
    // Actions
  };
});
