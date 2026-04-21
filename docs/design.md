# 悦读 Novel Reader 设计说明

> 版本：1.0  
> 日期：2026年4月22日
> 定位：面向个人生态的小说阅读工具，优先完成稳定阅读、书架、内容管理和多端预览。  
> 参考工程：`D:\sourceCode\asset-manager`。  
> 技术栈：Spring Boot 3.2、PostgreSQL、Redis、MyBatis-Plus、Flyway、uni-app Vue 3、Pinia。

## 1. 产品定位

悦读是个人小说阅读应用，先服务“可导入、可管理、可阅读、可同步”的核心闭环，再逐步扩展搜索、推荐、听书、社区和商业化能力。当前阶段不追求一开始就做成大型网文平台，避免过早引入复杂推荐、广告、分库分表和多模块后端。

核心目标：

- 用户可以登录并在多端同步书架、阅读进度和阅读偏好。
- 用户可以浏览书库、搜索书籍、加入书架并稳定阅读章节。
- 管理端或后台接口可以维护书籍、章节、分类和封面。
- H5、Android App 保持和资产管家相同的工程结构、运行方式和部署习惯。
- 后续多个个人产品能共享技术栈、接口规范、部署目录和 AI 协作流程，形成统一生态。

## 2. 生态与工程策略

### 2.1 仓库与分支建议

你希望最终形成“一个 master，很多分支，方便管理，统一结构”的模式。结合当前 `asset-manager` 的实际形态，建议采用下面的方式：

- 短期：每个产品独立仓库，保持一致目录结构和技术栈。`asset-manager` 继续作为样板，`novel-reader` 按同样目录落地。
- 中期：沉淀一个 `app-template` 或 `master-template` 分支，专门保存统一的后端骨架、前端骨架、部署配置、README 和文档模板。
- 长期：如果多个产品之间需要共享登录、用户中心、主题、组件库和部署脚本，再考虑迁移为 monorepo。不要在小说阅读 MVP 阶段直接上复杂 monorepo。

推荐分支规则：

- `master`：稳定可运行基线。
- `develop`：日常集成分支。
- `feature/reader-mvp`：阅读器 MVP。
- `feature/content-admin`：内容导入与管理。
- `feature/mobile-app`：Android/iOS 打包适配。
- `release/v1.0`：阶段发布分支。

### 2.2 统一项目结构

小说项目建议直接对齐资产管家：

```text
novel-reader/
  docs/       产品设计、接口、迭代说明
  prompts/    AI 协作提示词
  backend/    Spring Boot 后端
  frontend/   uni-app 前端
  deploy/     Docker Compose、Nginx、环境配置
  README.md
  .gitignore
```

后端不建议 MVP 阶段使用 Maven 多模块。保持单应用分层即可，后续业务明显变大后再拆模块。

```text
backend/src/main/java/com/yourcompany/novelreader/
  controller/     REST 接口
  service/        业务接口
  service/impl/   业务实现
  mapper/         MyBatis-Plus Mapper
  entity/         数据库实体
  dto/            请求入参
  vo/             响应对象
  security/       Spring Security 与 JWT
  config/         Redis、MyBatis-Plus、跨域等配置
  exception/      业务异常与统一异常处理
  utils/          通用工具
```

前端保持 uni-app Vue 3：

```text
frontend/src/
  App.vue
  main.js
  manifest.json
  pages.json
  pages/
    index/index.vue          书城首页
    bookshelf/bookshelf.vue  我的书架
    reader/reader.vue        阅读器
    book/detail.vue          书籍详情
    search/search.vue        搜索
    mine/mine.vue            登录、个人中心、设置
  store/
    user.js                  用户登录状态
    book.js                  书籍、书架、详情状态
    reader.js                阅读进度、阅读偏好、本地缓存
  utils/
    request.js               请求封装与 token 处理
    reader.js                文本排版、分页、阅读设置
    storage.js               本地缓存封装
```

## 3. MVP 功能范围

MVP 要解决的是“能像真实产品一样读书”，而不是一次性把广告、社区、算法推荐全部做完。

### 3.1 用户账户

- 注册。
- 登录。
- JWT Bearer Token 鉴权。
- 登录状态本地保存。
- 退出登录。
- 登录过期后清理本地 token，并跳转到“我的”页面。

### 3.2 书籍与内容

