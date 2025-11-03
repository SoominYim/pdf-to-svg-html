<template>
  <PdfLoading />
  <div class="pdfContainer" style="text-align: center">
    <div class="header">
      <HeaderSelectType v-if="!isFile" />
      <ul class="tool-bar" style="display: flex; justify-content: center; list-style-type: none; gap: 10px">
        <li v-if="isFile">
          <span>{{ fileName }}.pdf</span>
          <button style="border: 1px solid;" @click="deleteFile">x</button>
        </li>

        <li v-if="!isFile" style="margin-right: 5px" class="file_wrap">
          <label for="file">파일 첨부</label>
          <input id="file" name="myFile" type="file" accept=".pdf" @change="changeFile" ref="fileInput" />
        </li>
        <li v-if="isFile && selectionType == 'choice'" class="page_wrap">
          <button @click="page = page > 1 ? page - 1 : page">&lt;</button>
          <input type="text" :value="page" @keydown.enter="changePage" @focusout="resetPage" @input="numInput"
            style="width: 50px; text-align: right" />
          /
          {{ pages }}
          <button @click="page = page < pages ? page + 1 : page">&gt;</button>
        </li>
        <li v-if="isFile && selectionType == 'range'" class="rangePage_wrap">
          <span style="margin-right: 5px">total : {{ pages }}</span>
          <input type="text" id="startPage" :value="startPage" @keydown.enter="updateStartPages"
            @focusout="resetStartPage" @input="numInput" />
          /
          <input type="text" id="lastPage" :value="lastPage" @keydown.enter="updateLastPages" @focusout="resetLastPage"
            @input="numInput" />
        </li>
        <li v-if="isFile" class="scale_wrap">
          <button @click="decrementScale(0.1)">-</button>
          <input type="text" id="scale" :value="Math.round(displayScale * 100)" @keydown.enter="updateScale"
            @focusout="resetScale" @input="numInput" />%
          <button @click="incrementScale(0.1)">+</button>
        </li>
        <li v-if="isFile && selectionType == 'choice'" class="choice_wrap">
          <div class="select_wrap">
            <div class="select" :class="{ open: open }" @click="open = !open">
              {{ selectedPage.length > 0 ? page : "선택 없음" }}
            </div>
            <div class="items" v-if="open">
              <div v-if="selectedPage.length < 1">선택 없음</div>
              <div class="item" v-for="(p, i) in selectedPage" :key="i" @click="page = p.page">
                <div>
                  {{ p.page }}
                </div>
                <button @click="deletePage(i)">X</button>
              </div>
            </div>
          </div>
          <button @click="selectChoicePage">선택</button>
        </li>

        <li v-if="isFile && selectionType == 'choice'" class="export_wrap">
          <button @click="exportChoiceHTML">내보내기</button>
        </li>
        <li v-if="isFile && selectionType == 'range'" class="export_wrap">
          <button @click="exportRangeHTML">내보내기</button>
        </li>
        <li v-if="isFile && selectionType == 'range'">
          <span style="color: red"> * 렌더링이 완료되면 눌러주세요 </span>
        </li>
      </ul>
    </div>

    <!-- 렌더링 진행 바 (헤더 하단) -->
    <div v-if="isFile && selectionType == 'range' && isLoadingMore" class="top-progress-bar">
      <div class="top-progress-fill" :style="{ width: (loadedCount / filteredPages.length) * 100 + '%' }"></div>
      <span class="top-progress-text">{{ Math.round((loadedCount / filteredPages.length) * 100) }}%</span>
    </div>

    <div v-if="selectionType == 'range'" class="content" ref="content" :style="{
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }">
      <!-- 청크 단위로 렌더링된 페이지만 표시 -->
      <div class="pdf_wrap" v-for="page in renderedPages" :key="page">
        <VuePDF @loaded="(v) => onPageLoaded(v, page)" :scale="scale" :pdf="pdf" :page="page" :text-layer="text_layer"
          ref="pdfRef">
        </VuePDF>
      </div>


    </div>
    <div v-if="selectionType == 'choice'" class="content" ref="content" :style="{}">
      <div class="pdf_wrap">

        <VuePDF @loaded="onLoaded" :scale="scale" :pdf="pdf" :page="page" :text-layer="text_layer" ref="pdfRef">
          <!-- <div class="loading-odiv>
          </div> -->
        </VuePDF>
      </div>
    </div>
  </div>
