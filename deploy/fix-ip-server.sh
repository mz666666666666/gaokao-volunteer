#!/usr/bin/env bash
# 用独立 server_name=公网IP 托管高考志愿站，避开 life-energy-api 路由
set -euo pipefail

IP=$(curl -fsSL https://ifconfig.me || echo "106.55.156.15")
SITE=/var/www/gaokao-volunteer

# 确保文件存在
if [[ ! -f "$SITE/index.html" ]]; then
  TMP=$(mktemp -d)
  curl -fsSL "https://codeload.github.com/mz666666666666/gaokao-volunteer/zip/refs/heads/gh-pages" -o "$TMP/z.zip"
  unzip -qo "$TMP/z.zip" -d "$TMP"
  EXTRACTED=$(find "$TMP" -maxdepth 1 -type d -name 'gaokao-volunteer-gh-pages*' | head -n1)
  mkdir -p "$SITE"
  cp -a "$EXTRACTED"/. "$SITE/"
  chown -R www-data:www-data "$SITE"
  rm -rf "$TMP"
fi

# 从 life-energy-api 去掉无效 include（可选，避免干扰）
if [[ -f /etc/nginx/sites-enabled/life-energy-api ]]; then
  sed -i '/snippets\/gaokao-volunteer.conf/d' /etc/nginx/sites-enabled/life-energy-api
fi

cat >/etc/nginx/sites-available/gaokao-volunteer <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${IP};

    # 根路径跳转子应用
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
rm -f /etc/nginx/sites-enabled/*.bak /etc/nginx/sites-enabled/*.tmp

nginx -t
systemctl reload nginx

echo "=== 测试 ==="
curl -sI -H "Host: ${IP}" "http://127.0.0.1/gaokao-volunteer/" | head -12
curl -sI -H "Host: ${IP}" "http://127.0.0.1/gaokao-volunteer/index.html" | head -8
echo ""
echo "请访问：http://${IP}/gaokao-volunteer/"
