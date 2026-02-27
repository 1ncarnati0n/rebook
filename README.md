# Rebook

Rebook은 브라우저에서 EPUB 파일을 읽는 React 기반 이북 리더입니다.

## 주요 기능

- EPUB 업로드 및 라이브러리 관리
- 페이지 모드(`paginated`) / 스크롤 모드(`scrolled`) 전환
- 키보드 네비게이션
  - `←` / `→`: 이전/다음 장 이동
  - `↑` / `↓`: 현재 장 내부 스크롤
- 북마크 / 목차(TOC)
- 라이트 / 세피아 테마
- 읽기 위치 및 설정 로컬 저장(IndexedDB + Zustand persist)
- 라우트 lazy loading (`/library`, `/reader/:bookId`)

## 기술 스택

- React 19 + TypeScript + Vite
- React Router
- Zustand
- Dexie (IndexedDB)
- Tailwind CSS + shadcn/ui
- react-reader (epub.js 기반)

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 표시된 로컬 주소(기본 `http://localhost:5173`)로 접속하세요.

## 스크립트

```bash
npm run dev     # 개발 서버
npm run lint    # ESLint
npm run build   # 프로덕션 빌드
npm run preview # 빌드 결과 미리보기
```

## 프로젝트 구조

```text
src/
  features/
    library/     # 라이브러리 화면/업로드
    reader/      # 리더 화면/렌더러/TOC/설정
    settings/    # 전역 테마 적용
  stores/        # Zustand 상태
  db/            # Dexie repository
  lib/           # EPUB/스토리지 유틸
```

## 크롬 확장프로그램으로 사용하기

현재 저장소는 **웹앱 템플릿**이라, 바로 `chrome://extensions`에 로드할 수 있는 상태는 아닙니다.
확장으로 쓰려면 아래 단계를 먼저 적용해야 합니다.

1. `vite.config.ts`에 `base: './'` 추가
2. `manifest.json` 생성 (Manifest V3)
3. `npm run build` 후 `dist` 폴더를 확장으로 로드

예시 `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Rebook",
  "version": "0.1.0",
  "action": {
    "default_title": "Open Rebook"
  },
  "background": {
    "service_worker": "background.js"
  },
  "permissions": ["storage"]
}
```

`public/background.js` 예시:

```js
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html#/library'),
  });
});
```

로딩 방법:

1. Chrome에서 `chrome://extensions` 접속
2. 우측 상단 `개발자 모드` ON
3. `압축해제된 확장 프로그램을 로드합니다` 클릭
4. `dist` 폴더 선택

## 참고

- 데이터(책 파일, 북마크, 진행률)는 브라우저 로컬(IndexedDB)에 저장됩니다.
- 아직 테스트 러너(`npm test`)는 구성되어 있지 않습니다.
