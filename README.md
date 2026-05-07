# 悦读 Novel Reader

面向个人内容管理的小说阅读工具。项目覆盖用户端阅读、书城/书架、阅读进度同步、后台内容维护、TXT/URL 导入，以及 H5 预览能力。

## 技术栈

- 后端：Spring Boot 3.2、H2/PostgreSQL、Redis、MyBatis-Plus、Flyway
- 用户端：uni-app Vue 3、Pinia、Canvas 阅读器
- 管理端：Vue 3、Vite、Pinia、Element Plus
- 部署：Docker、Docker Compose、Nginx

## 项目结构

```text
novel-reader/
  backend/         Spring Boot API 服务
  frontend/        uni-app 用户端
  admin-frontend/  PC 内容管理端
  deploy/          Docker Compose 与 Nginx 配置
  docs/            产品设计、迭代记录和测试说明
```

## 本地运行

后端：

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

用户端 H5：

```powershell
cd frontend
npm install
npm run dev:h5
```

管理端：

```powershell
cd admin-frontend
npm install
npm run dev
```

## 阅读器方案

阅读器保留两种模式：

- 滚动：稳定的长文本纵向阅读，适合作为兜底体验。
- Canvas：使用 Canvas 绘制分页内容、目标页和折页阴影，通过点击/滑动完成仿真翻页。

Canvas 模式的正文不再依赖 DOM 文本节点排版，而是先通过 `frontend/src/utils/page-engine.js` 分页，再由 `frontend/src/pages/reader/page-reader.vue` 绘制，阅读进度以页码保存。

## 验证

```powershell
cd frontend
npm run build:h5

cd ..\backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

本地端口被其他项目占用时，可以临时指定后端端口，例如：

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local" "-Dspring-boot.run.arguments=--server.port=8082"
```
