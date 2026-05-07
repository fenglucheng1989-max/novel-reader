# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Backend (Java 17, Spring Boot 3.2.5, Maven)
cd backend
mvn test                                    # Run all tests (H2)
mvn clean package -DskipTests               # Build JAR → target/novel-reader-1.0.0-SNAPSHOT.jar
java -jar target/novel-reader-1.0.0-SNAPSHOT.jar          # Run with H2 file DB (default)
java -jar target/novel-reader-1.0.0-SNAPSHOT.jar --spring.profiles.active=postgres  # Run with PostgreSQL

# Frontend (uni-app Vue 3 + Pinia, Vite)
cd frontend
npm run dev:h5      # H5 dev server on port 5175
npm run build:h5    # Production build for H5
npm run build:app   # Android App build

# Admin Frontend (Vue 3 + Element Plus, Vite)
cd admin-frontend
npm run dev         # Dev server on port 5176
npm run build       # Production build
```

## Architecture Overview

```
novel-reader/
  backend/         Spring Boot 3.2 API — MyBatis-Plus, Flyway, JWT auth
  frontend/        uni-app Vue 3 H5/App — Pinia stores, scroll-based reader
  admin-frontend/  Vue 3 + Element Plus admin panel (separate app)
  deploy/          Docker Compose (postgres + redis + backend + nginx)
```

### Backend Layers

- **Controller** → **Service** (+ impl) → **Mapper** (MyBatis-Plus `BaseMapper`)
- Auth: `JwtAuthenticationFilter` + `JwtUtils` (JJWT 0.11.5). All endpoints require `Authorization: Bearer <token>` except `/api/v1/auth/**`, `/api/v1/books/**`, `/api/v1/categories/**`, `/api/v1/search/**`
- Flyway migrations in `src/main/resources/db/migration/` (V1 init, V2 import data)
- `BusinessException` → caught by `GlobalExceptionHandler`, returned as `ApiResponse(code, message)`
- Redis caches chapter content per book+chapterNo; falls back gracefully if Redis unavailable

### API Response Convention

```json
{"code": 200, "data": ..., "message": null}     // success
{"code": 400/401/404/500, "data": null, "message": "..."}  // error
```

### Frontend Stores (Pinia)

- `store/user.js` — auth, token, login/register/logout
- `store/book.js` — categories, books, shelf, search
- `store/reader.js` — chapters, chapter content (with local cache), progress, settings

### Frontend Conventions

- **Request utility** (`utils/request.js`): attaches JWT, shows toast on error, returns `{ code, data, message }`. Also exports `requestRaw` for file downloads.
- **API config** (`config/api.js`): `getApiBaseUrl()` with H5/APP conditional compilation.
- **Reader themes** (`utils/reader.js`): 3 presets (米白/清绿/夜间) with font size and line height.
- **Tab bar** (native): 3 tabs — 书城, 书架, 我的.
- **H5 layout**: Centered mobile-frame (max 480px) on desktop.

## Key Design Decisions

- **Scroll-based reader**: Not paginated/Canvas — prioritizes stability over page-turn animations.
- **Chapter content in PostgreSQL TEXT**: MVP simplicity; migration to object storage planned later.
- **Username login**: Simple auth model suited for personal reading app.
- **Local chapter caching**: Chapter content cached in `uni.setStorageSync` keyed by `chapter:{bookId}:{chapterNo}` for offline reading.
- **Import center**: Semi-automatic — URL/TXT import requires human preview and confirmation before persisting to DB.
- **Redis-optional**: All Redis operations wrapped in try-catch for graceful degradation.
