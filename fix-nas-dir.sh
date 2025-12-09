#!/bin/bash

# 极空间NAS数据目录权限修复脚本
# 在NAS的SSH终端中运行

echo "=== 极空间NAS权限修复工具 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$(id -u)" -ne 0 ]; then
   echo -e "${RED}请使用 sudo 运行此脚本${NC}"
   echo "示例: sudo bash fix-nas-dir.sh"
   exit 1
fi

# 获取数据目录路径
read -p "请输入数据目录路径 (例如: /docker/10mins/data): " DATA_DIR
read -p "请输入备份目录路径 (例如: /docker/10mins/backups): " BACKUP_DIR

# 设置默认值
if [ -z "$DATA_DIR" ]; then
    DATA_DIR="/docker/10mins/data"
fi

if [ -z "$BACKUP_DIR" ]; then
    BACKUP_DIR="/docker/10mins/backups"
fi

echo ""
echo -e "${YELLOW}将要修复以下目录的权限:${NC}"
echo "数据目录: $DATA_DIR"
echo "备份目录: $BACKUP_DIR"
echo ""

# 确认
read -p "确认继续? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

# 创建目录（如果不存在）
echo -e "${GREEN}1. 创建目录...${NC}"
mkdir -p "$DATA_DIR"
mkdir -p "$BACKUP_DIR"

# 修复权限
echo -e "${GREEN}2. 修复目录权限...${NC}"
chown -R 1000:1000 "$DATA_DIR" 2>/dev/null || echo "警告: 无法修改所有者，尝试使用777权限"
chown -R 1000:1000 "$BACKUP_DIR" 2>/dev/null || echo "警告: 无法修改所有者，尝试使用777权限"

# 如果chown失败，使用777权限
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}使用777权限作为替代方案...${NC}"
    chmod -R 777 "$DATA_DIR"
    chmod -R 777 "$BACKUP_DIR"
else
    chmod -R 755 "$DATA_DIR"
    chmod -R 755 "$BACKUP_DIR"
fi

# 创建必要的子目录
echo -e "${GREEN}3. 创建必要的子目录...${NC}"
mkdir -p "$DATA_DIR/db"
mkdir -p "$DATA_DIR/uploads"

# 创建初始数据库文件
if [ ! -f "$DATA_DIR/db/diaries.json" ]; then
    echo -e "${GREEN}4. 创建初始数据库文件...${NC}"
    echo "[]" > "$DATA_DIR/db/diaries.json"
    chown 1000:1000 "$DATA_DIR/db/diaries.json" 2>/dev/null || chmod 666 "$DATA_DIR/db/diaries.json"
fi

# 设置文件权限
echo -e "${GREEN}5. 设置文件权限...${NC}"
chmod 666 "$DATA_DIR/db/diaries.json" 2>/dev/null || true

# 显示最终状态
echo ""
echo -e "${GREEN}=== 修复完成 ===${NC}"
echo ""
echo "目录权限状态:"
ls -la "$DATA_DIR"
ls -la "$DATA_DIR/db"
ls -la "$BACKUP_DIR"

echo ""
echo -e "${YELLOW}请现在重新启动Docker容器${NC}"
echo "容器启动后，应该能够正常创建和保存日记"

echo ""
echo "如果仍有问题，可以："
echo "1. 在Docker设置中启用'特权模式'"
echo "2. 或者使用镜像: leowinfy/10mins:root（即将构建）"