# 每天十分钟 - 日记网站

> 🌟 专注于培养写作习惯的优雅日记应用

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-4.1.7-blue.svg)](https://github.com/leowinfy/10mins/releases)
[![Author](https://img.shields.io/badge/Author-leowinfy-purple.svg)](https://github.com/leowinfy)

## 📖 关于「每天十分钟」

> *好的记录，会让平凡的日子闪闪发光*

「每天十分钟」是一个精心设计的日记应用，相信**每天抽出十分钟记录生活，就能积累一生的财富**。我们致力于提供最简洁、优雅的写作体验，让您专注于记录本身，而不是工具的复杂性。

### 🌟 为什么选择「每天十分钟」？

- **📝 极简设计** - 界面清爽，无干扰，让您专注写作
- **✨ 强大编辑** - 支持完整的 Markdown 语法，图文并茂
- **🔒 数据安全** - 本地存储，您的数据完全由您掌控
- **🌈 美观主题** - 5种精心设计的配色方案
- **📱 随时记录** - 完美适配手机和电脑

## ✨ 核心功能

### 📝 极致写作体验
- **所见即所得编辑器** - 基于 Vditor 的即时渲染模式
- **完整的 Markdown 支持** - 支持标题、列表、引用、代码、表格等
- **数学公式支持** - 使用 LaTeX 语法，支持复杂公式
- **图表绘制** - 支持流程图、甘特图、时序图等
- **语法高亮** - 代码块自动高亮显示

### 🖼️ 丰富的媒体支持
- **便捷的图片上传** - 拖拽、粘贴、点击三种上传方式
- **图片自动优化** - 自适应显示大小，保持页面整洁
- **格式支持** - 支持 JPG、PNG、GIF、WebP 等主流格式

### 🎨 个性化定制
- **5种精选主题**
  - 🌿 清新绿 - 自然清新，适合日常记录
  - 🌊 海洋蓝 - 宁静深邃，适合深度思考
  - 🌅 落日橙 - 温暖活力，适合快乐时刻
  - 🦋 优雅紫 - 高贵典雅，适合特殊纪念
  - 🌙 暗夜模式 - 护眼模式，适合夜间写作
- **主题记忆功能** - 自动记住您的选择

### 💾 可靠的数据管理
- **本地存储** - 数据安全，完全由您掌控
- **自动备份** - 每次编辑自动创建备份，保留30天
- **多格式导出** - 支持 JSON 和 Markdown 格式导出
- **全文搜索** - 快速找到历史记录

### 📱 完美适配
- **响应式设计** - 手机、平板、电脑完美适配
- **移动端优化** - 触屏友好，随时随地记录

## 🚀 部署指南

### 🐳 Docker 部署（推荐）

#### 标准部署

```bash
# 克隆项目
git clone https://github.com/leowinfy/10mins.git
cd 10mins

# 启动服务
docker-compose up -d

# 访问应用
# 浏览器打开 http://localhost:3000
```

#### 手动Docker部署

```bash
# 构建镜像
docker build -t 10mins .

# 运行容器
docker run -d -p 3000:3000 -v 10mins-data:/app/data --name 10mins-diary 10mins
```

### 🏠 NAS设备部署（极空间、群晖、威联通等）

**⚠️ 重要提示：**
- **请使用 root 版本镜像**：`leowinfy/10mins:root`
- 普通版本会因权限问题无法正常使用

#### 方法一：Docker Compose（推荐）

```bash
# 使用NAS专用配置
docker-compose -f docker-compose.nas-root.yml up -d
```

#### 方法二：图形界面配置

1. **下载镜像**
   - 在Docker管理界面下载：`leowinfy/10mins:root`

2. **创建容器**
   - 镜像选择：`leowinfy/10mins:root`
   - 端口映射：`3000:3000`

3. **目录挂载配置**
   ```
   容器路径 → 主机路径（示例）
   /app/data → /docker/10mins/data
   /app/backups → /docker/10mins/backups
   ```
   **重要**：取消勾选"只读"选项

4. **环境变量**
   ```
   NODE_ENV=production
   DATABASE_URL=file:./data/db/diaries.json
   UPLOAD_DIR=/app/data/uploads
   ```

#### 方法三：自动部署脚本

```bash
# 赋予执行权限
chmod +x deploy-nas.sh

# 自动检测并部署
./deploy-nas.sh
```

### 🌐 云服务器部署

支持部署到任何支持 Docker 的云服务器：

- 阿里云 ECS
- 腾讯云 CVM
- AWS EC2
- DigitalOcean
- Vultr

### 💻 本地开发

**环境要求**
- Node.js 18 或更高版本
- npm 或 yarn

**安装步骤**

1. **克隆项目**
   ```bash
   git clone https://github.com/leowinfy/10mins.git
   cd 10mins
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问 http://localhost:3000

## 🛠️ 技术栈

### 核心技术
- **前端框架**: Next.js 15 (App Router)
- **UI框架**: React 19
- **样式**: Tailwind CSS
- **编辑器**: Vditor 3.11.2 (浏览器端的 Markdown 编辑器)
- **类型安全**: TypeScript

### 存储方案
- **数据存储**: 本地文件系统 (JSON格式)
- **图片存储**: 本地文件系统
- **文件上传**: Multer

### 开发工具
- **代码规范**: ESLint
- **包管理**: npm
- **测试框架**: Jest, Playwright
- **自动化测试**: 完整的测试套件覆盖

## 📖 使用指南

### 写日记流程

1. 点击"写日记"按钮
2. 输入标题 - 您可以选择性地修改发布时间
3. 编写内容：
   - 使用标准 Markdown 语法
   - 支持 GitHub Flavored Markdown (GFM)
   - 可以使用快速插入按钮添加常用格式
   - 点击"预览模式"实时查看渲染效果
4. 添加图片（支持拖拽、粘贴或点击上传）
5. 点击保存

### 编辑器功能

#### Vditor Markdown编辑器
- **多种编辑模式** - 支持即时渲染（IR）、所见即所得（WYSIWYG）和分屏预览模式
- **GitHub风格** - 完全兼容 GitHub Flavored Markdown (GFM)
- **实时预览** - 编辑时可随时切换到预览模式
- **快速插入工具栏** - 提供标题、列表、引用、代码、链接、表格等快捷按钮
- **纯文本存储** - 不产生多余HTML代码，简洁干净
- **有序列表支持** - 完美保持自定义序号
- **图片上传** - 支持拖拽、粘贴上传，自动插入Markdown语法
- **代码高亮** - 支持多种编程语言语法高亮
- **数学公式** - 内置 KaTeX，支持 LaTeX 数学公式渲染
- **图表支持** - 支持流程图、甘特图、时序图、饼图等
- **高级功能** - 支持脑图、五线谱、ABC音乐记谱、Chart图表等
- **大纲导航** - 自动生成文档大纲，支持快速跳转
- **内容主题** - 支持多种内容主题切换（微信、Light、Dark、Ant Design等）

#### 支持的Markdown语法

```markdown
# 一级标题        ## 二级标题        ### 三级标题
**粗体文本**      *斜体文本*         ***粗斜体***
[链接文本](URL)   ![图片描述](URL)
- 项目列表        1. 有序列表
> 引用文本        --- 分割线
`内联代码`        ```代码块```
```

### 图片上传
- **支持格式**: JPG, PNG, GIF, WebP
- **文件大小**: 最大5MB
- **上传方式**:
  - 拖拽图片到编辑器
  - 使用Ctrl+V粘贴截图
  - 点击工具栏"📷 上传图片"按钮

### 数据管理
- **自动备份**: 每次修改数据时自动创建备份，保留30天
- **手动备份**:
  - Linux/Mac: `./scripts/backup.sh`
  - Windows: `scripts\backup.bat`
- **数据导出**: 在日记列表页面点击"导出"按钮，支持JSON和Markdown格式

## 📁 项目结构

```
10mins/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API路由
│   │   │   ├── diaries/     # 日记CRUD API
│   │   │   ├── upload/      # 图片上传API
│   │   │   └── export/      # 数据导出API
│   │   ├── diary/           # 日记相关页面
│   │   ├── diaries/         # 日记列表页
│   │   ├── globals.css      # 全局样式
│   │   ├── layout.tsx       # 根布局
│   │   └── page.tsx         # 首页
│   ├── components/          # React组件
│   │   ├── editor/          # 编辑器组件
│   │   ├── ui/              # 基础UI组件
│   │   └── ...              # 其他组件
│   ├── lib/                 # 工具函数
│   │   ├── db.ts           # 数据库操作（文件系统）
│   │   ├── storage.ts      # 文件存储管理
│   │   └── utils.ts        # 通用工具函数
│   └── types/              # TypeScript类型定义
├── data/                   # 数据存储目录
│   ├── db/                # 数据库文件
│   └── uploads/           # 上传的图片
├── docs/                   # 文档目录
├── public/               # 静态资源
├── docker-compose.yml    # Docker Compose配置
├── docker-compose.nas-root.yml  # NAS部署配置
├── Dockerfile           # Docker镜像构建文件
└── package.json         # 项目配置
```

## ⚙️ 配置说明

### 环境变量

创建 `.env.local` 文件（可选）：

```env
# 数据存储目录（默认：./data）
UPLOAD_DIR=./data/uploads

# 数据库文件路径（默认：./data/db）
DATABASE_DIR=./data/db

# 应用端口（默认：3000）
PORT=3000

# Node环境（开发时使用development）
NODE_ENV=development
```

### Docker配置

Docker部署时的数据卷挂载：

```yaml
volumes:
  - 10mins-data:/app/data  # 持久化存储数据和图片
```

## ❓ 常见问题

### 🚀 安装与部署

**Q: Docker 部署后如何查看运行状态？**
```bash
# 查看容器状态
docker ps

# 查看日志
docker logs 10mins-diary

# 实时查看日志
docker logs -f 10mins-diary
```

**Q: 如何备份数据？**
- Docker 部署：数据会自动保存在 `10mins-data` 卷中
- 手动备份：`docker cp 10mins-diary:/app/data ./backup`
- 导出功能：在日记列表页点击"导出"按钮

**Q: 如何更新到新版本？**
```bash
# 停止旧容器
docker stop 10mins-diary
docker rm 10mins-diary

# 拉取新代码
git pull origin main

# 重新构建并运行
docker-compose up -d
```

### ✍️ 编辑功能

**Q: 支持哪些 Markdown 语法？**
- ✅ 标题、段落、换行
- ✅ 粗体、斜体、删除线
- ✅ 有序/无序列表
- ✅ 引用块
- ✅ 代码块（支持语法高亮）
- ✅ 表格
- ✅ 链接和图片
- ✅ 数学公式（LaTeX）
- ✅ 任务列表
- ✅ 分隔线

**Q: 如何插入数学公式？**
行内公式：`$E=mc^2$`
块级公式：
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

**Q: 如何切换编辑模式？**
点击编辑器右上角的按钮，可以在以下模式间切换：
- 即时渲染（IR）- 推荐，所见即所得
- 分屏预览 - 左侧编辑，右侧预览
- 源码模式 - 纯文本编辑

### 📷 图片管理

**Q: 支持哪些图片格式？**
JPG、PNG、GIF、WebP 等主流格式，单个文件最大 5MB

**Q: 如何上传图片？**
三种方式任选其一：
1. **拖拽上传** - 直接拖图片到编辑器
2. **粘贴上传** - Ctrl+V 粘贴截图或复制图片
3. **点击上传** - 点击工具栏的 📷 图标

### 🔧 个性化

**Q: 如何切换主题？**
点击右上角的 🎨 图标，选择您喜欢的主题

**Q: 主题会保存吗？**
会！应用会记住您的选择，下次访问自动加载

### 💾 数据安全

**Q: 数据存储在哪里？**
- **本地开发**：`./data` 目录
- **Docker 部署**：容器的 `/app/data` 目录（通过数据卷持久化）

**Q: 会自动备份吗？**
是的！每次编辑都会自动创建备份，保留最近 30 天的历史记录

**Q: 可以导出数据吗？**
当然！在日记列表页点击"导出"，可选择：
- **JSON 格式**：包含完整数据，方便备份
- **Markdown 格式**：纯文本，方便迁移

## 🛠️ 开发指南

### 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 代码检查
npm run lint

# 构建生产版本
npm run build
npm start
```

### 添加新功能

1. 创建新组件：
   ```typescript
   // src/components/NewComponent/index.tsx
   export default function NewComponent() {
     return <div>New Component</div>
   }
   ```

2. 添加API路由：
   ```typescript
   // src/app/api/new-feature/route.ts
   import { NextRequest, NextResponse } from 'next/server'

   export async function GET(request: NextRequest) {
     // 处理逻辑
   }
   ```

3. 更新相关页面，导入并使用新组件

### 代码规范
- 使用TypeScript编写所有代码
- 遵循ESLint规则
- 组件使用PascalCase命名
- 文件和目录使用camelCase命名
- 导出使用默认导出
- 新功能必须包含对应的测试用例

## 🧪 测试

项目包含完整的自动化测试套件：

```bash
# 运行所有测试
npm run test:all

# 运行特定类型的测试
npm run test:api          # API测试
npm run test:components   # 组件测试
npm run test:integration  # 集成测试
npm run test:e2e          # E2E测试

# 生成测试覆盖率报告
npm run test:coverage
```

测试覆盖范围：
- **API测试**: 所有CRUD操作、搜索功能、文件上传
- **组件测试**: 编辑器功能、用户交互
- **集成测试**: 完整工作流、并发操作
- **E2E测试**: 真实浏览器环境下的用户场景
- **安全性测试**: XSS防护、文件类型验证、输入清理

## 📦 版本管理

### 版本信息
- 当前版本：**v4.1.7**
- 作者：**leowinfy**
- 许可证：**MIT License**

### 版本相关命令

```bash
# 查看当前版本
npm run version

# 构建Docker镜像（包含版本标签）
npm run docker:build

# 为Docker镜像打latest标签
npm run docker:tag

# 推送镜像到Docker Hub
npm run docker:push

# 发布新版本（自动更新版本号、构建和推送）
npm run release
```

### Docker镜像标签
- `leowinfy/10mins:v4.1.7` - 具体版本
- `leowinfy/10mins:latest` - 最新版本
- `leowinfy/10mins:root` - NAS专用root版本

## 🔄 更新日志

### v4.1.7 (2025-12-09)

- ✅ 修复极空间NAS无限重启问题
- ✅ 创建root版本镜像，彻底解决NAS权限问题
- ✅ 改进启动脚本权限处理，遇到权限问题不再退出
- ✅ 添加权限自动修复机制（chmod 666）
- ✅ 清理无用配置文件，简化部署流程

[查看完整更新日志](CHANGELOG.md)

## 🗺️ 后续计划

- [ ] 添加数据统计功能（写作天数、字数统计等）
- [ ] 实现日记分类和标签系统
- [ ] 支持导出PDF格式
- [ ] 实现多用户支持
- [ ] 添加评论和心得功能
- [ ] 支持导入其他日记应用数据
- [ ] 添加写作提醒功能
- [ ] 支持 Markdown 模板快速创建

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 💝 致每一位记录者

> *时间是写作者唯一的货币，而每一天都是一张白纸*

「每天十分钟」相信，**记录本身就是一种力量**。不需要华丽的辞藻，不需要宏大的叙事，只需要诚实地记录下今天的所见所闻、所思所感。

也许很多年后，当我们翻开这些记录时，会发现：
- 那些曾经以为微不足道的小事，原来闪闪发光
- 那些曾经的困惑与迷茫，都成为了成长的印记
- 那些简单的快乐，原来是生活最珍贵的财富

开始记录吧，就从今天开始，就从现在开始。📝

---

**每天十分钟，遇见更好的自己** ⏰✨

[![Star History Chart](https://api.star-history.com/svg?repos=leowinfy/10mins&type=Date)](https://star-history.com/#leowinfy/10mins&Date)

如果这个项目对您有帮助，请给我们一个 ⭐️，您的支持是我们持续改进的动力！