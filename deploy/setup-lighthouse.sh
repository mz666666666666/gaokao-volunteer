#!/usr/bin/env bash
# 在腾讯云轻量服务器（Ubuntu）上安装 Nginx 并部署高考志愿站
# 用法：sudo bash setup-lighthouse.sh
set -euo pipefail

SITE_DIR=/var/www/gaokao-volunteer
CONF_SRC="$(cd "$(dirname "$0")" && pwd)/nginx-gaokao.conf"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx

mkdir -p "$SITE_DIR"

# 若当前目录有 dist/，直接同步；否则提示稍后上传
if [[ -d ./dist ]]; then
  rsync -a --delete ./dist/ "$SITE_DIR/"
elif [[ -d /tmp/gaokao-dist ]]; then
  rsync -a --delete /tmp/gaokao-dist/ "$SITE_DIR/"
fi

cp "$CONF_SRC" /etc/nginx/sites-available/gaokao-volunteer
ln -sfn /etc/nginx/sites-available/gaokao-volunteer /etc/nginx/sites-enabled/gaokao-volunteer
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl restart nginx

chown -R www-data:www-data "$SITE_DIR"
echo "部署完成：http://$(curl -s ifconfig.me || echo 服务器IP)/"
