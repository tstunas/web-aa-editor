# web-aa-editor

Saitamaar 복합 폰트 기반 glyph 조판/캔버스 에디터 데모입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 Vite 개발 서버를 열면 캔버스 에디터가 표시됩니다.

## 주의

- `HeadKasen.ttf`는 원격 URL에서 로드합니다.
- 한글 렌더링을 위해 `public/assets/font/NanumGothicCoding.ttf` 또는 `/assets/font/NanumGothicCoding.ttf` 경로에서 접근 가능한 폰트 파일을 준비해야 합니다.
- `Ctrl/Cmd + C`로 선택된 텍스트 박스의 위치를 유니코드 공백 prefix로 근사한 plain text를 복사할 수 있습니다.
