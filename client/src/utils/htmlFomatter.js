/**
 * HTML 포맷팅 유틸리티
 */

// Void elements (닫는 태그가 없는 태그들)
const VOID_ELEMENTS = [
  "meta",
  "link",
  "img",
  "br",
  "hr",
  "input",
  "area",
  "base",
  "col",
  "embed",
  "source",
  "track",
  "wbr",
  "param",
];

/**
 * @description 태그 이름 추출
 */
const getTagName = tag => {
  const match = tag.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
  return match ? match[1].toLowerCase() : "";
};

/**
 * @description HTML 문자열을 포맷팅 (들여쓰기 및 줄바꿈 추가)
 * @param {string} html - 포맷팅할 HTML 문자열
 * @returns {string} - 포맷팅된 HTML 문자열
 */
const formatHTMLUtils = html => {
  // 주석 제거
  html = html.replace(/(<!--[\s\S]*?-->)/g, "");

  // 모든 태그를 분리
  let formatted = html
    .replace(/(<[^>]+>)/g, "\n$1\n") // 모든 태그 앞뒤에 줄바꿈
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.match(/^\s*$/)); // 빈 줄 제거

  let indent = 0;
  const indentSize = 2;
  const result = [];

  formatted.forEach(line => {
    // 태그인지 텍스트인지 확인
    const isTag = line.startsWith("<");

    if (!isTag) {
      // 텍스트 노드는 현재 indent + 1 (부모 태그 안에 있음)
      result.push(" ".repeat((indent + 1) * indentSize) + line);
      return;
    }

    // 닫는 태그 감지
    const isClosingTag = /^<\//.test(line);
    // DOCTYPE 처리
    const isDocType = /^<!DOCTYPE/.test(line);
    // 태그 이름 추출
    const tagName = getTagName(line);
    // Void element 또는 self-closing 태그
    const isVoidElement = VOID_ELEMENTS.includes(tagName) || /\/>$/.test(line);
    // 여는 태그 감지 (void element 제외)
    const isOpeningTag = /^<[^/!?]/.test(line) && !isVoidElement;

    // 닫는 태그는 먼저 들여쓰기 감소 (여는 태그와 같은 레벨로)
    if (isClosingTag) {
      indent = Math.max(0, indent - 1);
    }

    // 현재 라인 추가
    result.push(" ".repeat(indent * indentSize) + line);

    // 여는 태그는 들여쓰기 증가 (void element 제외, DOCTYPE 제외)
    if (!isDocType && !isVoidElement && isOpeningTag) {
      indent++;
    }
  });

  return result.join("\n");
};

/**
 * @description HTML Document 또는 HTML Element를 포맷팅된 문자열로 변환
 * @param {Document|HTMLElement} htmlDoc - HTML Document 또는 HTML Element 객체
 * @returns {string} - 포맷팅된 HTML 문자열
 */
const formatHTMLDocumentUtils = htmlDoc => {
  if (!htmlDoc) {
    return "";
  }

  // DOCTYPE 추가
  const doctype = "<!DOCTYPE html>";

  // Document 객체인 경우
  let html;
  if (htmlDoc.documentElement) {
    html = htmlDoc.documentElement.outerHTML;
  } else {
    // HTML 요소인 경우 (예: <html> 요소)
    html = htmlDoc.outerHTML;
  }

  return formatHTMLUtils(doctype + "\n" + html);
};

/**
 * @param {element} parentNode 최상위 부모노드
 * @param {string} a tag 삭제
 * @param {string} b class 삭제
 * @param {string} c style 삭제
 */

const removeElements = (parentNode, a, b, c) => {
  const elementsToRemove = parentNode.querySelectorAll(a);
  const elementsToRemoveClasses = parentNode.querySelectorAll(b);
  const elementsToRemoveStyle = parentNode.querySelectorAll(c);
  elementsToRemoveClasses.forEach(element => {
    element.classList = "";
  });
  elementsToRemove.forEach(element => element.parentNode.removeChild(element));
  elementsToRemoveStyle.forEach(element => {
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
};
export { formatHTMLDocumentUtils, removeElements };
