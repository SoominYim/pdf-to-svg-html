# PDF to SVG Converter - Integrated

프론트엔드와 백엔드가 통합된 PDF to SVG 변환기입니다.

## 📁 프로젝트 구조

```
pdf-to-svg-integrated/
├── client/                 # Vue.js 프론트엔드
│   ├── src/
│   ├── public/
│   └── package.json
├── modules/               # 백엔드 모듈들
│   ├── convertFile.js
│   ├── getSVGFile.js
│   └── uploadFile.js
├── dist/                  # 빌드된 프론트엔드 (자동 생성)
├── input/                 # 업로드된 PDF 파일
├── output/                # 변환된 SVG 파일
├── pdf-svg/               # PDF2SVG 실행 파일
├── app.js                 # Express 서버
└── package.json           # 루트 package.json
```

## 🚀 시작하기

### 1. 의존성 설치

처음 한 번만 실행하면 백엔드와 프론트엔드 의존성을 모두 설치합니다:

```bash
npm install
```

또는 수동으로 설치:

```bash
# 백엔드 의존성 설치
npm install

# 프론트엔드 의존성 설치
cd client
npm install
cd ..
```

### 2. 개발 모드 실행

#### 방법 1: 프론트엔드와 백엔드 동시 실행 (권장)

```bash
npm run dev:all
```

- 백엔드: http://localhost:3000
- 프론트엔드 개발 서버: http://localhost:8080

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

| 명령어                 | 설명                            |
| ---------------------- | ------------------------------- |
| `npm start`            | 프로덕션 모드로 서버 시작       |
| `npm run dev`          | 백엔드 개발 서버 실행 (nodemon) |
| `npm run client`       | 프론트엔드 개발 서버 실행       |
| `npm run client:build` | 프론트엔드 빌드                 |
| `npm run dev:all`      | 프론트엔드와 백엔드 동시 실행   |
| `npm run build`        | 프론트엔드 빌드 (배포용)        |

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

## 📌 주요 기능

- PDF 파일 업로드
- 개별 페이지 선택 변환
- 범위 지정 변환
- SVG 파일 다운로드 (ZIP)

## ⚠️ 주의사항

- `input/` 폴더와 `output/` 폴더는 자동으로 관리됩니다.
- `dist/` 폴더는 프론트엔드 빌드 결과물이 저장되는 곳입니다.
- 개발 중에는 `npm run dev:all`을 사용하는 것을 권장합니다.
