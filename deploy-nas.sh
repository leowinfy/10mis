#!/bin/bash

# 极空间NAS部署脚本
# 这个脚本会自动检测并设置正确的UID/GID

echo "=== 10mins Diary NAS 部署脚本 ==="
echo

# 检测挂载目录的UID/GID
DATA_DIR="./data"
BACKUP_DIR="./backups"

# 创建目录（如果不存在）
mkdir -p "$DATA_DIR" "$BACKUP_DIR"

# 获取目录的UID/GID
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    HOST_UID=$(stat -c "%u" "$DATA_DIR" 2>/dev/null || echo 1000)
    HOST_GID=$(stat -c "%g" "$DATA_DIR" 2>/dev/null || echo 1000)
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    HOST_UID=$(stat -f "%u" "$DATA_DIR" 2>/dev/null || echo 1000)
    HOST_GID=$(stat -f "%g" "$DATA_DIR" 2>/dev/null || echo 1000)
else
    # 默认值
    HOST_UID=1000
    HOST_GID=1000
fi

echo "检测到数据目录权限: UID=$HOST_UID, GID=$HOST_GID"
echo

# 导出环境变量
export USER_ID=$HOST_UID
export GROUP_ID=$HOST_GID

# 构建镜像
echo "构建Docker镜像..."
docker build \
  --build-arg USER_ID=$HOST_UID \
  --build-arg GROUP_ID=$HOST_GID \
  -t leowinfy/10mins:nas-custom .

# 停止旧容器
echo "停止旧容器..."
docker-compose -f docker-compose.nas-flexible.yml down 2>/dev/null || true

# 启动新容器
echo "启动新容器..."
USER_ID=$HOST_UID GROUP_ID=$HOST_GID docker-compose -f docker-compose.nas-flexible.yml up -d

echo
echo "=== 部署完成 ==="
echo "访问地址: http://localhost:3000"
echo "查看日志: docker-compose -f docker-compose.nas-flexible.yml logs -f"
echo
echo "如果仍有权限问题，请尝试："
echo "1. 手动设置目录权限: sudo chown -R $HOST_UID:$HOST_GID ./data ./backups"
echo "2. 或使用 root 运行: docker run -d --user 0:0 ..."