- 查询书城推荐列表。
- 查询完整推荐榜单。
- 查询分类列表。
- 按分类查询书籍。
- 搜索书名、作者。
- 查看书籍详情。
- 查看章节目录。
- 查看章节正文。
- 后台或管理接口支持新增、编辑、删除书籍和章节。

MVP 的内容来源建议先支持手工维护或本地导入，不在第一阶段处理爬虫、版权采购、复杂审核流。

### 3.3 书架与阅读进度

- 加入书架。
- 移出书架。
- 查询我的书架。
- 自动保存最近阅读章节、页码或字符偏移。
- 阅读历史。
- 最近阅读入口。

### 3.4 阅读器

- 章节正文展示。
- 上一章、下一章。
- 字号、行距、背景色、夜间模式。
- 点击屏幕唤起顶部和底部工具栏。
- 本地保存阅读偏好。
- 预加载前后一章。

MVP 阅读器建议先采用 `scroll-view` 或普通纵向滚动阅读，稳定后再做分页、滑动翻页和仿真翻页。Canvas 仿真翻页可以作为后续体验升级，不放在第一阶段阻塞主流程。

### 3.5 多端表现

优先支持：

- H5 开发预览：`npm run dev:h5`
- H5 发布构建：`npm run build:h5`
- H5 发布预览：`npm run preview:h5`
- Android 测试包：通过 HBuilderX 云打包生成 APK

后续再补 iOS、小程序和 PWA。

## 4. 非 MVP 暂缓内容

以下能力有价值，但不应进入第一版主线：

- 广告系统、激励视频、插屏广告和广告频控。
- 评论、点赞、社区互动。
- 协同过滤、向量推荐、复杂用户画像。
- Elasticsearch、Kafka、RabbitMQ、Spark。
- 数据库读写分离、分库分表、Citus。
- CMS 独立前端。
- 仿真翻页 Canvas 动画。
- TTS 听书。

这些内容放到后续迭代，等阅读主流程和内容维护真正稳定后再加。

## 5. 后端设计

### 5.1 接口规范

基础路径：`/api/v1`

统一响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

认证接口：

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

书城与书籍接口：

- `GET /api/v1/books/recommend`
- `GET /api/v1/books/rank?categoryId=&limit=`
- `GET /api/v1/books`
- `GET /api/v1/books/{id}`
- `GET /api/v1/books/{id}/chapters`
- `GET /api/v1/books/{id}/chapters/{chapterNo}`
- `GET /api/v1/categories`
- `GET /api/v1/search/books?keyword=`

书架与阅读接口：

- `GET /api/v1/bookshelf`
- `POST /api/v1/bookshelf/{bookId}`
- `DELETE /api/v1/bookshelf/{bookId}`
- `GET /api/v1/reading/progress/{bookId}`
- `PUT /api/v1/reading/progress/{bookId}`
- `GET /api/v1/reading/history`

管理接口：

- `POST /api/v1/admin/books`
- `PUT /api/v1/admin/books/{id}`
- `DELETE /api/v1/admin/books/{id}`
- `POST /api/v1/admin/books/{id}/chapters`
- `PUT /api/v1/admin/chapters/{id}`
- `DELETE /api/v1/admin/chapters/{id}`

MVP 可以先用同一个后端提供管理接口，前端管理页面可以暂缓，先用接口工具或后续补简单后台页。

### 5.2 安全设计

- 使用 Spring Security 保护用户、书架、进度和管理接口。
- 注册、登录、书籍浏览、章节读取接口允许匿名访问，是否允许匿名读完整章节由产品策略决定。
- 密码使用 `PasswordEncoder` 加密存储。
- 登录和注册成功后返回 JWT。
- JWT 中写入用户名与用户 ID。
- 管理接口先用 `role` 字段区分普通用户和管理员，后续再扩展 RBAC。

### 5.3 缓存设计

Redis 在本地预览时允许不可用，逻辑要和资产管家一致：读取失败、写入失败、删除失败都不影响主流程。

推荐缓存：

- 书籍详情：`novel:book:{bookId}`，过期 30 分钟。
- 章节目录：`novel:chapters:{bookId}`，过期 30 分钟。
- 章节正文：`novel:chapter:{bookId}:{chapterNo}`，过期 2 小时。
- 书城推荐：`novel:recommend:{categoryId}`，过期 10 分钟。

内容新增、编辑、删除后清理相关缓存。

## 6. 数据库设计

### 6.1 用户表 `app_user`

保持和资产管家一致，方便后续抽成统一用户中心。

