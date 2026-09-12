# 博客架构迁移记录

## 📅 2026-09-12：从 Jekyll → Astro + Astro Paper

### 变更概览

| 维度 | 旧（Jekyll）| 新（Astro Paper）|
|---|---|---|
| **静态站点生成器** | Jekyll（无 Gemfile，被锁在 GH Pages 内置版）| Astro v7 + Astro Paper v6.1 |
| **前端依赖** | jQuery 1.x/2.x + Font Awesome 4.x | 零 JS 默认，仅主题必要的少量 client 脚本 |
| **CSS** | 手写 SCSS（无构建管线）| Tailwind v4 + Kramdown |
| **类型安全** | 无 | Zod schema + TypeScript strict |
| **构建产物** | 默认 Jekyll 产物 | `npm run build` → `dist/`（204 个文件，~600KB）|
| **部署** | 直接 push master | push `main` → GitHub Action → 自动部署到 `master` |

### 关键决策

1. **保留 master 部署目标**：因为 `beepony.github.io` 必须从 `master` 服务的限制，采用双分支方案（`main` 源码 + `master` 构建产物）
2. **不重建旧归档**：2013–2017 年 30+ 篇 HTML 原样复制到 `public/2013-2017/`，URL 完全保留
3. **URL 完全兼容**：现代文章 URL `/YYYY/MM/DD/slug/` 与旧 Jekyll permalink 一致
4. **新增中文 i18n**：`src/i18n/lang/zh-CN.ts` 提供完整 UI 翻译
5. **字体升级**：Noto Serif SC（思源宋体）作为中文正文字体

### 目录结构

```
beepony.github.io/
├── main 分支（源码）
│   ├── src/
│   │   ├── content/posts/YYYY/MM/DD/slug.md   ← 9 篇现代文章
│   │   ├── content/pages/                      ← About 等页面
│   │   ├── components/                         ← 自定义组件（含 TableOfContents）
│   │   ├── i18n/lang/zh-CN.ts                  ← 中文 UI 翻译
│   │   ├── layouts/                            ← 主题布局
│   │   ├── pages/                              ← 路由
│   │   └── styles/                             ← 全局样式
│   ├── public/                                 ← 原样服务的静态资源
│   │   ├── 2013/, 2014/, ..., 2017/            ← 旧归档（HTML 原样）
│   │   ├── css/, js/                           ← 旧归档需要的样式与脚本
│   │   ├── images/                             ← 图片资源
│   │   ├── assets/                             ← 资源
│   │   └── legacy-home.html                    ← 旧版首页
│   ├── .github/workflows/deploy.yml            ← GitHub Action
│   ├── astro.config.ts
│   ├── astro-paper.config.ts
│   └── package.json
│
└── master 分支（由 Action 自动写入）
    └── dist/（Astro 构建产物）
```

### 回滚方案

如有问题，立即回滚：

```bash
# 1. 切到本地 master 分支
git checkout master

# 2. 强制重置为 legacy-jekyll 备份
git reset --hard legacy-jekyll
git push --force origin master
```

`legacy-jekyll` 分支保留了迁移前所有的 Jekyll 内容，可作为终极保险。

### 写作流程（新）

1. 在 `src/content/posts/YYYY/MM/DD/` 下创建新 Markdown 文件
2. frontmatter 必填字段：`title`、`pubDatetime`、`description`、`tags`
3. 提交到 main 分支 → GitHub Action 自动构建并部署
4. 1–2 分钟后即可在 `beepony.github.io` 看到新文章