# 悦读 Novel Reader

个人小说阅读工具。MVP 覆盖登录注册、书城推荐、分类、书籍详情、章节阅读、书架和阅读进度同步。

## 技术栈

- 后端：Spring Boot 3.2、PostgreSQL、Redis、MyBatis-Plus、Flyway。
- 前端：uni-app Vue 3、Pinia。
- 部署：Docker、Docker Compose、Nginx。

## 项目结构

```text
novel-reader/
  docs/       产品设计与实现说明
  prompts/    AI 协作提示词
  backend/    Spring Boot 后端
  frontend/   uni-app 前端
  deploy/     Docker 部署配置
```

## 本地运行

后端：

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

前端 H5：

```bash
cd frontend
npm install
npm run dev:h5
```

完整产品与技术设计见 `docs/design.md`。
