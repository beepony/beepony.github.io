#!/usr/bin/env node
/**
 * 构建 /legacy/index.html 索引页
 * 列出 2013-2017 全部 58 篇历史文章
 * 解析每篇的 title 来自其 <title> 标签
 */
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "dist");
const LEGACY_DIR = join(DIST, "legacy");
const YEARS = ["2017", "2016", "2015", "2014", "2013"];  // 倒序：由近及远

function extractTitle(html) {
  // 优先级 1：<title> 标签，但要清理 " · null"、"· null" 之类的原 Jekyll 残留
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (m) {
    let t = m[1].trim();
    // 清理常见的 Jekyll 渲染残留
    t = t.replace(/\s*[·|｜]\s*null\s*$/i, "").trim();
    t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
         .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    if (t) return t;
  }
  // 优先级 2：post 标题 h3 > h1
  const h = html.match(/<h3><a>([^<]+)<\/a><\/h3>/)
         || html.match(/<h1>([^<]+)<\/h1>/);
  if (h) {
    let t = h[1].trim();
    t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
         .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    if (t) return t;
  }
  return "(无标题)";
}

async function listArticles(yearDir) {
  // 遍历 YYYY/MM/DD/slug/index.html，提取 (url, title, date)
  const articles = [];
  async function walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name === "index.html") {
        const html = await readFile(full, "utf8");
        const rel = full.replace(DIST + "/", "").replace("/index.html", "/");
        const title = extractTitle(html);
        // 从路径中提取日期 YYYY/MM/DD
        const dm = rel.match(/^(\d{4})\/(\d{2})\/(\d{2})\//);
        const date = dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : "";
        articles.push({ url: "/" + rel, title, date });
      }
    }
  }
  await walk(yearDir);
  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

function htmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderHtml(yearGroups) {
  const sections = yearGroups.map(({ year, count, articles }) => `
    <section class="year-section">
      <h2 class="year-title">${year}<span class="year-count">${count} 篇</span></h2>
      <ul class="archive-list">
        ${articles.map(a => `
          <li class="archive-item">
            <time class="archive-date" datetime="${a.date}">${a.date.replace(/^\d{4}-/, '').replace('-', '/')}</time>
            <a class="archive-link" href="${a.url}">${htmlEscape(a.title)}</a>
          </li>
        `).join("")}
      </ul>
    </section>
  `).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>历史归档（2013–2017） · Beepony</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Beepony 博客 2013–2017 年间的早期文章归档，原 Jekyll 风格保留。">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/Footer.DmiNq5ML.css">
  <style>
    :root {
      --bg: #fdfdfd;
      --fg: #282728;
      --muted: #6b7280;
      --accent: #006cac;
      --border: #ece9e9;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem 1.5rem;
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Serif SC",
                   "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif;
      line-height: 1.6;
    }
    .container { max-width: 780px; margin: 0 auto; }
    .legacy-header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    .legacy-back {
      display: inline-block;
      color: var(--accent);
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .legacy-back:hover { text-decoration: underline; }
    .legacy-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
      font-weight: 700;
    }
    .legacy-desc {
      margin: 0;
      color: var(--muted);
      font-size: 0.95rem;
    }
    .year-section { margin-top: 2.5rem; }
    .year-section:first-of-type { margin-top: 0; }
    .year-title {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin: 0 0 1rem 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--fg);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
    }
    .year-count {
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--muted);
    }
    .archive-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .archive-item {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      padding: 0.4rem 0;
    }
    .archive-date {
      flex-shrink: 0;
      width: 4rem;
      color: var(--muted);
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    .archive-link {
      color: var(--fg);
      text-decoration: none;
      font-size: 1rem;
    }
    .archive-link:hover { color: var(--accent); text-decoration: underline; }
    @media (max-width: 600px) {
      body { padding: 1.5rem 1rem; }
      .legacy-title { font-size: 1.5rem; }
      .archive-item { flex-direction: column; gap: 0.1rem; }
      .archive-date { width: auto; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="legacy-header">
      <a class="legacy-back" href="/">← 回到新博客</a>
      <h1 class="legacy-title">历史归档</h1>
      <p class="legacy-desc">2013–2017 年间的早期文章，保留原 Jekyll 静态页风格。共 <strong>${yearGroups.reduce((s, y) => s + y.count, 0)}</strong> 篇。默认按时间由近及远排列。</p>
    </header>
    <main>
${sections}
    </main>
  </div>
</body>
</html>`;
}

async function main() {
  await mkdir(LEGACY_DIR, { recursive: true });
  const yearGroups = [];
  for (const y of YEARS) {
    const articles = await listArticles(join(DIST, y));
    yearGroups.push({ year: y, count: articles.length, articles });
  }
  const html = renderHtml(yearGroups);
  await writeFile(join(LEGACY_DIR, "index.html"), html);
  const total = yearGroups.reduce((s, y) => s + y.count, 0);
  console.log(`✓ /legacy/index.html 已生成（${total} 篇文章）`);
  for (const { year, count } of yearGroups) {
    console.log(`  ${year}: ${count} 篇`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });