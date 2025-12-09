# 使用官方Node.js 20镜像
FROM node:20-alpine AS base

# 安装gosu用于切换用户
RUN apk add --no-cache gosu

# 设置标签信息
LABEL maintainer="leowinfy <winfylau@hotmail.com>"
LABEL description="每天十分钟 - 专注于培养写作习惯的优雅日记应用 (NAS版本)"
LABEL repository="https://github.com/leowinfy/10mins"
LABEL version="4.1.7-nas"

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

# 复制entrypoint脚本
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

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

# 使用entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]