</template>

<script setup>
// 컴포넌트 테스트
import HeaderSelectType from "./components/header/HeaderSelectType.vue";


import { watch, ref } from "vue";
import { VuePDF, usePDF } from "@tato30/vue-pdf";
import JSZip from "jszip";
import cssContent from "./style/style";


import PdfLoading from "./components/pdfLoading.vue";

import { storeToRefs } from "pinia";
import { usePdfFileStore } from "./stores/usePdfFileStore";
import { usePdfPageStore } from "./stores/usePdfPageStore";
import { usePdfRenderStore } from "./stores/usePdfRenderStore";

import { usePdfStore } from "./stores/usePdfStore";



import { useInputUtils } from "./utils/inputUtils";
import { useDebounceUtils } from "./utils/debounceUtils";

const pdfFileStore = usePdfFileStore();
const pdfPageStore = usePdfPageStore();
const pdfRenderStore = usePdfRenderStore();

const store = usePdfStore();


const { file, fileName, isFile, } = storeToRefs(pdfFileStore);
const { page, startPage, lastPage, selectedPage, filteredPages, } = storeToRefs(pdfPageStore);
const { renderedPages, isLoadingMore, loadedCount, lastChunkEnd, renderCount, text_layer, } = storeToRefs(pdfRenderStore);

const {
  // State
  selectionType, scale, displayScale, open, isConvert, isUpload
  // Actions
} = storeToRefs(store);



const { numInput } = useInputUtils();
const { debounceFn } = useDebounceUtils();

const pdfRef = ref({});

window.addEventListener("beforeunload", (event) => {
  if (isFile.value) {
    event.preventDefault();
    return "";
  }
});
const CHUNK_SIZE = 5;

const { pdf, pages } = usePDF(file, {
  isEvalSupported: false,
});


let pageWidth = 0;
let pageHeight = 0;
let chunkTimeoutId = null;

// 스케일 디바운싱
let scaleDebounceTimer = null;
// 스케일 변경 감지 플래그
let isScaleChanging = false;

const setScale = (newScale) => {
  const newValue = Math.max(0.5, Math.min(2, newScale));
  displayScale.value = newValue;

  clearTimeout(scaleDebounceTimer);
  scaleDebounceTimer = setTimeout(() => {
    scale.value = newValue;

    // 청크 렌더링 완전 초기화
    if (chunkTimeoutId) {
      clearTimeout(chunkTimeoutId);
      chunkTimeoutId = null;
    }

    if (selectionType.value === 'range' && renderedPages.value.length > 0) {
      // 스케일 변경 시 전체 재렌더링 필요
      isScaleChanging = true;
      loadedCount.value = 0;
      renderedPages.value = []; // 모든 페이지 초기화
      lastChunkEnd.value = 0;
      isLoadingMore.value = true;
      debouncedStartChunkRendering(); // 디바운스된 함수 사용
    }
  }, 800);
}

const incrementScale = count => {
  setScale(displayScale.value + count);
};

const decrementScale = count => {
  setScale(displayScale.value - count);
};

const resetScale = e => {
  e.target.value = Math.round(displayScale.value * 100);
};



// common START


function changeFile(event) {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    file.value = URL.createObjectURL(selectedFile);
    fileName.value = selectedFile.name.split(".").slice(0, -1).join(".");
    isFile.value = true;
    isUpload.value = true;

    const formData = new FormData();
    formData.append("myFile", selectedFile);
    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to upload file");
        }
        console.log("File uploaded successfully");
        isUpload.value = false;
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
        isUpload.value = false;
      });
  }
}