```sql
CREATE TABLE app_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    avatar_url VARCHAR(255),
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 分类表 `novel_category`

```sql
CREATE TABLE novel_category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    parent_id BIGINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.3 书籍表 `novel_book`

```sql
CREATE TABLE novel_book (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    category_id BIGINT,
    description TEXT,
    cover_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'ONGOING',
    word_count INT DEFAULT 0,
    chapter_count INT DEFAULT 0,
    latest_chapter_title VARCHAR(200),
    source_type VARCHAR(20) DEFAULT 'MANUAL',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

状态建议：

- `ONGOING`：连载
- `COMPLETED`：完结
- `PAUSED`：暂停

### 6.4 章节表 `novel_chapter`

```sql
CREATE TABLE novel_chapter (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL,
    chapter_no INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    word_count INT DEFAULT 0,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter_no)
);
```

MVP 阶段章节正文直接放 PostgreSQL `TEXT`，实现简单、备份简单。等章节量和访问量明显增长后，再考虑正文转 OSS 或对象存储，数据库只保留元数据。

### 6.5 书架表 `novel_bookshelf`

```sql
CREATE TABLE novel_bookshelf (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);
```

### 6.6 阅读进度表 `novel_reading_progress`

```sql
CREATE TABLE novel_reading_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_id BIGINT,
    chapter_no INT DEFAULT 1,
    position INT DEFAULT 0,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);
```

### 6.7 阅读历史表 `novel_reading_history`

```sql
CREATE TABLE novel_reading_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_id BIGINT,
    duration_seconds INT DEFAULT 0,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.8 阅读偏好表 `novel_reader_setting`

```sql
CREATE TABLE novel_reader_setting (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    font_size INT DEFAULT 18,
    line_height INT DEFAULT 30,
    theme VARCHAR(20) DEFAULT 'DEFAULT',
    turn_mode VARCHAR(20) DEFAULT 'SCROLL',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.9 索引建议

- `novel_book(title)`：书名搜索。
- `novel_book(author)`：作者搜索。
- `novel_book(category_id, sort_order)`：分类列表。
- `novel_chapter(book_id, chapter_no)`：章节读取。
- `novel_bookshelf(user_id, sort_order)`：书架查询。
- `novel_reading_progress(user_id, book_id)`：进度同步。

PostgreSQL 全文检索可以第二阶段再加；MVP 先用 `ILIKE` 和普通索引满足本地/小规模内容。

## 7. 前端设计

### 7.1 页面结构

底部 Tab 建议：

- 书城：首页推荐、完整榜单、分类入口、最近更新。
- 书架：我的收藏、最近阅读进度。
- 我的：登录状态、阅读设置、缓存管理。

非 Tab 页面：

- 书籍详情。
- 章节目录。
- 阅读器。
- 搜索。
- 登录/注册。

### 7.2 阅读器交互

MVP 阅读器原则：

- 稳定优先，先纵向滚动阅读。
- 工具栏显示/隐藏不影响正文布局。
- 字号、行距、主题切换立即生效。
- 当前阅读位置节流保存，避免频繁请求。
- 离线缓存先缓存最近阅读的前后一章，不做整本下载。

后续阅读器升级顺序：

1. 滚动阅读稳定。
2. 分页阅读。
3. 左右滑动翻页。
4. 章节预排版和缓存。
5. Canvas 仿真翻页。

### 7.3 请求策略

沿用资产管家的策略：

- H5 默认使用相对路径 `/api`。
- H5 开发和发布预览通过 Vite 代理到 `http://localhost:8080`。
- App-Plus 使用局域网后端地址，后续统一抽到环境配置。
- 请求自动附带 `Authorization: Bearer <token>`。
- 401 时清理 token 并跳转到“我的”页面或登录页。

### 7.4 本地缓存

- 登录 token：本地持久化。
- 阅读偏好：本地持久化，并在登录后可同步到服务端。
- 当前章节内容：本地缓存，减少重复请求。
- 最近阅读位置：本地即时保存，后台节流同步。

App 端后续可使用 SQLite；MVP 先用 `uni.setStorageSync` 封装即可。

## 8. 后台管理设计

### 8.1 后台定位

后台管理用于维护小说内容、分类、章节和外部导入任务。它不是面向读者的运营活动后台，也不是复杂 CMS；第一版只解决“我能方便地把书放进去、改章节、看导入结果”的问题。

后台目标：

