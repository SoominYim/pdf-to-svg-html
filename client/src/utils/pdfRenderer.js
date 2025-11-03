/**
 * HTML 포맷팅 유틸리티
 */

/**
 * @description HTML 문자열을 포맷팅 (들여쓰기 및 줄바꿈 추가)
 * @param {string} html - 포맷팅할 HTML 문자열
 * @returns {string} - 포맷팅된 HTML 문자열
 */
const formatHTMLUtils = html => {
  // 태그와 텍스트를 분리하되, 텍스트는 앞 태그와 연결
  let formatted = html
    .replace(/(<[^>]+>)/g, "\n$1") // 태그 앞에만 줄바꿈
    .replace(/(<!--[\s\S]*?-->)/g, "\n$1\n") // 주석은 앞뒤 줄바꿈
    .split("\n")
    .map(line => line.trim())
    .filter(line => line);

  let indent = 0;
  const indentSize = 2;
  const result = [];
  let lastWasTag = false;

  formatted.forEach(line => {
    // 주석 처리
    if (line.startsWith("<!--")) {
      result.push(" ".repeat(indent * indentSize) + line);
      lastWasTag = false;
      return;
    }

    // 태그인지 텍스트인지 확인
    const isTag = line.startsWith("<");

    // 닫는 태그 감지
    const isClosingTag = isTag && /^<\//.test(line);
    // 여는 태그 감지 (self-closing 제외)
    const isOpeningTag = isTag && /^<[^/!?]/.test(line) && !/\/>$/.test(line);
    // DOCTYPE 처리
    const isDocType = isTag && /^<!DOCTYPE/.test(line);

    // 텍스트 노드 처리 (짧은 텍스트는 같은 줄에)
    if (!isTag) {
      // 이전이 태그였고 텍스트가 짧으면 같은 줄에
      if (lastWasTag && line.length < 100 && !line.includes("\n")) {
        const lastIndex = result.length - 1;
        if (lastIndex >= 0) {
          result[lastIndex] += line;
          return;
        }
      }
      // 긴 텍스트나 여러 줄 텍스트는 별도 줄
      result.push(" ".repeat(indent * indentSize) + line);
      lastWasTag = false;
      return;
    }

    // 닫는 태그는 먼저 들여쓰기 감소
    if (isClosingTag) {
      indent = Math.max(0, indent - 1);
    }

    // 현재 라인 추가
    result.push(" ".repeat(indent * indentSize) + line);
    lastWasTag = isTag;

    // DOCTYPE은 들여쓰기 증가 안 함
    if (!isDocType && isOpeningTag) {
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

export { formatHTMLUtils, formatHTMLDocumentUtils };