// 전역 observer 변수
// let globalObserver = null;

// const removeBrTags = () => {
//   // 기존 observer가 있으면 정리
//   if (globalObserver) {
//     globalObserver.disconnect();
//     globalObserver = null;
//   }

//   // 새로운 observer 생성
//   globalObserver = new MutationObserver((mutationsList) => {
//     mutationsList.forEach((mutation) => {
//       if (mutation.addedNodes) {
//         mutation.addedNodes.forEach((node) => {
//           if (node.tagName === "BR") {
//             node.remove();
//           }
//         });
//       }
//     });
//   });

//   // PDF wrap 요소들에 observer 연결
//   const pdfWrapElements = document.querySelectorAll(".pdf_wrap");
//   pdfWrapElements.forEach((pdfWrapElement) => {
//     globalObserver.observe(pdfWrapElement, { childList: true, subtree: true });
//   });
// };


/**
 * @param {element} parentNode 최상위 부모노드
 * @param {string} a tag 삭제
 * @param {string} b class 삭제
 * @param {string} c style 삭제
 */

function removeEl(parentNode, a, b, c) {
  const elementsToRemove = parentNode.querySelectorAll(a);
  const elementsToRemoveClasses = parentNode.querySelectorAll(b);
  const elementsToRemoveStyle = parentNode.querySelectorAll(c);
  elementsToRemoveClasses.forEach((element) => {
    element.classList = "";
  });
  elementsToRemove.forEach((element) => element.parentNode.removeChild(element));
  elementsToRemoveStyle.forEach((element) => {
    element.removeAttribute("style");
  });

  var divElements = parentNode.querySelectorAll("div");

  // 각 div 요소에서 data-v-로 시작하는 속성 제거
  divElements.forEach(function (divElement) {
    Array.from(divElement.attributes).forEach(function (attribute) {
      if (attribute.name.startsWith("data-v-")) {
        divElement.removeAttribute(attribute.name);
      }
    });
  });
}

let wheelTimer; // 휠 이벤트 종료를 감지하기 위한 타이머 변수


function onLoaded(v) {
  // removeBrTags();
  text_layer.value = false;

  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => {
    text_layer.value = true;
  }, 500);
  pageWidth = v.width;
  pageHeight = v.height;

  renderCount.value++;
}

// common END

// 개별 선택 START

function changePage(e) {
  e.target.value > pages.value || e.target.value < 1 ? (e.target.value = page.value) : (page.value = +e.target.value);
}

function resetPage(e) {
  e.target.value = page.value;
}

function selectChoicePage() {
  const canvas = document.querySelector("canvas");
  const canvasDataURL = canvas.toDataURL();
  const isNewPageUnique = !selectedPage.value.some((item) => item.page === page.value);
  const contentHTML = document.querySelector("html").cloneNode(true);

  if (isNewPageUnique) {
    const clonedHTML = contentHTML.cloneNode(true); // 선택한 페이지의 HTML 복제
    selectedPage.value.push({
      html: clonedHTML,
      page: page.value,
      data: canvasDataURL,
    });
  }
  selectedPage.value.sort((a, b) => a.page - b.page);
}

function deletePage(i) {
  selectedPage.value.splice(i, 1);
}

