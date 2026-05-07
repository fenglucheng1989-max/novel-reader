# 悦读 Novel Reader 总体设计与开发方案

版本：2.0

更新时间：2026-05-07

参考素材：`D:\工程\阅读\` 七猫小说 App 截图、当前 `novel-reader` 前后端实现。

## 1. 产品定位

悦读是一个面向移动端的小说阅读产品，核心目标不是做重广告、重活动的网文平台，而是做一个干净、沉浸、可长期使用的私人小说阅读器。

产品关键词：

- 沉浸阅读
- 仿真翻页
- 书架管理
- 书城发现
- 详情判断
- 章节承接
- 多端同步
- 后台内容管理

与七猫等成熟产品相比，本项目借鉴其成熟信息架构和阅读交互，但保持更克制的商业化和运营入口。

## 2. 核心体验原则

1. 阅读器优先  
   小说产品的核心体验是读正文。阅读页必须比书城、活动、推荐更重要。

2. 跨章节要连续  
   用户在章节边界翻页时，不应感知接口请求、内容刷新、页面重排。前端需要预加载和预排版相邻章节。

3. 设置要专业但不复杂  
   字号、行距、主题、翻页方式、亮度、夜间模式必须直接可调；更细的字体、页边距、段间距放到二级设置。

4. 书架服务继续阅读  
   书架不是单纯书籍列表，而是用户回到阅读状态的入口。

5. 详情页服务读前判断  
   详情页要让用户快速判断是否值得读，而不仅是展示简介和目录。

6. 章节末服务连续阅读与发现  
   章节末不能突兀空白，应承接下一章、书籍详情和相似推荐。

## 3. 竞品截图结论

从 `D:\工程\阅读\` 截图观察，七猫小说的关键设计包括：

- 阅读页使用暖黄色纸张背景，降低疲劳。
- 阅读正文默认字号大、行距宽，适合手机阅读。
- 点击正文后出现顶部和底部工具层。
- 阅读设置面板是底部抽屉，包含亮度、字号、背景、翻页方式、自动翻页。
- 书架顶部展示阅读统计、签到等轻量激励。
- 书架支持宫格、筛选、管理。
- 书城通过搜索、频道、Banner、榜单和推荐流促进发现。
- 分类页支持题材、状态、字数、角色等复合筛选。
- 详情页突出封面、评分、阅读人数、票数、标签、简介、热门评价。
- 阅读正文中存在评论气泡、打卡、听书入口等社区/扩展能力。

本项目应优先借鉴阅读器、书架、详情页、章节末承接，不优先复制广告、金币、强活动体系。

## 4. 信息架构

用户端一级导航建议：

- 书架
- 书城
- 福利或发现
- 分类
- 我的

当前项目已有：

- 书城：首页推荐、排行、分类入口
- 书架：用户书架
- 阅读器：滚动阅读和 Canvas 分页阅读
- 书籍详情
- 我的：登录、阅读偏好

建议调整后的页面结构：

```text
frontend/src/pages/
  index/index.vue              书城首页
  bookshelf/bookshelf.vue      书架
  category/category.vue        分类
  rank/rank.vue                榜单
  book/detail.vue              书籍详情
  reader/reader.vue            阅读器容器
  reader/page-reader.vue       Canvas 分页阅读器
  search/search.vue            搜索
  mine/mine.vue                我的
```

阅读器内部组件建议逐步拆分：

```text
frontend/src/pages/reader/
  reader.vue                   阅读器容器，负责章节、进度、设置、跨章
  page-reader.vue              Canvas 绘制与翻页手势
  components/
    ReaderTopBar.vue           阅读页顶部工具层
    ReaderBottomBar.vue        阅读页底部工具层
    ReaderSettingSheet.vue     阅读设置底部抽屉
    ReaderProgressBar.vue      章节进度条
    ChapterEndPanel.vue        章节末承接
```

## 5. 前端设计方案

### 5.1 阅读器

阅读器支持两种模式：

- 滚动模式：稳定兜底，适合长文本和兼容性问题。
- Canvas 分页模式：主推体验，支持仿真翻页。

Canvas 分页能力：

- 根据屏幕宽高、字号、行距、页边距计算分页。
- 当前章节、上一章、下一章都可预排版。
- 点击左侧/右侧区域翻页。
- 横向滑动翻页。
- 章节内翻页无接口请求。
- 跨章节先完成翻页动画，再切换章节状态。
- 跨章节背面绘制下一章第一页或上一章末页，减少刷新感。

阅读页默认状态：

- 无卡片容器。
- 背景铺满全屏。
- 正文从安全区下方开始。
- 底部显示时间、电量、章节进度或阅读百分比。
- 中间点击唤出工具层。

工具层状态：

- 顶部：返回、标题、加入书架、听书占位、更多。
- 底部：上一章、进度条、下一章。
- 底部快捷栏：目录、讨论占位、夜间、阅读设置。

阅读设置底部抽屉：

- 亮度滑杆。
- 字号 A- / 当前字号 / A+。
- 字体与行距入口。
- 背景主题色块。
- 翻页方式：覆盖、上下、仿真、平滑、无。
- 自动翻页。
- 更多设置。

一期必须完成：

- 字号
- 行距
- 主题
- 翻页方式
- 夜间模式
- 跨章节预加载
- 手机滑动灵敏度

二期增强：

- 字体选择
- 页边距
- 段间距
- 护眼强度
- 评论气泡开关
- 自动翻页速度

### 5.2 书架

书架目标是让用户快速回到阅读。

顶部结构：

- 书架 / 历史
- 搜索
- 管理

阅读数据卡：

- 今日阅读分钟
- 连续阅读天数
- 最近阅读
- 有更新数量

列表项字段：

- 封面
- 书名
- 作者
- 当前进度
- 最新章节
- 更新状态
- 继续阅读
- 更多操作

管理能力：

- 列表/宫格切换
- 筛选：全部、更新、完结、最近阅读
- 管理模式：移出书架、置顶、批量操作

前端状态：

- `bookStore.bookshelf`
- `bookStore.latestReading`
- `bookStore.bookshelfViewMode`
- `bookStore.bookshelfFilter`

### 5.3 书城

书城目标是发现新书，不压过阅读体验。

首页模块：

- 搜索框
- 频道 Tab：推荐、男频、女频、完结、新书
- Banner
- 编辑精选
- 热门榜
- 新书榜
- 完结榜
- 最近更新

推荐卡片：

- 封面
- 书名
- 作者
- 标签
- 简介摘要
- 热度或评分

### 5.4 分类与榜单

分类筛选：

- 性别向：男频、女频、不限
- 题材：玄幻、都市、悬疑、历史、科幻、仙侠、青春等
- 状态：连载、完结
- 字数：30万以下、30-100万、100万以上
- 排序：热门、最新、评分、字数

榜单：

- 热门榜
- 新书榜
- 完结榜
- 更新榜
- 评分榜

### 5.5 书籍详情

详情页目标是帮助用户判断是否开始阅读。

页面结构：

- 顶部返回、加入书架、听书占位。
- 封面、书名、作者、状态、字数。
- 三列数据：评分、阅读人数、收藏数。
- 标签 chips。
- 简介。
- 目录预览。
- 热门评论。
- 相似推荐。
- 底部固定 CTA：加入书架 / 开始阅读。

特色能力：

- 预计阅读时长。
- 章节长度分布。
- 最近更新时间。

### 5.6 章节末承接

普通章节末：

- 下一章按钮。
- 本章阅读完成提示。
- 当前书小卡。
- 相似推荐。

最后一章：

- 完结提示。
- 返回详情。
- 评分/评论入口。
- 推荐下一本。

## 6. 后端设计方案

### 6.1 当前后端能力

当前项目已有：

- 用户注册、登录、JWT。
- 书籍列表、推荐、排行。
- 分类。
- 搜索。
- 书籍详情。
- 章节目录。
- 章节正文。
- 书架增删查。
- 阅读进度保存。
- 阅读历史。
- 阅读设置。
- 管理端书籍、章节、分类维护。
- 导入预览、TXT 解析、确认入库。

这些能力可以支撑阅读器一期和基础书架/书城。

### 6.2 需要补齐的后端能力

为支撑完整产品体验，建议补齐：

#### 书籍详情增强

新增字段或聚合 VO：

- `rating`：评分。
- `ratingCount`：评分人数。
- `readingCount`：正在阅读人数。
- `favoriteCount`：收藏数。
- `tags`：标签。
- `estimatedReadingMinutes`：预计阅读时长。
- `lastUpdatedAt`：最近更新时间。

建议接口：

```text
GET /api/v1/books/{id}/detail
```

也可以兼容现有 `GET /api/v1/books/{id}`，直接扩展返回结构。

#### 推荐能力

建议接口：

```text
GET /api/v1/books/{id}/recommendations?limit=6
GET /api/v1/books/featured?channel=&limit=
GET /api/v1/books/latest?limit=
GET /api/v1/books/completed?limit=
```

初期实现可以基于同分类、排序、更新时间，不做复杂算法。

#### 分类筛选

建议接口：

```text
GET /api/v1/books/filter?categoryId=&status=&minWords=&maxWords=&sort=
```

排序枚举：

- `hot`
- `latest`
- `rating`
- `wordCount`

#### 书架管理增强

建议接口：

```text
PUT /api/v1/bookshelf/{bookId}/pin
DELETE /api/v1/bookshelf/{bookId}/pin
PUT /api/v1/bookshelf/sort
GET /api/v1/bookshelf/stats
```

`bookshelf/stats` 返回：

- 今日阅读分钟。
- 连续阅读天数。
- 最近阅读书籍。
- 更新数量。

#### 阅读统计

建议新增：

```text
PUT /api/v1/reading/session
GET /api/v1/reading/stats
```

阅读会话字段：

- `bookId`
- `chapterId`
- `durationSeconds`
- `startedAt`
- `endedAt`

#### 评论与轻社区

二期再做，不进入第一阶段主线。

建议接口：

```text
GET /api/v1/books/{bookId}/comments
POST /api/v1/books/{bookId}/comments
GET /api/v1/chapters/{chapterId}/comments
POST /api/v1/chapters/{chapterId}/comments
```

### 6.3 数据库设计调整

当前已有核心表：

- `app_user`
- `novel_category`
- `novel_book`
- `novel_chapter`
- `novel_bookshelf`
- `novel_reading_progress`
- `novel_reading_history`
- `novel_reader_setting`

建议新增或扩展：

#### `novel_book` 扩展字段

```sql
ALTER TABLE novel_book ADD COLUMN rating NUMERIC(3,1) DEFAULT 0;
ALTER TABLE novel_book ADD COLUMN rating_count INT DEFAULT 0;
ALTER TABLE novel_book ADD COLUMN reading_count INT DEFAULT 0;
ALTER TABLE novel_book ADD COLUMN favorite_count INT DEFAULT 0;
ALTER TABLE novel_book ADD COLUMN tags VARCHAR(500);
ALTER TABLE novel_book ADD COLUMN last_chapter_updated_at TIMESTAMP;
```

如果不想扩大 `novel_book`，可以新增 `novel_book_stats`。

#### `novel_book_stats`

```sql
CREATE TABLE novel_book_stats (
    book_id BIGINT PRIMARY KEY,
    rating NUMERIC(3,1) DEFAULT 0,
    rating_count INT DEFAULT 0,
    reading_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `novel_book_tag`

```sql
CREATE TABLE novel_book_tag (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0,
    UNIQUE(book_id, tag)
);
```

#### `novel_reading_session`

```sql
CREATE TABLE novel_reading_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_id BIGINT,
    duration_seconds INT DEFAULT 0,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `novel_comment`

二期新增。

```sql
CREATE TABLE novel_comment (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_id BIGINT,
    content VARCHAR(1000) NOT NULL,
    like_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.4 缓存策略

后端 Redis：

- 书籍详情：`novel:book:{bookId}`，30 分钟。
- 章节目录：`novel:chapters:{bookId}`，30 分钟。
- 章节正文：`novel:chapter:{bookId}:{chapterNo}`，2 小时。
- 首页推荐：`novel:featured:{channel}`，10 分钟。

前端缓存：

- 当前章节、上一章、下一章放 Pinia 内存缓存。
- 已读章节写入本地 storage。
- 阅读设置写入本地 storage，并登录后同步后端。
- 跨章节翻页只预加载前后一章，避免请求过量。

## 7. 接口清单

### 7.1 用户认证

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
```

### 7.2 书籍与书城

```text
GET /api/v1/books
GET /api/v1/books/recommend
GET /api/v1/books/rank
GET /api/v1/books/{id}
GET /api/v1/books/{id}/detail
GET /api/v1/books/{id}/chapters
GET /api/v1/books/{id}/chapters/{chapterNo}
GET /api/v1/books/{id}/recommendations
GET /api/v1/books/featured
GET /api/v1/books/latest
GET /api/v1/books/completed
GET /api/v1/books/filter
GET /api/v1/categories
GET /api/v1/search/books
```

### 7.3 书架

```text
GET /api/v1/bookshelf
POST /api/v1/bookshelf/{bookId}
DELETE /api/v1/bookshelf/{bookId}
PUT /api/v1/bookshelf/{bookId}/pin
DELETE /api/v1/bookshelf/{bookId}/pin
PUT /api/v1/bookshelf/sort
GET /api/v1/bookshelf/stats
```

### 7.4 阅读

```text
GET /api/v1/reading/progress/{bookId}
PUT /api/v1/reading/progress/{bookId}
GET /api/v1/reading/history
GET /api/v1/reading/setting
PUT /api/v1/reading/setting
PUT /api/v1/reading/session
GET /api/v1/reading/stats
```

### 7.5 管理端

```text
GET /api/v1/admin/dashboard
GET /api/v1/admin/books
GET /api/v1/admin/books/{id}
POST /api/v1/admin/books
PUT /api/v1/admin/books/{id}
DELETE /api/v1/admin/books/{id}
GET /api/v1/admin/books/{id}/chapters
POST /api/v1/admin/books/{id}/chapters
PUT /api/v1/admin/chapters/{id}
DELETE /api/v1/admin/chapters/{id}
GET /api/v1/admin/categories
POST /api/v1/admin/categories
PUT /api/v1/admin/categories/{id}
DELETE /api/v1/admin/categories/{id}
POST /api/v1/admin/import/preview
POST /api/v1/admin/import/txt/preview
POST /api/v1/admin/import/confirm
```

## 8. 前端开发计划

### 阶段 A：阅读器重构

目标：将阅读器体验打磨为项目核心优势。

任务：

- 抽离 `ReaderSettingSheet`。
- 抽离 `ReaderTopBar` 和 `ReaderBottomBar`。
- 优化 Canvas 翻页动画和触摸手势。
- 完善跨章节预加载和预排版。
- 增加章节进度条。
- 增加夜间模式快捷开关。
- 增加自动翻页基础能力。

验收：

- 手机点击翻页流畅。
- 手机滑动翻页灵敏。
- 跨章节无明显刷新跳动。
- 字号、行距、主题切换后分页正确。
- 工具层不遮挡正文核心区域。

### 阶段 B：书籍详情页升级

任务：

- 新详情页顶部视觉。
- 增加评分、阅读人数、收藏数。
- 增加标签。
- 增加预计阅读时长。
- 增加目录预览。
- 增加热门评论占位。
- 底部固定 CTA。

验收：

- 用户能在 5 秒内判断书籍是否值得读。
- 开始阅读和加入书架路径清晰。

### 阶段 C：书架升级

任务：

- 增加书架阅读数据卡。
- 改造书架列表。
- 增加筛选和管理模式。
- 增加列表/宫格切换。

验收：

- 最近阅读一眼可见。
- 更新状态明确。
- 可批量管理书架。

### 阶段 D：书城与分类

任务：

- 书城首页模块化。
- 增加频道 Tab。
- 增加榜单模块。
- 增加分类筛选页。

验收：

- 可以按分类、状态、字数、排序找书。
- 书城到详情到阅读链路顺畅。

### 阶段 E：章节末承接与轻社区

任务：

- 章节末面板。
- 相似推荐。
- 评论展示。
- 评论气泡开关。

验收：

- 章节末不突兀。
- 最后一章有完结承接。
- 评论能力不影响阅读性能。

## 9. 后端开发计划

### 阶段 A：支撑阅读器和书架

任务：

- 完善阅读设置字段。
- 增加阅读统计接口。
- 增加书架统计接口。
- 优化章节正文缓存。

验收：

- 阅读器设置能跨端同步。
- 书架能展示今日阅读和连续阅读。

### 阶段 B：支撑详情页

任务：

- 增加书籍统计表或扩展字段。
- 增加标签表。
- 扩展书籍详情 VO。
- 增加相似推荐接口。

验收：

- 详情页可展示评分、阅读人数、收藏数、标签、预计阅读时长。

### 阶段 C：支撑分类与推荐

任务：

- 增加筛选接口。
- 增加 featured/latest/completed 接口。
- 管理端支持标签和推荐排序。

验收：

- 前端分类筛选不需要本地硬算。
- 书城模块有稳定数据来源。

### 阶段 D：轻社区

任务：

- 评论表。
- 评论查询和发布接口。
- 管理端评论审核。

验收：

- 书籍评论和章节评论可展示。
- 评论可被关闭或审核。

## 10. 优先级

第一优先级：

- 阅读器设置抽屉
- 跨章节预加载翻页
- 手机滑动体验
- 章节进度条

第二优先级：

- 书籍详情页升级
- 书架数据卡
- 书架管理

第三优先级：

- 书城模块化
- 分类筛选
- 榜单

第四优先级：

- 评论
- 打卡
- 听书
- 高级推荐

## 11. 风险

- Canvas 翻页与 DOM 工具层事件冲突。
- 手机浏览器缓存导致验证旧包。
- 章节预加载请求过多。
- 字号、行距、页边距变化引发频繁重新分页。
- 评论气泡需要和分页引擎联动，复杂度较高。
- 后端统计字段如果直接写入 `novel_book`，后续扩展可能不如独立 stats 表灵活。

## 12. 当前状态

已完成：

- Spring Boot 后端基础能力。
- uni-app 用户端。
- Vue 管理端。
- 用户注册登录。
- 书城、书架、详情、阅读基础链路。
- 阅读设置保存。
- Canvas 分页阅读。
- Canvas 点击/滑动翻页。
- 跨章节预加载和背面绘制。
- 本地测试长章节数据。

下一步建议：

1. 阅读器设置底部抽屉重构。
2. 阅读器顶部/底部工具层重构。
3. 章节进度条和自动翻页。
4. 书籍详情页升级。
5. 后端补齐书籍统计和标签。

