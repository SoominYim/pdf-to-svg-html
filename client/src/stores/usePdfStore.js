import { defineStore } from "pinia";
import { ref } from "vue";

export const usePdfStore = defineStore("pdf", () => {
  // ========== 선택 타입 ==========
  const selectionType = ref("range");

  // ========== 스케일 관련 ==========
  const scale = ref(1.4);
  const displayScale = ref(1.4);

  // ========== UI 상태 ==========
  const open = ref(false);
  const isConvert = ref(false);
  const isUpload = ref(false);

  const setSelectionType = type => {
    selectionType.value = type;
  };

  return {
    // State
    selectionType,
    scale,
    displayScale,
    open,
    isConvert,
    isUpload,
    // Actions
    setSelectionType,
  };
});
