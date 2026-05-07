# 开发迭代记录

## 已完成

### 阶段 0：MVP 骨架

- 搭建 Spring Boot 3.2 后端、uni-app Vue 3 用户端、Vue 3 管理端。
- 完成用户注册、登录、JWT 会话、书城、书架和基础阅读接口。

### 阶段 1：阅读 MVP

- 完成滚动式阅读器。
- 支持字号、行距、主题、本地章节缓存、阅读进度保存/恢复。

### 阶段 2：内容管理

- 管理端支持书籍、章节、分类维护。
- 导入中心支持 URL 预览、TXT 解析、章节切分和确认入库。

### 阶段 3：基础设施对齐

- 前端抽取 API 配置和请求封装。
- 后端补齐统一异常、DTO 校验和 JSON 鉴权失败响应。
- 管理端请求拦截器、鉴权 store 和工程文档对齐。

### 阶段 4：Canvas 仿真翻页

- 将分页阅读器从 DOM 横移改为 Canvas 绘制。
- Canvas 模式绘制当前页、目标页、折页高光和阴影，支持点击左右区域翻页、滑动拖拽翻页、章节边界切换。
- 分页模式下阅读进度保存页码，滚动模式继续保存滚动位置。
- 修复 H5 下 uni-app `canvas` 包装节点导致 `getContext` 不存在的问题。
- 修复 `V3__test_data_paging.sql` 测试数据列数不匹配，确保本地 Flyway 迁移可以启动。

## 本轮发现的问题

- 文档存在乱码，影响新人阅读和后续交付说明。
- 旧分页阅读器不是真正 Canvas 翻页，只是 DOM 页面横向移动。
- 阅读器调试日志残留在核心交互路径中。
- 分页模式没有把页码写入 `position`，会导致进度恢复不准确。
- `V3__test_data_paging.sql` 章节插入语句多出一列，`spring-boot:run` 时 Flyway 迁移失败。
- 本地 8080 端口可能被其他项目占用，前端代理会误连到错误后端。

## 当前最终方案

- 保留滚动阅读作为稳定兜底。
- 将“仿真”模式明确为 Canvas 模式，由 `page-engine.js` 负责分页，由 `page-reader.vue` 负责绘制和手势。
- 后端不新增接口，继续沿用章节内容、阅读设置和进度保存 API。
- 本地验证优先使用独立端口，避免和其他项目串服务。

## 验证记录

- `frontend`: `npm run build:h5` 通过。
- `backend`: `.\mvnw.cmd test` 通过，当前仓库没有后端测试用例。
- `backend`: `spring-boot:run -Dspring-boot.run.profiles=local -Dspring-boot.run.arguments=--server.port=8082` 可启动，Flyway V3 已通过。
- `browser`: 打开 `http://127.0.0.1:4174/#/pages/reader/reader?bookId=6&chapterNo=1`，Canvas 节点存在，页面显示 `1 / 4 页`，点击右侧后正文切换到下一页。

## 后续建议

- 为 Flyway 迁移增加一个最小启动测试，避免 `mvn test` 没有覆盖数据库迁移。
- 给 Canvas 翻页补一组端到端测试：模式切换、页内翻页、跨章翻页、返回上一章末页。
- 清理或重写 `docs/design.md` 等仍有乱码的长文档。
