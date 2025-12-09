#!/bin/sh

# 日记应用备份脚本
# 每日自动备份数据和图片

# 设置变量
APP_DIR="/app"
DATA_DIR="$APP_DIR/data"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# 创建备份目录（如果不存在）
mkdir -p $BACKUP_DIR

echo "[$TIMESTAMP] 开始备份..."

# 1. 备份日记数据
echo "备份日记数据..."
if [ -f "$DATA_DIR/db/diaries.json" ]; then
    cp "$DATA_DIR/db/diaries.json" "$BACKUP_DIR/diaries-$DATE.json"
    echo "日记数据备份完成: diaries-$DATE.json"
else
    echo "警告: 日记数据文件不存在"
fi

# 2. 打包上传的图片
echo "备份图片文件..."
if [ -d "$DATA_DIR/uploads" ] && [ "$(ls -A $DATA_DIR/uploads)" ]; then
    cd $DATA_DIR
    tar -czf "$BACKUP_DIR/images-$DATE.tar.gz" uploads/
    echo "图片备份完成: images-$DATE.tar.gz"
else
    echo "没有图片文件需要备份"
fi

# 3. 创建完整备份包
echo "创建完整备份包..."
cd $APP_DIR
tar -czf "$BACKUP_DIR/full-backup-$DATE.tar.gz" data/

# 4. 清理旧备份（保留最近30天）
echo "清理旧备份..."
find $BACKUP_DIR -name "*.json" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# 5. 列出所有备份文件
echo ""
echo "当前备份文件:"
ls -lh $BACKUP_DIR

echo ""
echo "[$TIMESTAMP] 备份完成！"