- 管理员可以登录后台。
- 管理员可以查看书籍列表、搜索书名和作者。
- 管理员可以新增、编辑、删除书籍。
- 管理员可以维护章节目录和章节正文。
- 管理员可以维护分类。
- 管理员可以提交一个外部 URL，预览解析结果，再确认入库。
- 所有后台接口复用 `/api/v1/admin` 前缀，并使用 JWT + `ADMIN` 角色保护。

### 8.2 技术选型

后台 UI 明确做成 PC 端独立管理应用，不放进 uni-app 手机端工程。后端仍复用现有 Spring Boot 单体，前端尽量沿用 Vue 3、Pinia、Vite、请求封装和 JWT 鉴权思路。

| 类别 | 方案 | 说明 |
| --- | --- | --- |
| 前端框架 | Vue 3 + Vite | 与 uni-app 同属 Vue 生态，但更适合 PC 后台 |
| 路由 | Vue Router | 后台需要登录页、布局页、列表页、编辑页 |
| 状态管理 | Pinia | 与现有前端统一 |
| UI 组件 | Element Plus | PC 表格、表单、弹窗、分页更省心 |
| 图标 | Element Plus Icons | 与 Element Plus 搭配 |
| HTTP | Axios | PC 后台使用更直接，统一封装 token 和 401 |
| 后端 | Spring Boot 3.2 | 复用当前单体应用 |
| 权限 | Spring Security + JWT + role | `ADMIN` 才能访问管理接口 |
| 数据库 | PostgreSQL/H2 + Flyway | 分类、书籍、章节继续用现有表 |

不建议直接套大型 Vue Admin 模板。第一版自己搭一个轻量 PC 后台即可：`Vue 3 + Vite + Pinia + Vue Router + Element Plus`。这样既符合 PC 后台习惯，也不会把项目变成难维护的大模板。

推荐新增目录：

```text
admin-frontend/
  index.html
  package.json
  vite.config.js
  src/
    main.js
    App.vue
    router/
    store/
    api/
    layout/
    views/
```

### 8.3 后台入口与页面结构

后台入口建议使用独立 PC 管理端：

```text
开发地址：http://localhost:5176
登录页：http://localhost:5176/login
```

页面目录：

```text
admin-frontend/src/views/
  Login.vue              管理员登录
  Dashboard.vue          后台首页、统计概览、快捷入口
  Books.vue              书籍列表、搜索、新增、编辑、删除
  BookForm.vue           书籍新增和编辑
  Chapters.vue           某本书的章节列表
  ChapterForm.vue        章节新增和编辑
  Categories.vue         分类列表、新增、编辑、排序
  Import.vue             导入中心：URL/TXT 预览、章节确认、入库
```

用户端 `frontend/` 不放后台入口，避免普通读者误触。后续如果需要，可以在“我的”页面对 `ADMIN` 用户显示“打开后台”的外链按钮。

### 8.4 后台导航设计

后台按 PC 工作台设计：

- 页面最小宽度建议 `1200px`。
- 顶部显示项目名、当前管理员、退出登录。
- 左侧固定菜单：概览、书籍管理、分类管理、导入管理。
- 右侧内容区使用表格、搜索栏、分页、表单抽屉或独立编辑页。
- 不做移动端优先适配；移动端只保证基本不崩，不作为主要后台使用场景。

视觉原则：

- 后台偏工作台，不做营销式大卡片。
- 列表要密一些，方便扫描。
- 表单字段清晰分组：基础信息、分类状态、封面简介、排序。
- 章节正文编辑区要足够高，支持长文本粘贴。

### 8.5 后台接口规划

当前已有：

- `POST /api/v1/admin/books`
- `PUT /api/v1/admin/books/{id}`
- `DELETE /api/v1/admin/books/{id}`
- `POST /api/v1/admin/books/{id}/chapters`
- `PUT /api/v1/admin/chapters/{id}`
- `DELETE /api/v1/admin/chapters/{id}`

建议补充：

- `GET /api/v1/admin/books`
- `GET /api/v1/admin/books/{id}`
- `GET /api/v1/admin/books/{id}/chapters`
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/{id}`
- `DELETE /api/v1/admin/categories/{id}`
- `POST /api/v1/admin/import/preview`
- `POST /api/v1/admin/import/txt/preview`
- `POST /api/v1/admin/import/confirm`
- `GET /api/v1/admin/dashboard`

统一响应仍使用：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 8.6 管理员账号策略

当前注册用户默认是 `USER`，第一版后台需要明确管理员初始化方式。

推荐做法：

- `local` 环境 Flyway 初始化一个默认管理员。
- 默认用户名：`admin`
- 默认密码：`admin123456`
- 首次生产部署必须通过环境变量或初始化脚本修改默认密码。
- 后续再做用户管理和改密功能。

示例初始化规则：

```text
local profile:
  admin / admin123456

