#!/usr/bin/env bash
# 腾讯云轻量应用服务器一键部署「高考志愿填报助手」
# 在 OrcaTerm（网页终端）以 root 或带 sudo 用户执行：
#   curl -fsSL https://raw.githubusercontent.com/mz666666666666/gaokao-volunteer/main/deploy/lighthouse-oneclick.sh | sudo bash
set -euo pipefail

SITE_DIR=/var/www/gaokao-volunteer
REPO_ZIP_URL="https://codeload.github.com/mz666666666666/gaokao-volunteer/zip/refs/heads/gh-pages"
TMP_DIR=$(mktemp -d)

export DEBIAN_FRONTEND=noninteractive

echo "==> 安装 Nginx / unzip ..."
apt-get update -y
apt-get install -y nginx unzip curl

echo "==> 下载 GitHub Pages 构建产物 ..."
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
# SPA 回退
cp -f "$SITE_DIR/index.html" "$SITE_DIR/404.html"
chown -R www-data:www-data "$SITE_DIR"

echo "==> 写入 Nginx 配置 ..."
cat >/etc/nginx/sites-available/gaokao-volunteer <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 根路径跳转到子应用
    location = / {
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
}
EOF

ln -sfn /etc/nginx/sites-available/gaokao-volunteer /etc/nginx/sites-enabled/gaokao-volunteer
# 避免 default 抢端口冲突
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl restart nginx

rm -rf "$TMP_DIR"

PUBLIC_IP=$(curl -fsSL https://ifconfig.me || curl -fsSL https://api.ipify.org || echo "106.55.156.15")
echo ""
echo "========================================"
echo " 部署成功！"
echo " 访问：http://${PUBLIC_IP}/gaokao-volunteer/"
echo " 或：  http://${PUBLIC_IP}/"
echo "========================================"
