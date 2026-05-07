# novel-reader 迭代方案

> 对齐 asset-manager 的**基础设施**，为后续抽取公共架构做准备。只对齐骨架层，不动业务层。

---

## 对齐原则

**对齐的**：项目骨架、API 规范、认证机制、前端工具链、异常处理、工程配置、管理端骨架
**不对齐的**：username 登录保留（小说 app 不需要 email）、阅读器主题保留（3 套阅读场景主题足够，不需要 CSS 变量引擎）、理财 app 业务特性（数据导出/反馈/协议等）不搬运

---

## 迭代 1：前端工具链对齐

**改动量**：小（2 个文件新增，1 个文件修改）

### 1.1 抽取 API 配置

新建 `frontend/src/config/api.js`，从 request.js 中分离环境判断逻辑：

```js
// 参考 asset-manager frontend/src/config/api.js
export function getApiBaseUrl() {
  // #ifdef H5
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  // #endif
  // #ifdef APP-PLUS
  return 'http://192.168.101.12:8080'
  // #endif
}
```

### 1.2 增加 requestRaw

在 `utils/request.js` 中补齐 `requestRaw`，用于文件下载等非 JSON 响应场景（导入中心 TXT 预览可用）。

### 1.3 统一错误处理

`request.js` 对齐 asset-manager 的 `rejectWithMessage` 模式：
- 401 时清除 token 并跳转登录
- 错误消息从 `res.data.message` 提取
- 网络错误统一 toast

### 修改清单

| 文件 | 操作 |
|------|------|
| `frontend/src/config/api.js` | **新增** |
| `frontend/src/utils/request.js` | 修改（使用 getApiBaseUrl + 增加 requestRaw + 对齐错误处理） |

---

## 迭代 2：后端基础设施对齐

**改动量**：中（5-6 个文件修改）

### 2.1 GlobalExceptionHandler 补齐

对齐 asset-manager 捕获的异常类型，确保覆盖：`MethodArgumentNotValidException`（参数校验）、`HttpMessageNotReadableException`（JSON 解析失败）、`BadCredentialsException`（认证失败）。两个项目的 handler 结构已经很接近，主要是补齐遗漏的异常类型。

### 2.2 DTO 校验补齐

给所有接收用户输入的 DTO 补齐 `@Valid` 和校验注解（`@NotBlank`、`@NotNull` 等），目前 novel-reader 部分 DTO 缺少校验。

### 2.3 SecurityConfig 对齐

对比两项目的 `SecurityConfig`，确保：CORS 配置模式一致、公开路由声明方式一致、异常处理入口一致。

### 2.4 BaseUserController 对比确认

两项目 `BaseUserController` 结构已一致（仅查询字段不同：username vs email）。小说 app 保留 username 查询，无需修改。后续抽取公共模块时，将查询字段抽象为可配置项即可。

### 修改清单

| 文件 | 操作 |
|------|------|
| `exception/GlobalExceptionHandler.java` | 补齐异常类型覆盖 |
| `dto/AuthRegisterDTO.java` | 补齐 @NotBlank |
| `dto/AuthLoginDTO.java` | 补齐 @NotBlank |
| 其他 DTO | 按需补齐校验 |
| `security/SecurityConfig.java` | 对比对齐 |

---

## 迭代 3：工程化 & 管理端对齐

**改动量**：小（3-4 个文件新增/修改）

### 3.1 CLAUDE.md

创建 `CLAUDE.md`，对齐 asset-manager 格式：
- 构建 & 运行命令
- 架构概述（技术栈 + 分层说明）
- API 响应约定
- 前端 Store 说明
- 关键设计决策

### 3.2 ITERATION.md

创建 `docs/ITERATION.md`，记录已完成阶段和当前迭代。

### 3.3 .gitignore 对齐

对比两项目 `.gitignore`，补齐缺失项（确保 H2 数据文件、构建产物等忽略规则一致）。

### 3.4 AdminLayout 确认

检查 novel-reader 管理端的 `AdminLayout.vue`，确认是否已抽取为独立 layout 组件（与 asset-manager 模式一致）。如果不是，则抽取。

### 修改清单

| 文件 | 操作 |
|------|------|
| `CLAUDE.md` | **新增** |
| `docs/ITERATION.md` | **新增** |
| `.gitignore` | 修改（对齐） |
| `admin-frontend/src/layout/AdminLayout.vue` | 确认/抽取 |

---

## 迭代总结

| 迭代 | 内容 | 预计工作量 | 说明 |
|------|------|-----------|------|
| 1 | 前端工具链 | 0.5天 | config/api.js + requestRaw + 错误处理对齐 |
| 2 | 后端基础设施 | 1天 | 异常处理 + DTO 校验 + SecurityConfig 对齐 |
| 3 | 工程化补齐 | 0.5天 | CLAUDE.md + ITERATION.md + .gitignore + AdminLayout |

**总计约 2 天**。完成后两项目在基础设施层代码级一致。

---

## 完成后：公共基础设施抽取

3 个迭代完成后，可进行物理抽取：

```
common/
├── common-security/     # JWT + SecurityConfig + BaseUserController（查询字段注入）
├── common-web/          # ApiResponse + GlobalExceptionHandler + BusinessException
├── common-config/       # RedisConfig + MyBatisPlusMetaObjectHandler
├── common-frontend/     # request.js + requestRaw + storage.js + api config 模板
├── common-admin/        # AdminLayout + auth store + Axios 拦截器
└── common-deploy/       # Docker Compose + Nginx 模板
```

各项目特有代码（实体、业务 Service、业务 Controller、页面组件）保留在项目内，不进入公共模块。
