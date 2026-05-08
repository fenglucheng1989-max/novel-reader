# 开发迭代记录

更新时间：2026-05-08

## 已完成

### 阶段 0：项目骨架

- 搭建 Spring Boot 3.2 后端。
- 搭建 uni-app Vue 3 用户端。
- 搭建 Vue 3 管理端。
- 完成基础目录结构、请求封装、状态管理和本地运行脚本。

### 阶段 1：基础业务闭环

- 用户注册、登录、JWT 会话。
- 书城列表、推荐、排行。
- 分类列表。
- 书籍详情。
- 章节目录。
- 章节正文。
- 书架增删查。
- 阅读进度保存和恢复。
- 阅读历史。
- 阅读偏好保存。

### 阶段 2：内容管理

- 管理端支持书籍维护。
- 管理端支持章节维护。
- 管理端支持分类维护。
- 导入中心支持 URL 预览。
- 导入中心支持 TXT 解析。
- 导入中心支持章节切分和确认入库。

### 阶段 3：工程基础设施

- 前端抽取 API 配置。
- 前端请求封装支持 JSON 和原始响应。
- 后端补齐统一异常处理。
- 后端补齐 DTO 校验。
- 管理端请求拦截器和鉴权 store 对齐。
- 本地 H5 预览支持指定后端代理。

### 阶段 4：Canvas 分页阅读器

- 新增 `frontend/src/utils/page-engine.js` 分页引擎。
- 新增 Canvas 分页阅读器。
- 支持点击左右区域翻页。
- 支持手机触摸滑动翻页。
- 支持 H5 原生 canvas 渲染，避免 uni-canvas 包装导致字体异常。
- 支持章节内翻页页码保存。
- 支持上一章跳到末页。
- 支持下一章跳到首页。
- 增加测试长篇书籍数据。

### 阶段 5：跨章节预加载

- 前端 store 增加章节内存缓存。
- 章节正文缓存优先从内存和本地读取。
- 当前章节加载后自动预加载上一章和下一章。
- Canvas 在章节边界翻页时绘制下一章第一页或上一章末页。
- 降低跨章节切换的刷新感。

### Phase 1：阅读器体验升级 (2026-05-08)

**前端组件化**

- 抽离 `ReaderTopBar.vue`：顶部工具层（返回、标题、加入书架、设置）。
- 抽离 `ReaderBottomBar.vue`：底部工具层（上/下一章、进度条、目录/讨论/夜间/设置快捷栏）。
- 抽离 `ReaderSettingSheet.vue`：底部抽屉设置面板。
- reader.vue 集成重构：移除旧 inline 工具层和浮动设置面板。

**阅读设置底部抽屉**

- 亮度滑杆（CSS filter 模拟，本地状态不同步后端）。
- 字号 A-/A+ 三段控件。
- 行距 +/- 控件。
- 翻页方式分段控件（滚动 / Canvas）。
- 主题色块（米白 / 清绿 / 夜间，夜间=快捷切换）。
- 自动翻页开关 + 间隔选择（10/15/20/30/60 秒）。
- 更多设置入口（二期占位）。

**夜间模式快捷开关**

- ReaderBottomBar 底部快捷栏夜间按钮一键切换。
- ReaderSettingSheet 主题色块同步高亮。

**自动翻页**

- 定时器驱动，按设定间隔自动翻页。
- Canvas 模式章节末自动触发下一章。
- 打开设置面板时暂停自动翻页。
- 手动翻页后自动重启定时器。

**滑动优化**

- 降低翻页提交阈值：PAGE_COMMIT_RATIO 0.08->0.06，BOUNDARY_COMMIT_RATIO 0.05->0.04。
- 提高手机端滑动灵敏度。

**后端扩展**

- Flyway V4 migration：新增 margin_x、margin_y、paragraph_spacing、auto_page_enabled、auto_page_interval。
- NovelReaderSetting 实体扩展 5 个字段。
- ReaderSettingDTO 扩展 5 个字段。
- ReadingServiceImpl 兼容新字段保存和默认值。
- GET/PUT /api/v1/reading/setting 保持向后兼容。

**Store 扩展**

- defaultSetting 新增 marginX、marginY、paragraphSpacing、autoPageEnabled、autoPageInterval。
- loadSetting 从后端同步新字段。
- saveSetting/updateLocalSetting 已通过 spread 自动兼容。

### Phase 2：书籍详情页升级 (2026-05-08)

**后端**

- Flyway V5 migration：新增 `novel_book_stats`（评分/阅读数/收藏数/浏览数）和 `novel_book_tag`（标签）表。
- 新增 `NovelBookStats`、`NovelBookTag` 实体和 Mapper。
- `BookDetailVO` 扩展：rating、ratingCount、readingCount、favoriteCount、tags、estimatedReadingMinutes。
- `BookServiceImpl.detail()` 聚合 stats 和 tags。
- 新增推荐接口：`GET /api/v1/books/{id}/recommendations?limit=6`（同分类推荐）。
- `BookController` 新增 `/books/{id}/recommendations` 端点。

**前端**

- 重做 `detail.vue`：
  - Hero 区：封面占位、书名、作者、状态徽标、字数、分类。
  - 数据三列：评分、阅读人数、收藏数。
  - 标签 chips + 预计阅读时长。
  - 简介（折叠展开）。
  - 目录预览（前 10 章 + 查看全部入口）。
  - 热门评论占位。
  - 相似推荐（同分类书籍，可点击进入详情）。
  - 底部固定 CTA：加入书架 / 开始阅读。

