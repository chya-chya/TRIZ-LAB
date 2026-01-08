# 업무 작업 로그

**작성일시**: 2026-01-08
**작성자**: Antigravity AI Advisor

## 1. 작업 개요

사용자 요청에 따라 `TRIZ-LAB` 프로젝트의 인증(Auth) 모듈을 구현했습니다. Passport 및 JWT 기반의 인증 전략을 수립하고, Prisma ORM을 사용하여 데이터베이스와 연동했습니다.

## 2. 주요 구현 내역

### 2.1 공통 설정

- **Base URL 설정**: `main.ts`에서 API의 글로벌 프리픽스를 `/api/v1`으로 설정했습니다.
- **유효성 검증**: `ValidationPipe`를 전역으로 등록하여 DTO 기반의 요청 데이터 검증을 활성화했습니다.
- **환경 변수 관리**: `ConfigModule`을 전역(`isGlobal: true`)으로 설정하여 `.env` 파일의 환경 변수를 애플리케이션 전체에서 사용할 수 있도록 했습니다.

### 2.2 인증 모듈 (AuthModule)

Prisma 7.x 버전에 맞춰 스키마 및 클라이언트를 설정하고, 다음 기능들을 구현했습니다.

#### 📁 DTO (Data Transfer Object)

- `SignupDto`: 이메일(Email), 비밀번호(String, 최소 4자), 닉네임 유효성 검사
- `LoginDto`: 이메일, 비밀번호 유효성 검사
- `RefreshDto`: 리프레시 토큰 문자열 유효성 검사

#### 🔐 보안 전략 (Security)

- `JwtStrategy`: `@nestjs/passport`와 `passport-jwt`를 사용하여 JWT 인증 가드를 구현했습니다.
- **JWT 설정**: `JwtModule`과 `PassportModule`을 `AuthModule`에 등록하고, `JwtService`를 통해 토큰을 발급/검증하도록 구성했습니다.
- **비밀번호 단방향 암호화**: `bcrypt` 라이브러리를 사용하여 회원가입 시 비밀번호를 해시화하여 저장하고, 로그인 시 비교 검증합니다.

#### ⚙️ 비즈니스 로직 (AuthService)

1. **회원가입 (`signup`)**
   - 비밀번호 해시화 수행
   - 사용자 정보 DB 저장 (User 모델)
   - 중복된 이메일 등 예외 처리

2. **로그인 (`login`)**
   - 이메일로 사용자 조회
   - 비밀번호 일치 여부 확인
   - Access Token (1시간) 및 Refresh Token (7일) 발급
   - 발급된 Refresh Token을 DB에 저장 (Rotation 준비)

3. **토큰 재발급 (`refresh`) - Rotation 적용**
   - 클라이언트로부터 받은 Refresh Token 검증
   - DB에 저장된 토큰과 일치 여부 확인
   - **Rotation 정책 수행**: 사용된 기존 Refresh Token을 **즉시 삭제**하고, 새로운 Access/Refresh Token 쌍을 발급하여 DB에 저장
   - 이를 통해 탈취된 Refresh Token의 재사용을 방지합니다.

### 2.3 데이터베이스 (Prisma)

- **Prisma 7 호환성 업데이트**: `schema.prisma`에서 `url` 필드를 제거하고 `prisma.config.ts` 파일을 생성하여 DB 연결 설정을 분리했습니다.
- **PrismaService**: `PrismaClient`를 상속받는 서비스 클래스를 구현하고, `OnModuleInit`, `OnModuleDestroy` 생명주기 훅을 통해 DB 연결을 관리했습니다.
- **스키마 모델**: `User` 및 `RefreshToken` 모델을 활용했습니다.

## 3. 업데이트 된 파일 목록

- `src/main.ts`
- `src/app.module.ts`
- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/jwt.strategy.ts`
- `src/auth/dto/*.dto.ts`
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`
- `prisma/schema.prisma`
- `prisma.config.ts`

## 4. 실행 및 테스트 방법

1. `.env` 파일에 DB URL 및 JWT Secret 설정
2. `npx prisma generate` 명령어로 클라이언트 코드 생성
3. `npm run start:dev` 로 서버 실행
4. API 테스트 도구(Postman 등)를 사용하여 `/api/v1/auth/signup`, `/login`, `/refresh` 엔드포인트 호출
