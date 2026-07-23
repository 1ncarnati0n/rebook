# Rebook

Rebook은 브라우저에서 EPUB 파일을 읽는 Svelte 5 기반 이북 리더입니다.

## 주요 기능

- EPUB 업로드 및 라이브러리 관리
- 페이지 모드(`paginated`) / 스크롤 모드(`scrolled`) 전환
- 키보드 네비게이션
  - `←` / `→`: 이전/다음 장 이동
  - `↑` / `↓`: 현재 장 내부 스크롤
- 북마크 / 목차(TOC)
- 라이트 / 세피아 테마
- 읽기 위치 및 설정 로컬 저장(IndexedDB + localStorage)
- 라우트 lazy loading (`/library`, `/reader/:bookId`)

## 기술 스택

- Svelte 5 + TypeScript + Vite
- Dexie (IndexedDB)
- Tailwind CSS
- epub.js

## 시작하기

```bash
pnpm install
pnpm dev
```

브라우저에서 표시된 로컬 주소(기본 `http://localhost:5173`)로 접속하세요.

## 스크립트

```bash
pnpm dev     # 개발 서버
pnpm check   # Svelte/TypeScript 검사
pnpm lint    # ESLint
pnpm build   # 프로덕션 빌드
pnpm preview # 빌드 결과 미리보기
```

## 프로젝트 구조

```text
src/
  features/
    library/     # 라이브러리 화면/업로드
    reader/      # 리더 화면/epub.js 렌더러/TOC/설정
  stores/        # Svelte rune 상태
  db/            # Dexie repository
  lib/           # EPUB/스토리지 유틸
```

## 크롬 확장프로그램으로 사용하기

`pnpm build` 후 생성된 `dist` 폴더를 확장으로 로드합니다.

로딩 방법:

1. Chrome에서 `chrome://extensions` 접속
2. 우측 상단 `개발자 모드` ON
3. `압축해제된 확장 프로그램을 로드합니다` 클릭
4. `dist` 폴더 선택

## 참고

- 데이터(책 파일, 북마크, 진행률)는 브라우저 로컬(IndexedDB)에 저장됩니다.
- 별도 테스트 runner는 없으며 `pnpm check`, `pnpm lint`, `pnpm build`로 검증합니다.
