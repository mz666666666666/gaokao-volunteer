#!/usr/bin/env bash
# 腾讯云轻量应用服务器一键部署「高考志愿填报助手」
# 与现有站点（如 life-energy-api）共存：只增加 /gaokao-volunteer/ 路径
# 用法：
#   curl -fsSL https://raw.githubusercontent.com/mz666666666666/gaokao-volunteer/main/deploy/lighthouse-oneclick.sh | sudo bash
set -euo pipefail

SITE_DIR=/var/www/gaokao-volunteer
SNIPPET=/etc/nginx/snippets/gaokao-volunteer.conf
REPO_ZIP_URL="https://codeload.github.com/mz666666666666/gaokao-volunteer/zip/refs/heads/gh-pages"
TMP_DIR=$(mktemp -d)

export DEBIAN_FRONTEND=noninteractive

echo "==> 安装依赖 ..."
apt-get update -y
apt-get install -y nginx unzip curl

echo "==> 下载构建产物 ..."
curl -fsSL "$REPO_ZIP_URL" -o "$TMP_DIR/site.zip"
unzip -q "$TMP_DIR/site.zip" -d "$TMP_DIR"
EXTRACTED=$(find "$TMP_DIR" -maxdepth 1 -type d -name 'gaokao-volunteer-gh-pages*' | head -n1)
if [[ -z "$EXTRACTED" ]]; then
  echo "解压失败，未找到 gh-pages 目录"
  exit 1
fi

mkdir -p "$SITE_DIR"
rm -rf "${SITE_DIR:?}/"*
cp -a "$EXTRACTED"/. "$SITE_DIR/"
cp -f "$SITE_DIR/index.html" "$SITE_DIR/404.html"
chown -R www-data:www-data "$SITE_DIR"

echo "==> 写入 Nginx 片段（不抢 default_server）..."
mkdir -p /etc/nginx/snippets
cat >"$SNIPPET" <<'EOF'
# 高考志愿填报助手 — 子路径挂载
location = /gaokao-volunteer {
    return 302 /gaokao-volunteer/;
}

location /gaokao-volunteer/ {
    root /var/www;
    index index.html;
    try_files $uri $uri/ /gaokao-volunteer/index.html;
}

location /gaokao-volunteer/assets/ {
    root /var/www;
    expires 30d;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}
EOF

# 清理上次失败留下的独立站点配置
rm -f /etc/nginx/sites-enabled/gaokao-volunteer
rm -f /etc/nginx/sites-available/gaokao-volunteer

# 把 snippet 挂进已有的 80 端口 server（优先 life-energy-api）
INCLUDE_LINE="include $SNIPPET;"
TARGET=""
for candidate in \
  /etc/nginx/sites-enabled/life-energy-api \
  /etc/nginx/sites-enabled/default \
  /etc/nginx/sites-enabled/*
do
  [[ -f "$candidate" ]] || continue
  if grep -qE 'listen\s+80' "$candidate"; then
    TARGET="$candidate"
    break
  fi
done

if [[ -z "$TARGET" ]]; then
  echo "未找到监听 80 的站点，创建独立 server（非 default_server）"
  cat >/etc/nginx/sites-available/gaokao-volunteer <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name _;
    $INCLUDE_LINE
}
EOF
  ln -sfn /etc/nginx/sites-available/gaokao-volunteer /etc/nginx/sites-enabled/gaokao-volunteer
else
  if grep -qF "$SNIPPET" "$TARGET"; then
    echo "==> 已在 $TARGET 中包含片段，跳过注入"
  else
    echo "==> 注入片段到 $TARGET"
    mkdir -p /root/nginx-backups
    cp "$TARGET" "/root/nginx-backups/$(basename "$TARGET").bak.$(date +%s)"
    # 在第一个 server { 后插入 include
    awk -v line="    $INCLUDE_LINE" '
      BEGIN { done=0 }
      /server[[:space:]]*\{/ && !done {
        print
        print line
        done=1
        next
      }
      { print }
    ' "$TARGET" >"${TARGET}.tmp"
    mv "${TARGET}.tmp" "$TARGET"
  fi
fi

# 清理误放在 sites-enabled 里的备份（Nginx 会加载目录下所有文件）
find /etc/nginx/sites-enabled -maxdepth 1 \( -name '*.bak' -o -name '*.bak.*' -o -name '*.tmp' \) -delete

nginx -t
systemctl reload nginx

rm -rf "$TMP_DIR"

PUBLIC_IP=$(curl -fsSL https://ifconfig.me 2>/dev/null || curl -fsSL https://api.ipify.org 2>/dev/null || echo "106.55.156.15")
echo ""
echo "========================================"
echo " 部署成功（与现有站点共存）"
echo " 访问：http://${PUBLIC_IP}/gaokao-volunteer/"
echo "========================================"