async function exportChoiceHTML() {
  const zip = new JSZip(); // ZIP 객체 생성
  if (selectedPage.value.length < 1) selectChoicePage();

  const pageData = {
    type: "choice",
    page: selectedPage.value.map((v) => v.page),
    fileName: fileName.value,
  };
  isConvert.value = true;
  // /convert 요청 보내기
  await fetch("/convert", {
    method: "POST",
    body: JSON.stringify(pageData), // 페이지 정보 데이터를 JSON 문자열로 변환하여 body에 포함
    headers: {
      "Content-Type": "application/json",
    },
  });
  const svgResponse = await fetch("/getSVGFiles");
  const svgFiles = await svgResponse.json();


  for (const [i, svgFile] of svgFiles.entries()) {
    const svgBlob = new Blob([svgFile], { type: "image/svg+xml" });
    zip.folder("svg").file(`${fileName.value}_${String(selectedPage.value[i].page).padStart(3, "0")}.svg`, svgBlob);
  }

  isConvert.value = false;

  selectedPage.value.forEach((v) => {
    const _v = v.html;
    const a =
      "#header, .header, script, style, .v-overlay-container, .convertLoading, link:not([href='./css/common.css']) , noscript";
    const b = ".v-application";
    const c = ".v-main";

    removeEl(_v, a, b, c);

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "./css/common.css";
    _v.querySelector("head").appendChild(linkElement);
    _v.querySelector(".pdfContainer").style.textAlign = "left";
    // 페이지 제목 설정
    _v.querySelector("title").textContent = `${fileName.value}_${String(v.page).padStart(3, "0")}`;
    _v.querySelector("canvas").style.display = "none";

    const imageUrl = `./svg/${fileName.value}_${String(v.page).padStart(3, "0")}.svg`;
    // 스크립트 직접 추가
    const scriptContent = `
      let canvas = document.querySelector("canvas");
      const context = canvas.getContext("2d");
      const base_image = new Image();
      base_image.src = "${v.data}";


      const img = new Image();
      img.src = "${imageUrl}";
      img.onload = function () {
        img.style.width = 'calc(var(--scale-factor) * ${pageWidth / scale.value}px)';
        img.style.height = 'calc(var(--scale-factor) * ${pageHeight / scale.value}px)';
        const pdfWrap = document.querySelector(".pdf_wrap > div");
        pdfWrap.prepend(img);
      }
      `;

    const scriptFileName = `${fileName.value}_${String(v.page).padStart(3, "0")}.js`;
    zip.folder("js").file(scriptFileName, scriptContent);

    const scriptElement = document.createElement("script");
    scriptElement.src = `./js/${scriptFileName}`;
    _v.querySelector("body").appendChild(scriptElement);

    // Blob 생성 및 ZIP 파일에 추가
    const blob = new Blob([_v.innerHTML], { type: "text/html" });
    zip.file(`${fileName.value}_${String(v.page).padStart(3, "0")}.html`, blob);
  });

  zip.folder("css").file("common.css", cssContent);
  zip.generateAsync({ type: "blob" }).then((resZip) => {
    const url = URL.createObjectURL(resZip);
    const aTag = document.createElement("a");

    aTag.download = fileName.value;
    aTag.href = url;
    aTag.click();
  });
}
// 개별 선택 END

// 범위 선택 START

function updateScale(e) {

  setScale(e.target.value / 100);

  startChunkRendering();
}
function updateStartPages(e) {
  if (e.target.value > pages.value || e.target.value < 1 || e.target.value > lastPage.value) {
    e.target.value = startPage.value;
  } else {
    startPage.value = +e.target.value;
  }
}
function updateLastPages(e) {
  if (e.target.value > pages.value || e.target.value < 1 || e.target.value < startPage.value) {
    e.target.value = lastPage.value;
  } else {
    lastPage.value = +e.target.value;
  }
}
function resetStartPage(e) {
  e.target.value = startPage.value;
}
function resetLastPage(e) {
  e.target.value = lastPage.value;
}



