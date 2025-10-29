/* import { storeToRefs } from "pinia";

import { usePdfStore } from "@/stores/usePdfStore";

export const usePdfScale = (debouncedStartChunkRendering, chunkTimeoutIdRef) => {
  const store = usePdfStore();
  const {
    // State
    displayScale,
    scale,
    selectionType,
    renderedPages,
    loadedCount,
    isLoadingMore,
  } = storeToRefs(store);

  let scaleDebounceTimer = null;

  const setScale = newScale => {
    const newValue = Math.max(0.5, Math.min(2, newScale));
    displayScale.value = newValue;

    clearTimeout(scaleDebounceTimer);
    scaleDebounceTimer = setTimeout(() => {
      scale.value = newValue;

      // 청크 렌더링 완전 초기화
      if (chunkTimeoutIdRef) {
        clearTimeout(chunkTimeoutIdRef);
        chunkTimeoutIdRef = null;
      }

      if (selectionType.value === "range" && renderedPages.value.length > 0) {
        loadedCount.value = 0;
        isLoadingMore.value = true;
        if (debouncedStartChunkRendering) {
          debouncedStartChunkRendering();
        }
      }
    }, 800);
  };


  return {
    setScale,
    incrementScale,
    decrementScale,
    resetScale,
  };
};
 */
