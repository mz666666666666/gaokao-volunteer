/**
 * 部署 dist/ 到阿里云 OSS 静态网站托管
 * 用法：npm run deploy:aliyun
 * 需配置 .env.aliyun（见 .env.aliyun.example）
 */
import OSS from "ali-oss";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(rootDir, ".env.aliyun"));

const region = process.env.ALIYUN_OSS_REGION || "oss-cn-hangzhou";
const bucket = process.env.ALIYUN_OSS_BUCKET || "gaokao-volunteer";
const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || "";
const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || "";

if (!accessKeyId || !accessKeySecret) {
  console.error("缺少阿里云凭证，请创建 .env.aliyun 并填写 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET");
  console.error("参考：.env.aliyun.example");
  process.exit(1);
}

function ensureDist() {
  if (fs.existsSync(path.join(distDir, "index.html"))) {
    return;
  }
  console.log("未找到 dist/，正在执行 npm run build …");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function walkFiles(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, base));
    } else {
      files.push({
        abs: full,
        key: path.relative(base, full).replace(/\\/g, "/"),
      });
    }
  }
  return files;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  return map[ext] || "application/octet-stream";
}

async function ensureBucket(client) {
  try {
    await client.getBucketInfo(bucket);
    console.log(`Bucket 已存在：${bucket}`);
  } catch (error) {
    if (error.code !== "NoSuchBucket") {
      throw error;
    }
    console.log(`创建 Bucket：${bucket}（${region}）…`);
    try {
      await client.putBucket(bucket, {
        StorageClass: "Standard",
        DataRedundancyType: "LRS",
      });
    } catch (createError) {
      if (createError.code === "UserDisable" || createError.code === "Forbidden") {
        console.error("\n无法自动创建 Bucket，请先在阿里云控制台手动创建：");
        console.error("  1. 打开 https://oss.console.aliyun.com/bucket");
        console.error("  2. 点击「创建 Bucket」");
        console.error(`  3. 名称填：${bucket}`);
        console.error("  4. 地域选：华东1（杭州）");
        console.error("  5. 读写权限：公共读");
        console.error("  6. 创建后重新运行：npm run deploy:aliyun");
        console.error("\n若提示需实名认证，请先到账号中心完成实名认证并开通 OSS 服务。");
        process.exit(1);
      }
      throw createError;
    }
  }

  await client.putBucketACL(bucket, "public-read");
  await client.putBucketWebsite(bucket, {
    IndexDocument: "index.html",
    ErrorDocument: "404.html",
  });
  console.log("已开启静态网站托管（index.html / 404.html）");
}

async function uploadDist(client) {
  const indexPath = path.join(distDir, "index.html");
  const notFoundPath = path.join(distDir, "404.html");
  fs.copyFileSync(indexPath, notFoundPath);

  const files = walkFiles(distDir);
  console.log(`上传 ${files.length} 个文件…`);

  for (const file of files) {
    const cacheControl = file.key.startsWith("assets/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300";
    await client.put(file.key, file.abs, {
      headers: {
        "Content-Type": contentTypeFor(file.abs),
        "Cache-Control": cacheControl,
      },
    });
    process.stdout.write(`  ✓ ${file.key}\n`);
  }
}

function websiteUrl() {
  // 中国内地 Bucket 无 oss-website 默认域名，需用 Bucket 外网域名访问根路径
  const regionSuffix = region.replace(/^oss-/, "");
  return `http://${bucket}.oss-${regionSuffix}.aliyuncs.com/`;
}

async function main() {
  ensureDist();

  const client = new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
  });

  await ensureBucket(client);
  await uploadDist(client);

  const url = websiteUrl();
  console.log("\n部署完成！");
  console.log(`访问地址：${url}`);
  console.log("\n说明：中国内地 OSS 无 oss-website 默认域名，请用上方 Bucket 域名访问。");
  console.log("若浏览器触发下载而非打开页面，需在 OSS 控制台绑定已备案的自定义域名。");
}

main().catch((error) => {
  console.error("\n部署失败：", error.message || error);
  if (error.code === "InvalidAccessKeyId") {
    console.error("AccessKey ID 无效，请检查 .env.aliyun");
  }
  if (error.code === "AccessDenied") {
    console.error("权限不足，请确认 RAM 用户拥有 OSS 读写与 Bucket 管理权限");
  }
  process.exit(1);
});
