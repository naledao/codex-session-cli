# 贡献指南

感谢您对 Codex Session Viewer 项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告问题

1. 使用 GitHub Issues 报告问题
2. 使用问题模板提供详细信息
3. 包含复现步骤、期望行为和实际行为
4. 提供相关的错误信息或日志

### 提交代码

1. Fork 项目仓库
2. 创建功能分支
3. 提交更改
4. 推送到您的 Fork
5. 创建 Pull Request

### 开发流程

#### 1. 设置开发环境
```bash
# 克隆您的 Fork
git clone https://github.com/yourusername/codex-session-viewer.git
cd codex-session-viewer

# 安装依赖
npm install

# 创建功能分支
git checkout -b feature/your-feature-name
```

#### 2. 开发功能
```bash
# 启动开发模式（自动重新构建）
npm run dev

# 运行测试
npm test

# 运行特定测试
npm test -- --grep "test name"
```

#### 3. 代码质量检查
```bash
# 运行 ESLint
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 运行 Prettier
npm run format

# 类型检查
npm run typecheck
```

#### 4. 提交更改
```bash
# 添加更改
git add .

# 提交（使用语义化提交信息）
git commit -m "feat: add new feature"

# 推送到您的 Fork
git push origin feature/your-feature-name
```

#### 5. 创建 Pull Request
1. 访问 GitHub 仓库页面
2. 点击 "Compare & pull request"
3. 填写 PR 模板
4. 等待代码审查

## 代码规范

### TypeScript 规范
- 使用 TypeScript 严格模式
- 优先使用 `interface` 而不是 `type`
- 为所有公共 API 提供类型定义
- 使用 `readonly` 修饰符保护不可变数据

### 命名规范
- **变量和函数**: camelCase (`getUserSessions`)
- **类和接口**: PascalCase (`SessionService`)
- **常量**: UPPER_SNAKE_CASE (`MAX_RESULTS`)
- **文件名**: kebab-case (`session-service.ts`)

### 代码风格
- 使用 2 个空格缩进
- 使用单引号
- 使用分号
- 行宽限制 100 字符
- 使用尾随逗号

### 注释规范
- 为复杂逻辑添加注释
- 使用 JSDoc 为公共 API 添加文档
- 保持注释与代码同步

## 测试规范

### 测试要求
- 为所有新功能编写测试
- 保持测试覆盖率 > 80%
- 测试应该独立且可重复
- 使用描述性的测试名称

### 测试结构
```typescript
describe('SessionService', () => {
  describe('getCurrentDirectorySessions', () => {
    it('should return sessions for current directory', async () => {
      // Arrange
      const service = new SessionService();
      const mockSessions = [...];
      
      // Act
      const result = await service.getCurrentDirectorySessions();
      
      // Assert
      expect(result).toEqual(mockSessions);
    });

    it('should handle empty sessions directory', async () => {
      // Arrange
      const service = new SessionService();
      
      // Act
      const result = await service.getCurrentDirectorySessions();
      
      // Assert
      expect(result).toEqual([]);
    });
  });
});
```

### 测试命名
- 使用 `should` 开头描述行为
- 包含正常情况和边界情况
- 测试名称应该清晰明确

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 提交类型
- **feat**: 新功能
- **fix**: 修复问题
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 代码重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建/工具相关
- **ci**: CI/CD 相关
- **revert**: 回滚提交

### 示例
```
feat(search): add regex search support

Add support for regular expressions in search queries.
Users can now use --regex flag to enable pattern matching.

Closes #123
```

```
fix(parser): handle malformed JSONL files

Fix crash when encountering malformed JSONL files.
Now gracefully skips invalid lines and logs warning.

Fixes #456
```

## Pull Request 规范

### PR 标题
- 使用语义化标题
- 简洁描述更改内容
- 包含相关 issue 编号

### PR 描述
- 详细描述更改内容
- 包含实现细节
- 列出测试用例
- 关联相关 issue

### PR 模板
```markdown
## 描述
简要描述此 PR 的更改内容。

## 更改类型
- [ ] 新功能
- [ ] 问题修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 测试相关
- [ ] 其他

## 测试
描述如何测试这些更改。

## 相关 Issue
Closes #123
Fixes #456

## 截图（如果适用）
添加相关截图。

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 已添加/更新测试
- [ ] 已更新文档
- [ ] 已通过所有测试
- [ ] 已通过代码质量检查
```

## 版本发布

### 版本号规则
遵循 [语义化版本](https://semver.org/)：
- **主版本号**: 不兼容的 API 更改
- **次版本号**: 向后兼容的新功能
- **修订号**: 向后兼容的问题修复

### 发布流程
1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 发布到 npm
5. 创建 GitHub Release

## 社区准则

### 行为准则
- 尊重所有参与者
- 接受建设性批评
- 专注于对社区最有利的事情
- 对他人表示同理心

### 沟通渠道
- GitHub Issues: 问题报告和功能请求
- GitHub Discussions: 一般讨论和问题
- Pull Requests: 代码贡献和审查

## 许可证

通过贡献代码，您同意您的贡献将在 MIT 许可证下获得许可。

## 致谢

感谢所有为项目做出贡献的人！