// 청크 렌더링 초기화 함수 (최적화: 이미 렌더링된 페이지 유지)
function startChunkRendering() {
  // 기존 타임아웃 취소
  if (chunkTimeoutId) {
    clearTimeout(chunkTimeoutId);
    chunkTimeoutId = null;
  }

  // 스케일 변경 시에는 전체 재렌더링
  if (isScaleChanging) {
    isScaleChanging = false; // 플래그 리셋
    loadedCount.value = 0;
    lastChunkEnd.value = 0;
    renderedPages.value = [];
    isLoadingMore.value = true;
    loadNextChunk();
    return;
  }

  // 현재 필터링된 페이지 범위
  const currentPages = filteredPages.value;

  // 이미 렌더링된 페이지 중 범위에 포함된 것만 유지
  const existingPages = renderedPages.value.filter(page => currentPages.includes(page));

  // 범위에서 벗어난 페이지는 제거 (DOM에서도 제거되어야 하지만 Vue가 자동 처리)
  renderedPages.value = existingPages;

  // 새로 추가해야 할 페이지 계산
  const newPages = currentPages.filter(page => !renderedPages.value.includes(page));

  if (newPages.length === 0) {
    // 추가할 페이지가 없으면 완료
    isLoadingMore.value = false;
    // loadedCount는 실제 렌더링된 페이지 수로 유지 (기존 값 유지)
    loadedCount.value = renderedPages.value.length;
    return;
  }

  // 새 페이지가 있으면 렌더링 시작
  // loadedCount는 기존 렌더링된 페이지 수로 시작 (새 페이지만 카운트됨)
  loadedCount.value = renderedPages.value.length;
  lastChunkEnd.value = renderedPages.value.length;
  isLoadingMore.value = true;

  // 첫 번째 청크 로드
  loadNextChunk();
}



// 디바운스된 렌더링 함수
const debouncedStartChunkRendering = debounceFn(startChunkRendering, 300);

// 통합된 watch
watch([isFile, selectionType, filteredPages, pages], () => {
  if (isFile.value && selectionType.value === 'range' && filteredPages.value.length > 0 && pages.value > 0) {
    debouncedStartChunkRendering();
  }
});


// 다음 청크 로드 (5페이지씩)
function loadNextChunk() {
  // 기존 타임아웃 취소
  if (chunkTimeoutId) {
    clearTimeout(chunkTimeoutId);
    chunkTimeoutId = null;
  }

  // 현재 필터링된 페이지 범위
  const currentPages = filteredPages.value;

  // 아직 렌더링되지 않은 페이지 찾기
  const remainingPages = currentPages.filter(page => !renderedPages.value.includes(page));

  if (remainingPages.length === 0) {
    // 모든 페이지 렌더링 완료
    isLoadingMore.value = false;
    return;
  }

  // 남은 페이지 중 CHUNK_SIZE만큼 추가
  const chunkSize = Math.min(CHUNK_SIZE, remainingPages.length);
  for (let i = 0; i < chunkSize; i++) {
    renderedPages.value.push(remainingPages[i]);
  }

  // 정렬 유지 (페이지 순서대로)
  renderedPages.value.sort((a, b) => a - b);

  // 이 청크의 끝 위치 저장 (전체 filteredPages 기준)
  const lastAddedPage = remainingPages[chunkSize - 1];
  const lastAddedIndex = currentPages.indexOf(lastAddedPage);
  lastChunkEnd.value = lastAddedIndex + 1;


  // 폴백: 3초 내에 완료되지 않으면 강제로 다음 청크 (이벤트 누락 대비)
  chunkTimeoutId = setTimeout(() => {
    console.warn(`⚠️ 타임아웃! 3초 내 완료 안 됨. 강제로 다음 청크 로드 (loadedCount: ${loadedCount.value}/${filteredPages.value.length})`);
    if (loadedCount.value < filteredPages.value.length) {
      loadNextChunk(); // 다음 청크 로드 (진행 바 유지)
    } else {
      // 모든 청크 완료되었을 때만 진행 바 숨김
      isLoadingMore.value = false;
    }
  }, 3000);
}

