#!/bin/bash
set -e

# 获取PUID/PGID，默认为1000
PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "=== 10mins Diary Entrypoint ==="
echo "Running as user: $(id)"
echo "Desired UID/GID: $PUID:$PGID"

# 确保数据目录存在
mkdir -p /app/data/db /app/data/uploads /app/backups

# 调整数据目录权限
echo "Adjusting directory permissions..."
chown -R $PUID:$PGID /app/data /app/backups
chmod -R 775 /app/data /app/backups

# 创建并设置数据库文件权限
if [ ! -f "/app/data/db/diaries.json" ]; then
    echo "Creating initial database file..."
    echo "[]" > /app/data/db/diaries.json
fi
chown $PUID:$PGID /app/data/db/diaries.json
chmod 666 /app/data/db/diaries.json

# 如果当前用户是root，切换到指定用户
if [ "$(id -u)" = "0" ]; then
    echo "Switching to user $PUID:$PGID..."
    exec gosu $PUID:$PGID "$@"
else
    echo "Running as current user..."
    exec "$@"
fi