**后端**

- Flyway V6 migration：为已有书籍填充统计和标签测试数据。

**前端**

- Book store 新增 `loadRecommendations` 方法。
- 详情页相似推荐从占位文字替换为真实推荐卡片（封面、书名、作者、章节数、状态，可点击进入详情）。

### Phase 3：书架升级 (2026-05-08)

**前端**

- 书架顶部统计卡：今日分钟、连续天数、有更新、总藏书。
- 继续阅读卡片：基于 latestBookId 展示最近阅读入口。
- 列表/宫格视图切换，偏好持久化。
- 筛选：全部、有更新、在读、未读、完结。
- 管理模式：置顶/取消置顶、单本移出。
- 管理模式：全选/取消全选、批量移出。

**后端**

- Flyway V7 migration：新增 pinned、last_read_at 字段（sort_order 已存在）。
- GET /api/v1/bookshelf/stats：统计数据（阅读分钟/连续天数/更新数/最近阅读）。
- PUT /api/v1/bookshelf/{bookId}/pin、DELETE /api/v1/bookshelf/{bookId}/pin：置顶/取消置顶。
- PUT /api/v1/bookshelf/sort：排序（按 bookIds 顺序更新 sort_order）。

### Phase 4：书城与分类 (2026-05-08)

**后端**

- MyBatis-Plus 分页插件配置（MyBatisPlusConfig）。
- 通用分页响应 PageResult、复合筛选 DTO BookFilterDTO。
- GET /api/v1/books/filter：支持 categoryId、status、minWordCount、maxWordCount、keyword、sortBy（latest/wordCount/chapterCount）、page、pageSize 复合筛选。
- GET /api/v1/books/featured：编辑精选/Banner 数据源（按更新时间排序）。

**前端共享组件**

- BookCover.vue：渐变色封面占位，支持 sm/md/lg/xl 尺寸。
- SectionHead.vue：区块标题 + 右侧操作入口。
- BookCardHorizontal.vue：横排书卡，支持排名/状态/最新章节显示。

**书城首页（index.vue）重做**

- Banner 轮播（swiper，featured 前 3 本）。
- 编辑精选（featured 大卡片）。
- 热门榜（filter sortBy=chapterCount，排行网格）。
- 新书榜（filter sortBy=latest，横排列表）。
- 完结榜（filter status=COMPLETED，横排列表）。
- 4 个数据源并行加载，频道 Tab 切换联动。

**榜单页（rank.vue）重做**

- 4 个榜单 Tab：推荐榜/热门榜/新书榜/完结榜。
- 支持从首页传入榜单类型和分类参数。

**分类页（category.vue）重做**

- 标签选择后当前页展示筛选结果（不再跳转搜索）。
- 筛选工具栏：状态（全部/连载/完结）、排序（最新/最多字数/最多章节）。
- 结果列表 + 加载更多分页。
- 活跃筛选标签展示。

### Phase 5：章节末承接与轻社区 (2026-05-08)

**后端评论基础设施**

- Flyway V8 migration：新增 `novel_comment` 表 + 索引 + 种子评论数据。
- 新增 `NovelComment` 实体、`CommentMapper`、`CommentDTO`、`CommentVO`。
- 新增 `CommentService` / `CommentServiceImpl`：分页查询评论，批量查用户名避免 N+1。
- 新增 `CommentController`：GET 书籍/章节评论（公开），POST 创建评论（需登录）。
- SecurityConfig 开放 `/api/v1/chapters/**` 公开访问。

**章节末承接面板**

- 新增 `ChapterEndPanel.vue`，支持 inline（滚动）和 overlay（Canvas）两种模式。
- 普通章节末：进度小卡 + 下一章按钮 + 相似推荐 + 评论。
- 最后一章末：全本已完结 + 返回详情 + 推荐下一本 + 评论。
- 组件内部自加载详情、推荐、评论数据。

**阅读器集成**

- page-reader.vue：新增 `chapterEnd` emit，Canvas 末页向前翻页触发 chapterEnd 替代直接 next。
- reader.vue：滚动模式章节末尾 inline 面板，Canvas 模式 overlay 面板。
- ReaderBottomBar：首章"上一章"禁用态，末章"下一章"禁用态。
- ReaderSettingSheet：增加"评论弹幕"开关（showComments）。

**详情页评论**

- 替换"评论功能即将上线"占位为真实评论列表。
- 评论卡片：头像圆 + 用户名 + 相对时间 + 内容 + 点赞数。

**Store 扩展**

- book.js 新增 `loadBookComments`、`loadChapterComments`。
- reader.js `defaultSetting` 新增 `showComments: false`。

## 当前文档状态

- `docs/design.md`：总体设计与前后端开发方案。
- `docs/novel-reader-iteration-plan.md`：后续迭代执行计划。
- `docs/reader-ui-reference-plan.md`：七猫截图 UI 参考分析。

## 当前问题

- 管理端不支持标签和统计编辑。

## 下一阶段建议

优先进入 Phase 6：搜索优化与阅读统计。

## 验证记录

- `frontend`: `npm run build:h5` 通过 (2026-05-08, Phase 5)。
- `backend`: `.\mvnw.cmd test` 通过 (2026-05-08, Phase 5)。
