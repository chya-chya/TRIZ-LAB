# 업무 작업 로그

**작성일시**: 2026-01-08
**작성자**: Antigravity AI Advisor

## 1. 작업 개요

애플리케이션의 로그를 체계적으로 관리하기 위해 MongoDB 기반의 로깅 시스템을 구축했습니다. `winston` 라이브러리를 활용하여 애플리케이션 로그를 MongoDB에 영구 저장하도록 설정했습니다.

## 2. 주요 구현 내역

### 2.1 인프라 설정 (Docker)

- **MongoDB 컨테이너 추가**: `docker-compose.yaml`에 `mongo` 서비스를 추가하여 로깅 전용 데이터베이스를 구성했습니다.
  - **Image**: `mongo:latest`
  - **Port**: `27017:27017`
  - **Volume**: `TRIZLAB_mongo_data` (데이터 영구 저장)

### 2.2 애플리케이션 로깅 구현

- **라이브러리 설치**: `winston`, `nest-winston`, `winston-mongodb` 패키지를 설치했습니다.
- **LoggerModule 생성**: `common/logger` 모듈을 생성하여 로거 설정을 중앙화했습니다.
  - **Console Transport**: 개발 편의를 위해 콘솔에도 로그 출력 (nest-winston 유틸리티 활용).
  - **MongoDB Transport**: `info` 레벨 이상의 로그를 MongoDB `log` 컬렉션에 JSON 포맷으로 저장.
  - **DB 연결**: `mongodb://mongo:27017/TRIZLAB` (Docker 서비스명 `mongo` 사용).

### 2.3 전역 설정

- **Global Logger 적용**: `main.ts`에서 `app.useLogger()`를 사용하여 NestJS의 기본 로거를 Winston으로 대체했습니다.
- **AppModule 등록**: `AppModule`에 `LoggerModule`을 임포트하여 애플리케이션 시작 시 로거가 초기화되도록 했습니다.

## 3. 업데이트 된 파일 목록

- `docker-compose.yaml`
- `package.json`
- `src/common/logger/logger.module.ts` (신규 생성)
- `src/app.module.ts`
- `src/main.ts`

## 4. 확인 방법

1. **컨테이너 실행**: `docker compose up -d`
2. **로그 확인 (MongoDB)**:
   ```bash
   docker exec -it triz-lab-mongo-1 mongosh TRIZLAB
   db.log.find().pretty()
   ```
