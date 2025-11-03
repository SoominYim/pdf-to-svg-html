# PDF to SVG Converter - Integrated

프론트엔드와 백엔드가 통합된 PDF to SVG 변환기입니다.

## 📁 프로젝트 구조

```
pdf-to-svg-html/
├── client/                 # Vue.js 프론트엔드
│   ├── src/
│   ├── public/
│   └── package.json
├── modules/               # 백엔드 모듈들
│   ├── convertFile.js
│   ├── getSVGFile.js
│   └── uploadFile.js
├── input/                 # 업로드된 PDF 파일
├── output/                # 변환된 SVG 파일
├── pdf-svg/               # PDF2SVG 실행 파일
├── app.js                 # Express 서버
└── package.json           # 루트 package.json
```

## 📥 클론 및 업데이트

GitHub 저장소를 클론

```bash
git clone https://github.com/SoominYim/pdf-to-svg-html.git
cd pdf-to-svg-html
```

업데이트

```
git pull origin main
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
# 백엔드 의존성
npm install

```

### 2. 개발 모드 실행

#### 방법 1: 프론트엔드와 백엔드 동시 실행 (권장)

```bash
npm run dev:all
```

- 백엔드: http://localhost:3000
- 프론트엔드 개발 서버: http://localhost:8080

개발 중에는 8080 포트를 사용하세요. HMR로 코드 수정이 즉시 반영되고, 프록시 설정으로 백엔드 API도 자동으로 연결됩니다.

#### 방법 2: 각각 따로 실행

터미널 1 (백엔드):

```bash
npm run dev
```

터미널 2 (프론트엔드):

```bash
npm run client
```

### 3. 프로덕션 빌드 및 배포

```bash
# 프론트엔드 빌드
npm run build

# 서버 시작 (빌드된 프론트엔드 포함)
npm start
```

이후 http://localhost:3000 에서 전체 애플리케이션에 접근할 수 있습니다.

## 📝 사용 가능한 스크립트

| 명령어            | 설명                            |
| ----------------- | ------------------------------- |
| `npm start`       | 프로덕션 모드로 서버 시작       |
| `npm run dev`     | 백엔드 개발 서버 실행 (nodemon) |
| `npm run client`  | 프론트엔드 개발 서버 실행       |
| `npm run build`   | 프론트엔드 빌드 (배포용)        |
| `npm run dev:all` | 프론트엔드와 백엔드 동시 실행   |

## 🔧 기술 스택

### 백엔드

- Node.js
- Express
- Multer (파일 업로드)
- PDF-Parse

### 프론트엔드

- Vue 3
- @tato30/vue-pdf
- JSZip
- # pdfjs-dist (Legacy)

## 📌 주요 기능

- PDF 파일 업로드
- 개별 페이지 선택 변환
- 범위 지정 변환
- SVG 파일 다운로드 (ZIP)
- 실시간 프리뷰 및 확대/축소
- 텍스트 레이어 지원

## ⚙️ 주요 설정

### Vue.config.js

- **프록시 설정**: 개발 중 백엔드 API 자동 연결
- **PDF.js Legacy 빌드**: 호환성을 위한 설정
- # **Transpile 설정**: Vue PDF 및 pdfjs-dist 지원

## ⚠️ 주의사항

- `input/` 폴더와 `output/` 폴더는 자동으로 관리됩니다.
- 개발 중에는 `npm run dev:all`을 사용하는 것을 권장합니다.
- PDF 변환을 위해 `pdf-svg/` 폴더의 `pdf2svg.exe` 및 관련 DLL이 필요합니다.

## 🐛 트러블슈팅

### PDF.js 관련 오류

프로젝트는 pdfjs-dist의 legacy 빌드를 사용하도록 설정되어 있습니다. 오류가 발생하면 `client/node_modules`를 삭제하고 재설치하세요.

```bash
cd client
rm -rf node_modules
npm install
```

### 포트 충돌

기본 포트 (3000, 8080)가 이미 사용 중이라면:

- 백엔드: `app.js`에서 포트 변경
- 프론트엔드: `client/vue.config.js`의 devServer 포트 설정 추가