// 페이지 렌더링 완료 시
function onPageLoaded(v,) {

  // removeBrTags();

  loadedCount.value++;
  pageWidth = v.width;
  pageHeight = v.height;


  // 모든 페이지 렌더링 완료 확인
  if (loadedCount.value >= filteredPages.value.length) {
    isLoadingMore.value = false;

    // 타임아웃 취소
    if (chunkTimeoutId) {
      clearTimeout(chunkTimeoutId);
      chunkTimeoutId = null;
    }
    return;
  }

  // 현재 청크의 모든 페이지가 완료되었는지 확인
  if (loadedCount.value >= lastChunkEnd.value) {

    // 타임아웃 취소
    if (chunkTimeoutId) {
      clearTimeout(chunkTimeoutId);
      chunkTimeoutId = null;
    }

    // 다음 청크 로드 (진행 바는 유지)
    if (loadedCount.value < filteredPages.value.length) {
      loadNextChunk();
    }
  }
}

async function exportRangeHTML() {
  const zip = new JSZip();
  const pageData = {
    type: "ranger",
    page: filteredPages.value.map((v) => v),
    fileName: fileName.value,
  };

  isConvert.value = true;
  // /convert 요청 보내기
  await fetch("/convert", {
    method: "POST",
    body: JSON.stringify(pageData), // 페이지 정보 데이터를 JSON 문자열로 변환하여 body에 포함
    headers: {
      "Content-Type": "application/json",
    },
  });
  const svgResponse = await fetch("/getSVGFiles");
  const svgFiles = await svgResponse.json();

  for (const [i, svgFile] of svgFiles.entries()) {
    const svgBlob = new Blob([svgFile], { type: "image/svg+xml" });
    // selectedPage 대신 filteredPages 사용
    zip.folder("svg").file(`${fileName.value}_${String(filteredPages.value[i]).padStart(3, "0")}.svg`, svgBlob);
  }

  isConvert.value = false;

  filteredPages.value.forEach((v, i) => {
    const contentHTML = document.querySelector("html").cloneNode(true);

    const a =
      "#header, .header, .tool-bar, script, style, .pdf_wrap, .convertLoading, .v-overlay-container, link:not([href='./css/common.css']) , noscript";
    const b = ".v-application";
    const c = ".v-main";

    removeEl(contentHTML, a, b, c);

    const _pdf = document.querySelectorAll(".pdf_wrap");
    const pdfWrap = _pdf[i].cloneNode(true);
    contentHTML.querySelector(".content").appendChild(pdfWrap);
    contentHTML.querySelector(".pdfContainer").style.textAlign = "left";

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "./css/common.css";
    contentHTML.querySelector("head").appendChild(linkElement);

    contentHTML.querySelector("title").textContent = `${fileName.value}_${String(v).padStart(3, "0")}`;
    const canvas = document.querySelectorAll("canvas")[i];
    const imageUrl = `./svg/${fileName.value}_${String(v).padStart(3, "0")}.svg`;
    const scriptContent = `
            let canvas = document.querySelector("canvas");
            const context = canvas.getContext("2d");
            const base_image = new Image();
            base_image.src = "${canvas.toDataURL()}";
            canvas.style.display = 'none';


            const img = new Image();
            img.src = "${imageUrl}";
            img.onload = function () {
              img.style.width = 'calc(var(--scale-factor) * ${pageWidth / scale.value}px)';
              img.style.height = 'calc(var(--scale-factor) * ${pageHeight / scale.value}px)';
              const pdfWrap = document.querySelector(".pdf_wrap > div");
              pdfWrap.prepend(img);
            }
        `;

    const scriptFileName = `${fileName.value}_${String(v).padStart(3, "0")}.js`;
    zip.folder("js").file(scriptFileName, scriptContent);

    const scriptElement = document.createElement("script");
    scriptElement.src = `./js/${scriptFileName}`;
    contentHTML.querySelector("body").appendChild(scriptElement);

    // Blob 생성 및 ZIP 파일에 추가
    const blob = new Blob([contentHTML.innerHTML], { type: "text/html" });
    zip.file(`${fileName.value}_${String(v).padStart(3, "0")}.html`, blob);
  });

  zip.folder("css").file("common.css", cssContent);

  zip.generateAsync({ type: "blob" }).then((resZip) => {
    const url = URL.createObjectURL(resZip);
    const aTag = document.createElement("a");

    aTag.download = fileName.value;
    aTag.href = url;
    aTag.click();
  });
}

