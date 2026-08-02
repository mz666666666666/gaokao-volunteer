#!/usr/bin/env bash
# 为 baokaogogogo.com 配置高考志愿站（HTTP）
# 用法：sudo bash setup-domain.sh
set -euo pipefail

DOMAIN=baokaogogogo.com
IP=106.55.156.15
SITE=/var/www/gaokao-volunteer

if [[ ! -f "$SITE/index.html" ]]; then
  echo "站点文件不存在: $SITE"
  exit 1
fi

# 更新/创建域名站点（同时支持根域名与 www）
cat >/etc/nginx/sites-available/gaokao-volunteer <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN} ${IP};

    location = / {
        return 302 /gaokao-volunteer/;
    }

    location = /gaokao-volunteer {
        return 302 /gaokao-volunteer/;
    }

    location /gaokao-volunteer/ {
        root /var/www;
        index index.html;
        try_files \$uri \$uri/ /gaokao-volunteer/index.html;
    }
}
EOF

ln -sfn /etc/nginx/sites-available/gaokao-volunteer /etc/nginx/sites-enabled/gaokao-volunteer

nginx -t
systemctl reload nginx

echo "HTTP 配置完成"
echo "访问：http://${DOMAIN}/gaokao-volunteer/"
