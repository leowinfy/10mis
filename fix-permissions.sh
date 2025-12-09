#!/bin/bash

# 极空间NAS权限修复脚本
# 用于修复 /app/data 目录的权限问题

echo "=== 10mins Diary 权限修复脚本 ==="
echo "正在修复 /app/data 目录权限..."

# 停止容器
echo "1. 停止现有容器..."
docker stop 10mins-diary 2>/dev/null || true
docker rm 10mins-diary 2>/dev/null || true

# 获取当前用户权限（假设是1000）
USER_ID=1000
GROUP_ID=1000

echo "2. 修复数据目录权限..."
sudo chown -R $USER_ID:$GROUP_ID ./data 2>/dev/null || echo "请手动执行: sudo chown -R $USER_ID:$GROUP_ID ./data"
sudo chown -R $USER_ID:$GROUP_ID ./backups 2>/dev/null || echo "请手动执行: sudo chown -R $USER_ID:$GROUP_ID ./backups"

echo "3. 启动容器..."
docker run -d \
  --name 10mins-diary \
  --restart unless-stopped \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./backups:/app/backups \
  -e NODE_ENV=production \
  -e DATABASE_URL=file:./data/db/diaries.json \
  -e UPLOAD_DIR=/app/data/uploads \
  leowinfy/10mins:v4.1.7

echo ""
echo "4. 检查容器状态..."
sleep 3
docker logs 10mins-diary | tail -20

echo ""
echo "=== 部署完成 ==="
echo "访问地址: http://localhost:3000"
echo ""
echo "如果仍有权限问题，请尝试："
echo "1. 使用 root 权限运行容器: docker run -d --user 0:0 ..."
echo "2. 或修改数据目录为正确的权限"