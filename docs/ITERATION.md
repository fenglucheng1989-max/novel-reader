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

- 降低翻页提交阈值：PAGE_COMMIT_RATIO 0.08→0.06，BOUNDARY_COMMIT_RATIO 0.05→0.04。
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

## 当前文档状态

- `docs/design.md`：总体设计与前后端开发方案。
- `docs/novel-reader-iteration-plan.md`：后续迭代执行计划。
- `docs/reader-ui-reference-plan.md`：七猫截图 UI 参考分析。

## 当前问题

- 书籍详情页缺少评分、标签、阅读人数、收藏数、预计阅读时长。
- 书架缺少阅读数据卡、筛选、管理、列表/宫格切换。
- 后端缺少书籍统计、标签、阅读统计和推荐增强接口。
- 章节末承接页尚未实现。
- 更多设置（页边距、段间距、字体选择）尚未实现（Phase 2 范围）。

## 下一阶段建议

优先进入 Phase 2：书籍详情页升级。

具体任务：

- 重做详情页顶部（封面、书名、作者、状态、字数）。
- 增加三列数据（评分、阅读人数、收藏数）。
- 增加标签 chips。
- 增加预计阅读时长。
- 增加目录预览。
- 增加热门评论占位。
- 底部固定 CTA（加入书架、开始阅读）。
- 后端新增 book_stats 表和标签表，扩展详情 VO。

## 验证记录

- `frontend`: `npm run build:h5` 通过 (2026-05-08)。
- `backend`: `.\mvnw.cmd test` 通过 (2026-05-08)。
- H5 预览：`5175` 可局域网访问。
- 本地后端：`8082` 可用于小说服务验证。
