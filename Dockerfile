# 使用官方Node.js 20镜像
FROM node:20-alpine AS base

# 设置标签信息
LABEL maintainer="leowinfy <winfylau@hotmail.com>"
LABEL description="每天十分钟 - 专注于培养写作习惯的优雅日记应用"
LABEL repository="https://github.com/leowinfy/10mins"
LABEL version="4.1.7"

# 安装依赖阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制package文件
COPY package.json package-lock.json* ./
# 安装依赖
RUN npm ci --legacy-peer-deps

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制依赖和源码
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 获取构建时的UID和GID（如果设置了的话）
ARG USER_ID=1000
ARG GROUP_ID=1000

# 创建用户组
RUN if [ "$(getent passwd $USER_ID)" ]; then \
        echo "User with UID $USER_ID already exists"; \
    else \
        addgroup --system --gid $GROUP_ID appgroup && \
        adduser --system --uid $USER_ID --gid $GROUP_ID appuser; \
    fi

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 创建数据目录
RUN mkdir -p /app/data/uploads /app/data/db /app/backups

# 创建启动脚本，处理不同的UID场景
RUN cat > /app/start.cjs << 'EOF'
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.join(process.cwd(), 'data', 'db');
const DIARIES_FILE = path.join(DATA_DIR, 'diaries.json');
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

console.log('=== 10mins Diary Starting ===');
console.log('Running as user:', execSync('id').toString().trim());
console.log('Working directory:', process.cwd());
console.log('Node.js version:', process.version);

// 确保数据目录存在
try {
  // 创建数据目录
  if (!fs.existsSync(DATA_DIR)) {
    console.log('Creating data directory:', DATA_DIR);
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 创建上传目录
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log('Creating upload directory:', UPLOAD_DIR);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // 创建初始数据库文件
  if (!fs.existsSync(DIARIES_FILE)) {
    console.log('Creating database file:', DIARIES_FILE);
    fs.writeFileSync(DIARIES_FILE, '[]', 'utf8');
  }

  // 检查文件权限，如果没有权限则尝试修复
  try {
    fs.accessSync(DIARIES_FILE, fs.constants.W_OK);
    console.log('Database file is writable');
  } catch (accessError) {
    console.log('Database file is not writable, attempting to fix permissions...');
    try {
      // 尝试修改文件权限
      fs.chmodSync(DIARIES_FILE, 0o666);
      console.log('Fixed database file permissions');
    } catch (chmodError) {
      console.error('Cannot fix permissions for database file');
      console.error('This usually means the volume is mounted with incorrect ownership');
      console.error('Try running the container with the same UID/GID as the host volume owner');
      console.error('Or use --user $(id -u):$(id -g) when running docker');
      // 不要退出，让主应用尝试处理
      console.log('Continuing startup despite permission issues...');
    }
  }

  // 测试数据目录是否可写
  const testFile = path.join(DATA_DIR, '.test');
  try {
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('Data directory is writable');
  } catch (dirWriteError) {
    console.warn('Warning: Data directory may not be writable');
    console.warn('Application might not be able to save data');
    // 不要退出，让主应用处理
  }

} catch (error) {
  console.error('Error initializing data:', error);
  console.error('Will attempt to start application anyway...');
}

console.log('Starting application...');
EOF

# 设置文件权限
RUN chown -R $USER_ID:$GROUP_ID /app

# 切换到应用用户
USER $USER_ID

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["sh", "-c", "node start.cjs && node server.js"]