prod profile:
  不写死默认管理员，使用环境变量或部署脚本创建
```

### 8.7 导入中心设计

导入中心第一版只做“半自动”，不要直接把外部网页或文件内容静默入库。所有内容都需要先预览，再由管理员确认。

统一流程：

1. 管理员选择导入来源：网页 URL 或 TXT 文件。
2. 后端解析标题、作者、简介、章节候选和来源信息。
3. 后端返回预览，不立即入库。
4. 管理员检查书名、作者、分类、简介、章节标题和正文。
5. 管理员可以微调章节标题和正文。
6. 管理员点击确认入库，一次写入书籍和章节。

内容安全与版权边界：

- 默认保存来源 URL。
- URL 默认标记 `source_type=EXTERNAL`。
- TXT 默认标记 `source_type=FILE`。
- 对明显露骨、侵权风险高或解析失败的页面，只允许导入净化后的占位内容或拒绝导入。
- 导入结果需要人工确认。

第一版可以先支持：

- 单 URL 单章节导入。
- HTML 标题识别。
- TXT 文件上传。
- TXT 自动识别 UTF-8 / GB18030。
- TXT 按 `第 x 章`、`Chapter x` 等标题拆分多章节。
- 章节列表预览和正文手动编辑后确认入库。

后续再支持：

- EPUB 导入，读取目录、封面和元数据。
- Markdown 导入。
- 多章节目录抓取。
- 章节批量导入。
- 站点 Sitemap/RSS 导入。
- 授权内容源插件，支持按固定规则同步。
- 导入任务状态和失败重试。
- 内容审核状态。

### 8.8 后台部署方式

开发阶段：

```bash
cd admin-frontend
npm install
npm run dev
```

默认端口：

```text
admin-frontend: http://localhost:5176
backend:        http://localhost:8081
reader H5:      http://localhost:5175
```

生产阶段：

- `frontend/` 构建用户端 H5。
- `admin-frontend/` 构建 PC 后台。
- Nginx 分别托管：
  - `/`：用户端 H5
  - `/admin/`：PC 后台
  - `/api/`：反向代理后端

部署目录建议：

```text
deploy/nginx/
  nginx.conf

frontend/dist/build/h5         用户端
admin-frontend/dist            后台端
```

### 8.9 后台 MVP 开发顺序

1. 管理员账号初始化。
2. 初始化 `admin-frontend/`。
3. 管理员登录页。
4. PC 后台布局与菜单。
5. 书籍列表与搜索。
6. 书籍新增、编辑、删除。
7. 章节列表。
8. 章节新增、编辑、删除。
9. 分类列表与维护。
10. URL 导入预览。
11. TXT 上传、自动切章和预览。
12. 导入确认入库。
13. 后台首页统计。

后台 MVP 完成标准：

- 能用管理员账号登录后台。
- 能新增一本书并在用户端书城看到。
- 能新增章节并在阅读器打开。
- 能编辑已有章节正文。
- 能删除测试书籍。
- 能输入一个 URL，得到解析预览，并以人工确认方式入库一章。
- 能上传 TXT 文件，自动切分章节，预览后一次性入库。

## 9. 构建与运行

### 9.1 后端本地预览

建议保持和资产管家一致，`local` profile 可使用 H2 内存数据库或本机 PostgreSQL。为了最快预览，优先 H2；为了接近生产，使用 PostgreSQL。

Windows 环境可沿用指定 Maven：

```powershell
D:\tools\apache-maven-3.9.13\bin\mvn.cmd -s D:\tools\apache-maven-3.9.13\conf\settings.xml spring-boot:run -Dspring-boot.run.profiles=local
```

### 9.2 前端 H5

```bash
cd frontend
npm install
npm run dev:h5
npm run build:h5
npm run preview:h5
```

### 9.3 Android 测试包

项目使用 HBuilderX 云打包生成 Android 测试包。关键配置建议：

- HBuilderX 安装目录：`D:\tools\HBuilderX`
- App 名称：悦读
- 包名：`com.yourcompany.novelreader`
- `manifest.json` 保留 `vueVersion: "3"`
- Android 测试阶段允许明文 HTTP，用于访问局域网后端。

## 10. 部署设计

部署目录：

```text
deploy/
  docker-compose.yml
  nginx/nginx.conf
