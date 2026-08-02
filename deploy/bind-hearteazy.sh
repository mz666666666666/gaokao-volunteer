#!/usr/bin/env bash
# 绑定域名 hearteazy.cn 到高考志愿站
set -euo pipefail

IP=106.55.156.15
DOMAIN=hearteazy.cn
SITE=/var/www/gaokao-volunteer

test -f "$SITE/index.html" || { echo "站点文件缺失: $SITE"; exit 1; }

# 从 life-energy 去掉旧 include（若还在）
sed -i '/snippets\/gaokao-volunteer.conf/d' /etc/nginx/sites-enabled/life-energy-api 2>/dev/null || true

cat >/etc/nginx/sites-available/gaokao-volunteer <<NGX
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
NGX

ln -sfn /etc/nginx/sites-available/gaokao-volunteer /etc/nginx/sites-enabled/gaokao-volunteer
nginx -t
systemctl reload nginx

echo "Nginx 已支持域名："
echo "  http://${DOMAIN}/gaokao-volunteer/"
echo "  http://www.${DOMAIN}/gaokao-volunteer/"
echo "  http://${IP}/gaokao-volunteer/"