function deleteFile() {
  fetch("/deleteFile", {
    method: "DELETE"
  }).then(response => {
    if (response.ok) {

      // pdfRef가 배열인 경우 (v-for 사용)
      if (Array.isArray(pdfRef.value)) {
        console.log("cancel 됨?")
        pdfRef.value.forEach(ref => {
          if (ref && typeof ref.cancel === 'function') {
            ref.cancel();
          }
        });
      }
      // pdfRef가 단일 객체인 경우 (choice 모드)
      else if (pdfRef.value && typeof pdfRef.value.cancel === 'function') {
        pdfRef.value.cancel();
      }


      file.value = null;
      isFile.value = false;

      fileName.value = "";
      selectedPage.value = [];
      filteredPages.value = [];
      renderedPages.value = [];
      loadedCount.value = 0;
      lastChunkEnd.value = 0;
      isLoadingMore.value = false;
      isConvert.value = false;
      isUpload.value = false;
      open.value = false;
      page.value = 1;
      startPage.value = 1;
      lastPage.value = pages.value;
      text_layer.value = true;
      renderCount.value = 0;
      pageWidth = 0;
      pageHeight = 0;
      chunkTimeoutId = null;
      scaleDebounceTimer = null;
      isScaleChanging = false;
      setScale(1.4);

    }
  }).catch(err => console.error("File delete error:", err));
}

</script>


<style lang="scss">
@import "./style/pdf/annotationLayer.css";
@import "./style/base/reset.css";

@font-face {
  font-family: "Cafe24Supermagic-Bold-v1.0";
  src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-2@1.0/Cafe24Supermagic-Bold-v1.0.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: "GangwonEduHyeonokT_OTFMediumA";
  src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2201-2@1.0/GangwonEduHyeonokT_OTFMediumA.woff") format("woff");
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: "UhBeemysen";
  src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_five@.2.0/UhBeemysen.woff") format("woff");
  font-weight: normal;
  font-style: normal;
}

#app {
  background-color: #ccc;
}

