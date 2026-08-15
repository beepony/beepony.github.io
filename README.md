# Beepony 博客

这是一个由 GitHub Pages 自动构建的 Jekyll 博客，保留了原有 Anatole 风格的 CSS 和静态历史文章。

## 发布新文章

1. 在 `_posts/` 新建文件，名称必须为 `YYYY-MM-DD-slug.md`，例如：
   `2026-08-15-my-first-post.md`。
2. 复制 `POST_TEMPLATE.md` 的内容，填写标题、日期、摘要和正文。
3. 提交并推送：

```bash
git add _posts/2026-08-15-my-first-post.md
git commit -m "发布：我的第一篇文章"
git push origin master
```

GitHub Pages 会自动构建，通常在 1–2 分钟内上线。也可以在 GitHub 仓库网页中进入 `_posts`，选择 **Add file → Create new file** 直接创建 Markdown 文件并提交。

## 图片

将图片放在 `assets/images/`，文章里以如下方式引用：

```markdown
![图片说明](/assets/images/photo.jpg)
```

## 历史内容

旧文章仍以静态 HTML 保留：历史文章链接在 `/archives/`，旧首页备份在 `/legacy-home.html`。新文章从 Markdown 自动生成，无需手动编辑首页。
