# 高考志愿填报助手

本地运行的前端志愿填报系统，已接入**全国高校招生数据 API**。

技术栈：React 19 · TypeScript · Vite 7

---

## 一、需要安装的软件

| 软件 | 用途 | 下载地址 |
|------|------|----------|
| **Node.js LTS（20 或 22）** | 运行前端项目 | https://nodejs.org/ |
| **Git（可选）** | 版本管理 | https://git-scm.com/download/win |
| **VS Code / Cursor（推荐）** | 编辑代码 | 你已在使用 Cursor |
| **Chrome / Edge** | 预览页面 | 系统自带 |

> 不需要 Docker、不需要 WSL、不需要后端服务器。纯前端 + 第三方 API 即可本地运行。

---

## 二、软件安装详细步骤

### 步骤 1：安装 Node.js

1. 打开 https://nodejs.org/
2. 下载 **LTS** 版本（左侧绿色按钮，例如 22.x）
3. 双击安装包，一路 **Next**
4. 勾选 **Automatically install necessary tools**（可选）
5. 安装完成后，打开 **PowerShell**，验证：

```powershell
node -v
npm -v
```

应分别显示版本号，例如 `v22.x.x` 和 `10.x.x`。

### 步骤 2：进入项目目录

```powershell
cd D:\Projects\gaokao-volunteer
```

### 步骤 3：安装项目依赖

```powershell
npm install
```

首次安装约 1～3 分钟，取决于网络。

### 步骤 4：配置 API（可选）

复制环境变量模板：

```powershell
copy .env.example .env
```

- **不配置 appkey**：自动使用咕咕数据 **Demo 演示接口**，可免费体验
- **配置正式 appkey**：在 `.env` 中填写：

```env
VITE_GUGUDATA_APPKEY=你的密钥
VITE_GAOKAO_YEAR=2026
```

正式密钥申请：https://www.gugudata.com/portal/

### 步骤 5：启动本地开发服务器

```powershell
npm run dev
```

终端会显示类似：

```text
  ➜  Local:   http://localhost:5173/
```

浏览器打开该地址即可使用。

---

## 三、关于「全国高校 API」的重要说明

**教育部阳光高考平台没有对个人开发者开放统一 API。**  
全国 3000+ 所高校的招生计划、录取分数线等数据，通常来自以下渠道：

| 数据源 | 说明 | 本项目用法 |
|--------|------|------------|
| **咕咕数据（已接入）** | 商业 API，覆盖全国高校基础信息、录取分数线、招生计划 | 默认数据源 |
| **各省教育考试院** | 官方 Excel/PDF 附件 | 可手动导入（后续扩展） |
| **各高校官网** | 分散、无统一接口 | 不适合直接对接 |

本项目已接入的咕咕数据接口：

| 接口 | 地址 | 用途 |
|------|------|------|
| 高校基础信息 | `GET /location/college` | 院校名称、985/211、专业列表 |
| 高校录取分数线 | `GET /metadata/ceecollegeline` | 各省最低分、位次 |
| **高校招生计划** | `GET /metadata/college-enrollment-plan` | **招生人数、专业、学费、选科要求** |
| 专业录取分数线 | `GET /metadata/ceemajorline` | 专业级分数（可扩展） |

Demo 文档：
- https://www.gugudata.com/api/details/college
- https://www.gugudata.com/api/details/ceecollegeline

---

## 四、安装完成后：一步一步完成任务

### 第 1 步：启动项目

```powershell
cd D:\Projects\gaokao-volunteer
npm run dev
```

### 第 2 步：打开浏览器

访问 `http://localhost:5173`

### 第 3 步：填写考生信息

在 **「1. 填写信息」** 页：

1. 输入姓名、所在省份、分数、位次
2. 选择科类（物理类 / 历史类）
3. 勾选意向省份和专业
4. 数据来源选择 **「全国高校 API」**
5. 点击 **「生成推荐院校」**

### 第 4 步：查看冲稳保推荐

在 **「2. 院校推荐」** 页：

- **冲**：分数略高于你的院校
- **稳**：分数接近你的院校
- **保**：分数明显低于你的院校

点击 **「加入 xxx 专业」** 可添加到志愿表。

### 第 5 步：查看各校招生计划

在 **「3. 招生计划」** 页：

1. 按你的**所在省份**自动加载各高校招生计划
2. 支持按**学校名称**、**专业关键词**筛选
3. 展示：专业、招生人数、学费、批次、选科要求
4. 点击 **「加入志愿」** 写入志愿表

在 **「2. 院校推荐」** 页，每所院校下方也可展开查看招生计划。

### 第 6 步：管理志愿表

在 **「3. 我的志愿表」** 页：

- 上移 / 下移调整顺序
- 删除不需要的志愿
- 最多 6 个志愿

### 第 7 步（进阶）：接入正式 API

1. 注册咕咕数据账号：https://www.gugudata.com/
2. 购买或试用相关接口，获取 **APPKEY**
3. 写入 `.env`：

```env
VITE_GUGUDATA_APPKEY=你的密钥
```

4. 重启 `npm run dev`
5. 页面顶部会显示 **「正式 API（咕咕数据）」**

### 第 8 步（进阶）：继续开发

推荐开发顺序：

```
1. 完善 UI（Ant Design / Element Plus）
2. 增加专业级分数线接口（ceemajorline）
3. 接入录取概率预测
5. 志愿表导出 PDF / Excel
6. 数据持久化（localStorage）
```

项目结构：

```text
src/
├── api/           # 咕咕数据 API 客户端
│   ├── config.ts
│   ├── gugudata.ts
│   ├── transform.ts
│   └── types.ts
├── data/          # 本地示例数据（离线备用）
├── hooks/         # React 数据钩子
├── utils/         # 冲稳保匹配算法
├── App.tsx        # 主界面
└── types.ts       # 类型定义
```

---

## 五、常用命令

```powershell
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

---

## 六、常见问题

**Q：API 加载失败怎么办？**  
A：系统会自动回退到本地示例数据。检查网络，或先用 Demo 模式（不填 appkey）。

**Q：Demo 和正式 API 有什么区别？**  
A：Demo 返回固定样本数据，适合开发调试；正式 API 返回完整全国数据，需付费 appkey。

**Q：能不能不用任何第三方 API？**  
A：可以。在「数据来源」选择 **本地示例数据**，完全离线可用。

**Q：数据准确吗？**  
A：正式 API 数据来自第三方聚合，仅供参考。填报志愿请以**省教育考试院官方公布**为准。
