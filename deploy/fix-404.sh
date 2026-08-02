#!/usr/bin/env bash
# 诊断并修复 /gaokao-volunteer/ 404
set -euo pipefail

echo "=== 1. 站点文件 ==="
ls -la /var/www/gaokao-volunteer/ | head -20
test -f /var/www/gaokao-volunteer/index.html && echo "index.html OK" || echo "index.html MISSING"

echo ""
echo "=== 2. snippet ==="
cat /etc/nginx/snippets/gaokao-volunteer.conf 2>/dev/null || echo "snippet MISSING"

echo ""
echo "=== 3. life-energy-api 是否 include ==="
grep -n "gaokao\|include\|location\|proxy_pass\|root\|listen" /etc/nginx/sites-enabled/life-energy-api | head -60

echo ""
echo "=== 4. 重写 snippet（更稳妥的 alias 写法）==="
cat >/etc/nginx/snippets/gaokao-volunteer.conf <<'EOF'
location = /gaokao-volunteer {
    return 302 /gaokao-volunteer/;
}

location ^~ /gaokao-volunteer/ {
    alias /var/www/gaokao-volunteer/;
    index index.html;
    try_files $uri $uri/ /gaokao-volunteer/index.html;
}
EOF

# 确保 include 存在
TARGET=/etc/nginx/sites-enabled/life-energy-api
if ! grep -qF 'snippets/gaokao-volunteer.conf' "$TARGET"; then
  mkdir -p /root/nginx-backups
  cp "$TARGET" "/root/nginx-backups/life-energy-api.$(date +%s)"
  awk '/server[[:space:]]*\{/ && !done { print; print "    include /etc/nginx/snippets/gaokao-volunteer.conf;"; done=1; next } { print }' "$TARGET" >"${TARGET}.tmp"
  mv "${TARGET}.tmp" "$TARGET"
  echo "已重新注入 include"
else
  echo "include 已存在"
fi

# alias + try_files 在部分 nginx 版本有坑：改用独立小 server 仅匹配 Host+路径不现实
# 改用更可靠方案：在同一 server 用 root + ^~
cat >/etc/nginx/snippets/gaokao-volunteer.conf <<'EOF'
location = /gaokao-volunteer {
    return 302 /gaokao-volunteer/;
}

location ^~ /gaokao-volunteer/ {
    root /var/www;
    index index.html;
    try_files $uri $uri/ /gaokao-volunteer/index.html;
}
EOF

nginx -t
systemctl reload nginx

echo ""
echo "=== 5. 本地请求测试 ==="
curl -sI "http://127.0.0.1/gaokao-volunteer/" | head -15
curl -sI "http://127.0.0.1/gaokao-volunteer/index.html" | head -10
echo ""
echo "完成后浏览器访问：http://106.55.156.15/gaokao-volunteer/"
