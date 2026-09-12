#!/bin/bash
# publish.sh - 本地构建并发布新文章到 GitHub Pages
# 用法：./publish.sh "commit message"
set -e

MSG="${1:-deploy: 更新文章}"

echo "▶ 1/4 构建 Astro 站点..."
cd "$(dirname "$0")"
npm run build

echo "▶ 2/4 同步到 ~/beepony.github.io..."
cd ~/beepony.github.io
git rm -rf . > /dev/null 2>&1 || true
cp -R ~/beepony-astro/dist/. .
touch .nojekyll
[ -f .gitignore ] || cat > .gitignore <<'EOF'
.DS_Store
*.log
EOF

echo "▶ 3/4 提交..."
git add -A
git commit -q -m "$MSG"

echo "▶ 4/4 推送到 master..."
git push --force origin master

echo ""
echo "✅ 部署完成！约 30 秒后访问 https://beepony.github.io 即可看到更新"