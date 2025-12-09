#!/bin/sh

echo "=== Starting 10mins Diary Application ==="
echo "Current user: $(id)"
echo "Current working directory: $(pwd)"

# 检查FORCE_ROOT环境变量
if [ "$FORCE_ROOT" = "true" ]; then
    echo "Running as root (FORCE_ROOT=true)"

    # 确保数据目录存在
    echo "Creating data directories..."
    mkdir -p /app/data/uploads /app/data/db /app/backups

    # 设置权限（但保持root用户运行）
    chmod -R 755 /app/data /app/backups

    # 创建初始数据库文件
    if [ ! -f "/app/data/db/diaries.json" ]; then
        echo "Creating initial database file..."
        echo "[]" > /app/data/db/diaries.json
    fi

    # 显示数据目录状态
    echo "Data directory permissions:"
    ls -la /app/data/ 2>/dev/null || true

    echo "Starting application as root..."
    exec node server.js
else
    # 原有的降权逻辑
    RUN_USER="nextjs"
    RUN_GROUP="nodejs"

    # 确保数据目录存在
    mkdir -p /app/data/uploads /app/data/db /app/backups

    # 设置目录权限
    chown -R $RUN_USER:$RUN_GROUP /app/data /app/backups

    # 创建初始数据库文件
    if [ ! -f "/app/data/db/diaries.json" ]; then
        echo "Creating initial database file..."
        echo "[]" > /app/data/db/diaries.json
        chown $RUN_USER:$RUN_GROUP /app/data/db/diaries.json
    fi

    # 降权运行应用
    echo "Switching to $RUN_USER user..."
    exec su-exec $RUN_USER:$RUN_GROUP node server.js
fi