.pdfContainer {
  button {
    padding: 0px 7px;
  }

  .header {
    background-color: #41b883;
    display: flex;
    justify-content: center;

    .tool-bar {
      &>li {
        &>button {
          border-radius: 5px;
          padding: 0px 6px 1px 6px;
          margin-left: 4px;

          &:hover {
            background-color: #35976b;
          }
        }

      }
    }

    &>div {
      display: flex;
      justify-content: center;

      input[type="radio"] {
        display: none;

        &:checked+label {
          background-color: #35976b;
        }
      }

      label {
        display: inline-block;
        font-size: 1.5rem;
        padding: 12px;
        white-space: nowrap;
        text-wrap: nowrap;
        word-break: keep-all;
        cursor: pointer;
        color: #fff;
      }
    }

    &>ul {
      font-size: 1.5rem;
      white-space: nowrap;
      text-wrap: nowrap;
      word-break: keep-all;
      color: #fff;

      li {
        padding: 12px;
      }

      .file_wrap {
        &:hover {
          background-color: #35976b;
        }

        input[type="file"] {
          position: absolute;
          width: 0;
          height: 0;
          padding: 0;
          overflow: hidden;
          border: 0;
        }

        label {
          cursor: pointer;
        }
      }

      .page_wrap {
        button {
          border: 1px solid #fff;
          border-radius: 3px;
          margin: 0 5px;

          &:hover {
            background-color: #35976b;
          }
        }

        input {
          background-color: #55c592;
          border: 1px solid #fff;
          border-radius: 2px;
          color: #fff;
          padding-right: 4px;
          outline: none;

          &:focus {
            border-color: #424242;
          }
        }
      }

      .scale_wrap {

        input {
          width: 50px;

          background-color: #55c592;
          border: 1px solid #fff;
          border-radius: 2px;
          margin: 0 4px;
          color: #fff;
          outline: none;
          text-align: center;

          &:focus {
            border-color: #424242;
          }
        }

        button {
          border: 1px solid #fff;
          border-radius: 3px;
          margin: 0 5px;

          &:hover {
            background-color: #35976b;
          }
        }

        span {
          display: inline-block;
          width: 40px;
        }
      }

      .choice_wrap {
        position: relative;
        width: 190px;

        &>button {
          border: 1px solid #fff;
          border-radius: 3px;
          margin: 0 5px;
          margin-left: 120px;

          &:hover {
            background-color: #35976b;
          }
        }

        .select_wrap {
          .select {
            position: absolute;
            top: 11px;
            left: 7px;
            width: 98px;
            font-size: 1.2rem;
            border: 1px solid #ccc;
            padding: 3px 10px;
            border-radius: 5px;
            /* 드롭다운 모서리 둥글게 */
            background-color: #35976b;
            text-align: left;
            cursor: pointer;

            &:after {
              position: absolute;
              content: "";
              top: 8px;
              right: 10px;
              width: 0;
              height: 0;
              border: 5px solid transparent;
              border-color: #fff transparent transparent transparent;
            }

            &.open {
              border: 1px solid #ad8225;
              border-radius: 6px 6px 0px 0px;
            }
          }

          .items {
            overflow: hidden;
            position: absolute;
            top: 33px;
            left: 7px;
            width: 98px;
            font-size: 1.2rem;
            border-right: 1px solid #ad8225;
            border-left: 1px solid #ad8225;
            border-bottom: 1px solid #ad8225;
            border-radius: 0px 0px 6px 6px;
            background-color: #35976b;
            cursor: pointer;
            z-index: 3;

            .item {
              display: flex;
              justify-content: space-around;

              &:not(:last-child) {
                margin-bottom: 5px;
              }

              &:hover {
                background-color: #2d7e59;
              }

              div {
                width: 50%;
                text-align: center;
                display: flex;
                justify-content: center;
                align-items: center;
              }

              button {
                border: 1px solid #fff;
                border-radius: 3px;
                margin-top: 4px;
                margin-bottom: 4px;

                &:hover {
                  background-color: #2d7e59;
                }
              }
            }
          }
        }
      }

      .export_wrap {
        cursor: pointer;

        &:hover {
          background-color: #35976b;
        }
      }

      .rangePage_wrap {
        input {
          width: 50px;

          background-color: #55c592;
          border: 1px solid #fff;
          border-radius: 2px;
          color: #fff;
          padding-right: 8px;
          outline: none;
          text-align: right;

          &:focus {
            border-color: #424242;
          }
        }
      }


    }
  }

  .content {
    height: 95vh;
    margin: 0px auto;
    display: flex;
    justify-content: center;
    overflow: auto;

    .pdf_wrap {
      height: fit-content;
      margin: 10px;
      position: relative;
    }
  }
}

.loading-container {
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loader {
  border: 16px solid #f3f3f3;
  /* 회색 테두리 */
  border-top: 16px solid #41b883;
  /* 파란색 테두리 */
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
  /* 회전 애니메이션 */
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

// 상단 진행 바 (작고 깔끔하게)
.top-progress-bar {
  position: relative;
  width: 100%;
  height: 14px;
  background: #e0e0e0;
  overflow: hidden;
}

.top-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #41b883, #35976b);
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(65, 184, 131, 0.6);
}

.top-progress-text {
  position: absolute;
  top: 0;
  right: 10px;
  font-size: 0.85rem;
  color: white;
  background: rgba(65, 184, 131, 0.95);
  padding: 2px 8px;
  border-radius: 0 0 4px 4px;
  font-weight: bold;
  z-index: 2;
}
</style>
