#!/usr/bin/env bash
# 将高考志愿站部署到域名根路径（去掉 /gaokao-volunteer）
# 域名：baokaogogogo.com
# 在 OrcaTerm 执行：
#   curl -fsSL https://raw.githubusercontent.com/mz666666666666/gaokao-volunteer/main/deploy/setup-domain-root.sh | sudo bash
set -euo pipefail

DOMAIN="baokaogogogo.com"
SITE_DIR=/var/www/gaokao-volunteer
REPO_DIR=/opt/gaokao-volunteer
SERVER_IP="106.55.156.15"

export DEBIAN_FRONTEND=noninteractive

echo "==> 安装 Nginx / Node / Certbot ..."
apt-get update -y
apt-get install -y nginx curl git ca-certificates
# Node 20
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> 拉取源码并构建（base=/）..."
if [[ -d "$REPO_DIR/.git" ]]; then
  git -C "$REPO_DIR" fetch --depth 1 origin main
  git -C "$REPO_DIR" reset --hard origin/main
else
  rm -rf "$REPO_DIR"
  git clone --depth 1 https://github.com/mz666666666666/gaokao-volunteer.git "$REPO_DIR"
fi

cd "$REPO_DIR"
npm ci
VITE_BASE_PATH=/ npm run build

mkdir -p "$SITE_DIR"
rm -rf "${SITE_DIR:?}/"*
cp -a "$REPO_DIR/dist"/. "$SITE_DIR/"
cp -f "$SITE_DIR/index.html" "$SITE_DIR/404.html"
chown -R www-data:www-data "$SITE_DIR"

# 清理旧的子路径挂载
rm -f /etc/nginx/sites-enabled/gaokao-volunteer
sed -i '/snippets\/gaokao-volunteer.conf/d' /etc/nginx/sites-enabled/life-energy-api 2>/dev/null || true
rm -f /etc/nginx/snippets/gaokao-volunteer.conf

echo "==> 写入域名站点配置（HTTP）..."
cat >/etc/nginx/sites-available/baokaogogogo.com <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN} ${SERVER_IP};

    root ${SITE_DIR};
    index index.html;

    # 旧路径兼容
    location = /gaokao-volunteer {
        return 301 /;
    }
    location /gaokao-volunteer/ {
        return 301 /;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
EOF

ln -sfn /etc/nginx/sites-available/baokaogogogo.com /etc/nginx/sites-enabled/baokaogogogo.com

nginx -t
systemctl reload nginx

echo "==> 当前域名解析检查 ..."
getent hosts "$DOMAIN" || true
getent hosts "www.$DOMAIN" || true

# 若已解析到本机，尝试申请 HTTPS
RESOLVED_IP=$(getent ahostsv4 "$DOMAIN" | awk '{print $1; exit}' || true)
if [[ "$RESOLVED_IP" == "$SERVER_IP" ]]; then
  echo "==> DNS 已指向本机，申请 Let's Encrypt 证书 ..."
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect || {
    echo "证书申请失败（可稍后手动执行 certbot）。HTTP 站点已可用。"
  }
else
  echo "DNS 尚未指向 ${SERVER_IP}（当前: ${RESOLVED_IP:-未解析}）"
  echo "请先在腾讯云解析 A 记录后再执行："
  echo "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

echo ""
echo "========================================"
echo " 部署完成"
echo " HTTP : http://${DOMAIN}/"
echo " 兼容 : http://${SERVER_IP}/"
echo "========================================"
