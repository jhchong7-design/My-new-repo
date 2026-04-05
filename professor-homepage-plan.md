# 강성열교수 홈페이지 개발 계획

## 요구사항 분석

### 1. 메인 페이지 기능 (Main Page)
- 최근글 리스트 표시
  - 한국사상과성경
  - 세계사상과성경
  - 책과논문
  - 열린마당
  - 공지사항
  - 게시판
  - 이미지&동영상

### 2. 사용자 인증 시스템
- 로그인 기능
- 회원가입 기능

### 3. 관리자 시스템
- 정보 추가 (Create)
- 정보 변경 (Update)
- 정보 삭제 (Delete)
- 게시판 관리

## 구조 계획

### Backend (Node.js + Express)
- RESTful API 구축
- JWT 인증
- MongoDB 데이터베이스 연동

### Frontend Files
1. `index.html` - 메인 페이지 (최신글 섹션 7개)
2. `login.html` - 로그인 페이지
3. `register.html` - 회원가입 페이지
4. `admin.html` - 관리자 대시보드
5. 각 게시판 페이지들

### Database Schema
각 게시판 타입별 컬렉션/테이블
```
- users (회원정보)
- notices (공지사항)
- korean_bible (한국사상과성경)
- world_bible (세계사상과성경)
- books_papers (책과논문)
- openforum (열린마당)
- boards (일반게시판)
- media_gallery (이미지&동영상)
```

## 개발 단계

1. ✅ 프로젝트 구조 설정
2. ⬜ 메인 페이지 UI 구현 (7개 최신글 섹션)
3. ⬜ 로그인/회원가입 시스템 구현
4. ⬜ 관리자 대시보드 구현
5. ⬜ CRUD API 개발
6. ⬜ 게시판 페이지들 구현
7. ⬜ 테스트 및 배포