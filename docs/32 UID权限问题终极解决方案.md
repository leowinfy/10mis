# 极空间NAS UID权限问题终极解决方案

## 问题本质

极空间NAS上的Docker容器内Node.js进程无法写入宿主机映射的目录，根本原因是：
- 宿主机目录的UID/GID（通常是1000:1000）
- 容器内应用的UID/GID（可能是其他值）
- 权限不匹配导致写入失败

## 解决方案

### 方案一：让容器UID与宿主机匹配（推荐）

1. **构建时指定UID/GID为1000**
```bash
# 构建镜像时指定UID/GID
docker build --build-arg USER_ID=1000 --build-arg GROUP_ID=1000 -t leowinfy/10mins:latest .
```

2. **使用docker-compose部署**
```yaml
version: '3.8'

services:
  10mins:
    image: leowinfy/10mins:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
    environment:
      - NODE_ENV=production
      - UPLOAD_DIR=/app/data/uploads
    user: "1000:1000"  # 使用与宿主机相同的UID/GID
    restart: unless-stopped
```

3. **使用docker run部署**
```bash
docker run -d \
  --name 10mins-diary \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./backups:/app/backups \
  -e NODE_ENV=production \
  -e UPLOAD_DIR=/app/data/uploads \
  --user 1000:1000 \
  leowinfy/10mins:latest
```

### 方案二：修改宿主机目录权限

1. **查看容器内应用的UID/GID**
```bash
# 先以root运行查看
docker run --rm leowinfy/10mins:latest id

# 输出示例：
# uid=1001(nextjs) gid=1001(nodejs) groups=1001(nodejs)
```

2. **修改宿主机目录权限**
```bash
# 假设容器内UID是1001
sudo chown -R 1001:1001 ./data
sudo chown -R 1001:1001 ./backups
```

### 方案三：使用固定UID/GID构建

1. **创建固定的docker-compose文件**
```yaml
# docker-compose.uid1000.yml
version: '3.8'

services:
  10mins:
    build:
      context: .
      args:
        USER_ID: 1000
        GROUP_ID: 1000
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
    environment:
      - NODE_ENV=production
      - UPLOAD_DIR=/app/data/uploads
    restart: unless-stopped
```

2. **构建并运行**
```bash
# 使用固定UID配置
docker-compose -f docker-compose.uid1000.yml up --build -d
```

## 极空间NAS特殊处理

### 1. 检查极空间NAS的UID/GID

登录极空间NAS的SSH或终端：
```bash
# 查看目录权限
ls -la /your/mount/path

# 输出示例：
# drwxrwxr-x 1000 1000 4096 Dec  9 18:30 data
```

### 2. 根据查看到的UID/GID配置

如果看到的是`1000:1000`，则使用方案一的配置。

### 3. 在极空间NAS上部署

```bash
# 下载镜像
docker pull leowinfy/10mins:latest

# 创建数据目录
mkdir -p /path/to/nas/data
mkdir -p /path/to/nas/backups

# 运行容器（使用UID 1000）
docker run -d \
  --name 10mins-diary \
  -p 3000:3000 \
  -v /path/to/nas/data:/app/data \
  -v /path/to/nas/backups:/app/backups \
  -e NODE_ENV=production \
  --user 1000:1000 \
  leowinfy/10mins:latest
```

## 验证部署

### 检查容器日志
```bash
docker logs 10mins-diary
```

应该看到类似输出：
```
=== 10mins Diary Starting ===
Running as user: uid=1000 gid=1000 groups=1000
Working directory: /app
Database file is writable
Starting application...
```

### 测试创建日记
1. 访问 http://NAS-IP:3000
2. 创建一条日记
3. 检查数据是否持久化

## 不同环境的最佳实践

### 1. 极空间NAS
- 使用 `--user 1000:1000`
- 确保挂载目录可写

### 2. Docker Desktop (Windows)
- 使用默认配置
- 不需要特殊处理

### 3. Linux服务器
- 检查宿主机目录权限
- 使用与宿主机相同的UID/GID

### 4. 云服务器 (阿里云/腾讯云等)
- 通常使用 `--user 1000:1000`
- 或修改目录权限匹配

## 常见问题排查

### 1. 权限被拒绝
```
Error: EACCES: permission denied, open '/app/data/db/diaries.json'
```
**解决**：检查容器和宿主机的UID/GID是否匹配

### 2. 数据未持久化
**解决**：确保正确挂载了数据目录

### 3. 容器启动失败
**解决**：检查Docker日志，确认用户创建是否成功

## 自动化脚本

创建一个部署脚本 `deploy.sh`：
```bash
#!/bin/bash

# 检测宿主机的UID/GID
HOST_UID=$(id -u)
HOST_GID=$(id -g)

echo "Host UID/GID: $HOST_UID:$HOST_GID"

# 构建镜像
docker build \
  --build-arg USER_ID=$HOST_UID \
  --build-arg GROUP_ID=$HOST_GID \
  -t 10mins-diary .

# 运行容器
docker run -d \
  --name 10mins-diary \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./backups:/app/backups \
  --user $HOST_UID:$HOST_GID \
  10mins-diary

echo "部署完成！"
echo "访问地址: http://localhost:3000"
```

这个脚本会自动检测宿主机的UID/GID并使用相同的配置运行容器。