```

服务组成：

- PostgreSQL：业务数据存储。
- Redis：书籍、章节、推荐缓存。
- Backend：Spring Boot API 服务。
- Nginx：托管 H5 静态资源并代理 API。

生产环境要求：

- 使用强随机 `JWT_SECRET`。
- 数据库、Redis 密码通过环境变量提供。
- H5 构建产物由 Nginx 托管。
- API 统一通过 Nginx 反向代理，前端不硬编码生产后端地址。
- 章节内容需要定期备份，后续转对象存储时同步设计迁移脚本。

## 11. 迭代规划

### 11.1 第 0 阶段：工程骨架

- 初始化 `backend/`、`frontend/`、`deploy/`、`prompts/`、`README.md`。
- 后端复制资产管家的认证、统一响应、异常处理、Redis 容错、Flyway 结构。
- 前端复制资产管家的 uni-app Vue 3、Pinia、请求封装、H5 桌面居中容器。
- 跑通 H5 首页和后端健康接口。

### 11.2 第 1 阶段：阅读 MVP

- 登录注册。
- 书城列表。
- 完整推荐榜单。
- 分类列表。
- 书籍详情。
- 章节目录。
- 阅读器滚动阅读。
- 书架增删查。
- 阅读进度保存。
- H5 可预览，Android 可打测试包。

### 11.3 第 2 阶段：内容管理

- 管理员角色。
- 后台管理 UI。
- 书籍新增、编辑、删除接口。
- 章节新增、编辑、删除接口。
- 简单导入能力：支持 TXT 按章节标题拆分。
- URL 导入预览和人工确认入库。
- 导入中心：URL/TXT 预览、章节校对、确认入库。
- 封面 URL、简介、分类、连载状态维护。
- 缓存清理逻辑完善。

### 11.4 第 3 阶段：阅读体验

- 阅读主题、夜间模式、字体、行距。
- 分页阅读。
- 左右滑动翻页。
- 本地章节缓存。
- 断网阅读最近章节。
- 书架排序和最近阅读置顶。

### 11.5 第 4 阶段：发现与增长

- 搜索优化。
- 多维排行榜，如阅读量榜、更新榜、完结榜。
- 最近更新。
- 基于分类和阅读历史的简单推荐。
- 阅读时长统计。
- 新章节更新提醒。

### 11.6 第 5 阶段：生态能力

- 抽取统一用户中心或共享认证模板。
- 抽取前端通用 UI、请求、主题和登录状态处理。
- 抽取统一部署模板。
- 建立 `master-template` 分支，后续项目从模板创建。
- 统一 README、设计文档和 AI 协作提示词结构。

### 11.7 第 6 阶段：商业化与规模化

- 广告 SDK 接入。
- 激励视频解锁或福利机制。
- 评论与互动。
- TTS 听书。
- 章节正文迁移到 OSS + CDN。
- PostgreSQL 全文检索或 Elasticsearch。
- 读写分离、分区表、异步队列。

## 12. 当前边界

- 当前项目先按个人生态产品设计，不按大型免费网文平台设计。
- MVP 不处理版权采购、爬虫、广告结算和内容审核工作流。
- 后台第一版只服务个人维护内容，不做复杂 CMS 工作流。
- MVP 不强依赖 Redis，Redis 不可用时主流程应正常工作。
- MVP 章节正文先存在 PostgreSQL，后续访问量变大再迁移对象存储。
- MVP 阅读器先做稳定滚动阅读，不用 Canvas 仿真翻页阻塞进度。
- Android 包先用于测试，不作为应用市场上架包。

## 13. 原方案调整说明

原始方案方向完整，但对当前阶段偏重，主要问题是：

- 一开始规划百万级 DAU、广告变现、推荐算法和读写分离，超出 MVP 必要范围。
- 后端建议 Maven 多模块，但参考工程实际是单体分层，早拆会降低开发速度。
- 阅读器一开始就要求 Canvas 仿真翻页，风险高，容易拖慢主流程。
- 数据库与基础设施设计偏平台化，没有突出个人生态项目的统一模板诉求。

本版文档将目标调整为：先复用 `asset-manager` 已验证的结构，快速完成小说阅读闭环；再按阅读体验、内容管理、发现增长、生态抽象、商业化规模化的顺序迭代。
