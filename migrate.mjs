#!/usr/bin/env node
/**
 * Migration script: Jekyll _posts/*.md → Astro Paper src/content/posts/YYYY/MM/DD/title.md
 *
 * Transformations:
 *   - layout: post            → removed
 *   - date: YYYY-MM-DD HH:MM:SS +0800 → pubDatetime: ISO string
 *   - tags: [a, b]            → unchanged (Astro Paper兼容)
 *   - description, title      → unchanged
 *   - File renamed: 2026-09-12-title.md → src/content/posts/2026/09/12/title.md
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "beepony.github.io", "_posts");
const DST = join(__dirname, "src", "content", "posts");

// YAML frontmatter simple parser（支持内联数组 [a, b, c] 与多行数组）
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const [, fm, body] = match;
  const data = {};
  const lines = fm.split("\n");
  let currentKey = null;
  let currentArray = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    // 数组项（"  - value"）
    if (/^\s+-\s+/.test(line)) {
      if (currentArray) currentArray.push(line.replace(/^\s*-\s+/, "").replace(/^["']|["']$/g, "").trim());
      continue;
    }
    // 顶层 k: v
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    currentKey = key;
    const trimmed = value.trim();
    // 内联数组 [a, b, c]
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const inner = trimmed.slice(1, -1);
      const items = inner.split(",").map(s => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      data[key] = items;
      currentArray = null;
    } else if (trimmed === "") {
      // 多行数组起点
      currentArray = [];
      data[key] = currentArray;
    } else {
      currentArray = null;
      data[key] = trimmed.replace(/^["']|["']$/g, "");
    }
  }
  return { data, body };
}

function transformDate(jekyllDate) {
  // "2026-08-15 09:00:00 +0800" → "2026-08-15T09:00:00+08:00"
  const m = jekyllDate.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, tz] = m;
  const tzFormatted = `${tz.slice(0, 3)}:${tz.slice(3)}`;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}${tzFormatted}`;
}

function serializeFrontmatter(data) {
  const lines = ["---"];
  const dateKeys = new Set(["pubDatetime", "modDatetime"]);
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - "${item}"`);
    } else if (dateKeys.has(k)) {
      // 日期字段不加引号，让 Astro 解析为 Date 对象
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: "${String(v).replace(/"/g, '\\"')}"`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

async function migrate() {
  const files = await readdir(SRC);
  const mdFiles = files.filter(f => f.endsWith(".md"));
  console.log(`Found ${mdFiles.length} posts to migrate`);

  for (const file of mdFiles) {
    const fileMatch = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
    if (!fileMatch) {
      console.warn(`⚠️  Skip (bad filename): ${file}`);
      continue;
    }
    const [, y, mo, d, slug] = fileMatch;
    const targetDir = join(DST, y, mo, d);
    const targetFile = join(targetDir, `${slug}.md`);
    await mkdir(targetDir, { recursive: true });

    const raw = await readFile(join(SRC, file), "utf8");
    const { data, body } = parseFrontmatter(raw);

    const newData = {
      author: "Beepony",
      title: data.title || slug,
      pubDatetime: transformDate(data.date) || `${y}-${mo}-${d}T00:00:00+08:00`,
      description: data.description || "",
      tags: Array.isArray(data.tags) ? data.tags : ["随笔"],
      timezone: "Asia/Shanghai",
    };
    if (data.modified) {
      const mod = transformDate(data.modified);
      if (mod) newData.modDatetime = mod;
    }

    const output = serializeFrontmatter(newData) + "\n" + body;
    await writeFile(targetFile, output);
    console.log(`✓ ${file} → src/content/posts/${y}/${mo}/${d}/${slug}.md`);
  }
}

migrate().catch(e => { console.error(e); process.exit(1); });