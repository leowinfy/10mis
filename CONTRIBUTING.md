# 贡献指南

感谢您对"每天十分钟"项目的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告问题

1. 查看 [已有 Issues](https://github.com/yourusername/10mins/issues) 确保问题未被报告
2. 创建新的 Issue，使用适当的模板
3. 提供详细的问题描述，包括：
   - 问题的具体表现
   - 重现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、浏览器版本等）

### 提交代码

1. **Fork 本仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   # 然后克隆您的 fork
   git clone https://github.com/yourusername/10mins.git
   cd 10mins
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   # 或
   git checkout -b bugfix/fix-issue
   ```

3. **进行更改**
   - 遵循现有的代码风格
   - 添加必要的测试
   - 确保所有测试通过

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加了某项新功能"
   ```

5. **推送到您的 fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **创建 Pull Request**
   - 访问 GitHub 上的您的 fork
   - 点击 "New Pull Request"
   - 填写 PR 模板
   - 等待代码审查

## 📝 代码规范

### 命名规范

- **组件**: PascalCase (如 `DiaryCard`)
- **文件和目录**: camelCase (如 `diaryEditor`)
- **变量和函数**: camelCase (如 `getDiaryList`)
- **常量**: UPPER_SNAKE_CASE (如 `API_BASE_URL`)

### 代码风格

- 使用 TypeScript 编写所有代码
- 遵循 ESLint 配置
- 组件使用函数式组件和 Hooks
- 导出使用默认导出

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(editor): 添加图片拖拽上传功能

- 支持拖拽图片到编辑器
- 自动插入 Markdown 语法
- 添加上传进度提示

Closes #123
```

## 🧪 测试

在提交代码前，请确保：

1. 所有测试通过
   ```bash
   npm run test:all
   ```

2. 代码覆盖率保持或提高
   ```bash
   npm run test:coverage
   ```

3. 新功能添加了相应的测试用例

## 📋 PR 检查清单

提交 PR 前请确认：

- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档
- [ ] 提交信息符合规范
- [ ] 没有引入不必要的依赖
- [ ] 兼容目标浏览器

## 🚀 开发环境设置

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **运行测试**
   ```bash
   npm run test:watch
   ```

## 📚 资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Vditor 编辑器文档](https://vditor.dev/)

## 💬 讨论

- 如果您有疑问或想讨论，可以在 GitHub Discussions 中发起话题
- 对于安全问题，请直接发送邮件到 [winfylau@hotmail.com]

## 📜 行为准则

请遵守我们的 [行为准则](CODE_OF_CONDUCT.md)，营造友好、包容的社区环境。

再次感谢您的贡献！🎉