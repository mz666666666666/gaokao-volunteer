#!/usr/bin/env bash
# 手动粘贴到 OrcaTerm 执行（不依赖 raw.githubusercontent.com 缓存）
set -euo pipefail

SITE_DIR=/var/www/gaokao-volunteer
SNIPPET=/etc/nginx/snippets/gaokao-volunteer.conf
TMP_DIR=$(mktemp -d)

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx unzip curl

# 清理旧的独立站点（含 default_server 的那份）
rm -f /etc/nginx/sites-enabled/gaokao-volunteer
rm -f /etc/nginx/sites-available/gaokao-volunteer

echo "==> 下载站点文件 ..."
curl -fsSL "https://codeload.github.com/mz666666666666/gaokao-volunteer/zip/refs/heads/gh-pages" -o "$TMP_DIR/site.zip"
unzip -qo "$TMP_DIR/site.zip" -d "$TMP_DIR"
EXTRACTED=$(find "$TMP_DIR" -maxdepth 1 -type d -name 'gaokao-volunteer-gh-pages*' | head -n1)
mkdir -p "$SITE_DIR"
rm -rf "${SITE_DIR:?}/"*
cp -a "$EXTRACTED"/. "$SITE_DIR/"
cp -f "$SITE_DIR/index.html" "$SITE_DIR/404.html"
chown -R www-data:www-data "$SITE_DIR"

echo "==> 写入子路径片段 ..."
mkdir -p /etc/nginx/snippets
cat >"$SNIPPET" <<'EOF'
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

TARGET=/etc/nginx/sites-enabled/life-energy-api
if [[ ! -f "$TARGET" ]]; then
  echo "未找到 life-energy-api，请检查：ls /etc/nginx/sites-enabled/"
  exit 1
fi

# 若尚未 include，则注入
if ! grep -qF 'snippets/gaokao-volunteer.conf' "$TARGET"; then
  # 备份必须放在 sites-enabled 外，否则会被 Nginx 当作正式配置加载
  mkdir -p /root/nginx-backups
  cp "$TARGET" "/root/nginx-backups/life-energy-api.bak.$(date +%s)"
  awk '
    /server[[:space:]]*\{/ && !done {
      print
      print "    include /etc/nginx/snippets/gaokao-volunteer.conf;"
      done=1
      next
    }
    { print }
  ' "$TARGET" >"${TARGET}.tmp"
  mv "${TARGET}.tmp" "$TARGET"
  echo "==> 已注入到 $TARGET"
else
  echo "==> 片段已存在，跳过注入"
fi

# 清理误放在 sites-enabled 里的备份文件
find /etc/nginx/sites-enabled -maxdepth 1 \( -name '*.bak' -o -name '*.bak.*' -o -name '*.tmp' \) -delete

echo "==> 当前 default_server 分布："
grep -Rn "default_server" /etc/nginx/sites-enabled/ || true

nginx -t
systemctl reload nginx
rm -rf "$TMP_DIR"

echo ""
echo "部署成功：http://106.55.156.15/gaokao-volunteer/"
