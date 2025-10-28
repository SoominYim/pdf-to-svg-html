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
  <div class="pdfContainer" style="text-align: center">
    <div class="header">
      <div v-if="!isFile">
        <input type="radio" name="selectionType" id="choice" v-model="selectionType" value="choice" />
        <label for="choice">개별 선택</label>
        <input type="radio" name="selectionType" id="range" v-model="selectionType" value="range" />
        <label for="range">범위 선택</label>
      </div>
      <ul class="tool-bar" style="display: flex; justify-content: center; list-style-type: none; gap: 10px">
        <li v-if="isFile">
          <p>{{ fileName }}.pdf</p>
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
          <button @click="decrementScale(0.01)">-</button>
          <span for="magnification">{{ Math.round(scale * 100) }}%</span>
          <button @click="incrementScale(0.01)">+</button>
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
    <div v-if="selectionType == 'range'" class="content" ref="content" :style="{
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }">
      <div class="pdf_wrap" v-for="page in filteredPages" :key="page">
        <VuePDF @loaded="onLoaded" ref="vuePDFRef" :scale="scale" :pdf="pdf" :page="page" :text-layer="text_layer">
          <div class="loading-overlay">
            <div class="loader"></div>
          </div>
        </VuePDF>
      </div>
    </div>
    <div v-if="selectionType == 'choice'" class="content" ref="content" :style="{}">
      <div class="pdf_wrap">
        <VuePDF @loaded="onLoaded" ref="vuePDFRef" :scale="scale" :pdf="pdf" :page="page" :text-layer="text_layer">
          <div class="loading-overlay">
            <div class="loader"></div>
          </div>
        </VuePDF>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { VuePDF, usePDF } from "@tato30/vue-pdf";
import JSZip from "jszip";
import cssContent from "./style/style";

const file = ref(null);
const { pdf, pages } = usePDF(file);

const text_layer = ref(true);

const scale = ref(1);

const page = ref(1);
const fileName = ref("");
const isFile = ref(false);
const selectedPage = ref([]);
const selectionType = ref("choice");
const isConvert = ref(false);
const isUpload = ref(false);
let pageWidth = 0;
let pageHeight = 0;

const setScale = (newScale) => {
  scale.value = Math.max(0.5, Math.min(4, newScale));
};

const incrementScale = (count) => {
  setScale(scale.value + count);
};
const decrementScale = (count) => {
  setScale(scale.value - count);
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

const removeBrTags = () => {
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === "BR") {
            node.remove();
          }
        });
      }
    });
  });

  const pdfWrapElements = document.querySelectorAll(".pdf_wrap");
  pdfWrapElements.forEach((pdfWrapElement) => {
    observer.observe(pdfWrapElement, { childList: true, subtree: true });
  });
};

let isCtrl = false;
document.addEventListener("keydown", function (e) {
  if (e.which === 17) {
    isCtrl = true;
  }
});
document.addEventListener("keyup", function (e) {
  if (e.which === 17) {
    isCtrl = false;
  }
});

document.addEventListener(
  "wheel",
  function (e) {
    if (isCtrl) {
      e.preventDefault();
      if (e.deltaY > 0) {
        decrementScale(0.1);
      } else if (e.deltaY < 0) {
        incrementScale(0.1);
      }
    }
  },
  { passive: false }
);

document.addEventListener("keydown", function (e) {
  if (e.ctrlKey) {
    if (e.key === "-") {
      e.preventDefault();
      decrementScale(0.1);
    } else if (e.key === "=" || e.key === "+") {
      e.preventDefault();
      incrementScale(0.1);
    }
  }
});

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
  removeBrTags();
  text_layer.value = false;

  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => {
    text_layer.value = true;
  }, 500);
  pageWidth = v.width;
  pageHeight = v.height;
}

// common END

// 개별 선택 START
const startPage = ref(1);
const lastPage = ref(1);

function changePage(e) {
  e.target.value > pages.value || e.target.value < 1 ? (e.target.value = page.value) : (page.value = +e.target.value);
}

function resetPage(e) {
  e.target.value = page.value;
}

function selectChoicePage() {
  const a = document.querySelector("canvas");
  const canvasDataURL = a.toDataURL();
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

  await svgFiles.forEach((svgFile, i) => {
    const svgBlob = new Blob([svgFile], { type: "image/svg+xml" });
    zip.folder("svg").file(`${fileName.value}_${String(selectedPage.value[i].page).padStart(3, "0")}.svg`, svgBlob);
  });

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

const filteredPages = computed(() => {
  const filtered = [];
  for (let page = startPage.value; page <= lastPage.value; page++) {
    filtered.push(page);
  }
  return filtered;
});

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

  await svgFiles.forEach((svgFile, i) => {
    const svgBlob = new Blob([svgFile], { type: "image/svg+xml" });
    zip.folder("svg").file(`${fileName.value}_${String(filteredPages.value[i]).padStart(3, "0")}.svg`, svgBlob);
  });

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

// 범위 선택 END
</script>

<script>
export default {
  name: "MiniPdf",
  data() {
    return {
      open: false,
    };
  },
  methods: {
    numInput(e) {
      const regex = /[^0-9]/g;
      if (regex.test(e.target.value)) {
        e.target.value = e.target.value.replace(regex, "");
      }
    },
  },
};
</script>

<style lang="scss">
@import "./style/annotationLayer.css";
@import "./style/reset.css";

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
</style>
