# 部署文档

> 本文档详细说明成本分析管理系统的部署流程和配置要求。

---

## 一、系统部署架构

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                              │
│                    (浏览器/移动端)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       负载均衡层                             │
│                     (Nginx/ALB)                             │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│   前端服务器 1     │ │   前端服务器 2     │ │   前端服务器 N     │
│  (Next.js 应用)   │ │  (Next.js 应用)   │ │  (Next.js 应用)   │
└───────────────────┘ └───────────────────┘ └───────────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API 服务器层                           │
│                    (Node.js/Express)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层                              │
│              (PostgreSQL + Redis)                           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 组件说明

| 组件 | 技术栈 | 用途 |
|------|--------|------|
| 负载均衡 | Nginx | 流量分发、SSL终止、静态资源缓存 |
| 前端应用 | Next.js 16 + React 19 | 服务端渲染、静态生成 |
| API服务 | Node.js + Express | 业务逻辑处理 |
| 数据库 | PostgreSQL 15+ | 主数据存储 |
| 缓存 | Redis | 会话缓存、热点数据缓存 |

---

## 二、环境要求

### 2.1 服务器要求

**最低配置（开发/测试环境）**：

| 组件 | CPU | 内存 | 磁盘 | 数量 |
|------|-----|------|------|------|
| 前端服务器 | 2核 | 4GB | 20GB | 1 |
| API服务器 | 2核 | 4GB | 20GB | 1 |
| 数据库服务器 | 2核 | 4GB | 50GB | 1 |

**推荐配置（生产环境）**：

| 组件 | CPU | 内存 | 磁盘 | 数量 |
|------|-----|------|------|------|
| 前端服务器 | 4核 | 8GB | 50GB | 2+ |
| API服务器 | 4核 | 8GB | 50GB | 2+ |
| 数据库服务器 | 4核 | 16GB | 200GB | 1（主）+ 1（从）|
| Redis服务器 | 2核 | 4GB | 20GB | 1 |

### 2.2 软件版本要求

| 软件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 18.x | 20.x LTS |
| PostgreSQL | 14.x | 15.x |
| Redis | 6.x | 7.x |
| Nginx | 1.20 | 1.24 |
| PM2 | 5.x | 最新 |

### 2.3 操作系统要求

- **推荐**：Ubuntu Server 22.04 LTS / CentOS Stream 9
- **备选**：Debian 12 / Rocky Linux 9

---

## 三、部署步骤

### 3.1 环境准备

#### 3.1.1 安装 Node.js

```bash
# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# 验证安装
node -v  # v20.x.x
npm -v   # 10.x.x
```

#### 3.1.2 安装 PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 验证安装
psql --version
```

#### 3.1.3 安装 Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis

# 验证安装
redis-cli ping  # 应返回 PONG
```

#### 3.1.4 安装 PM2

```bash
npm install -g pm2

# 验证安装
pm2 --version
```

### 3.2 数据库初始化

#### 3.2.1 创建数据库

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库
CREATE DATABASE cost_management;

# 创建用户
CREATE USER cost_user WITH ENCRYPTED PASSWORD 'your_password';

# 授权
GRANT ALL PRIVILEGES ON DATABASE cost_management TO cost_user;

# 退出
\q
```

#### 3.2.2 执行迁移脚本

```bash
# 进入项目目录
cd /path/to/project/backend

# 安装依赖
npm install

# 执行迁移
npm run migrate

# 或使用 psql 直接执行
psql -U cost_user -d cost_management -f db/migrations/001_init.sql
```

#### 3.2.3 初始化数据

```bash
# 执行种子数据
npm run seed

# 或手动插入默认配置
psql -U cost_user -d cost_management -f db/seeds/default_configs.sql
```

### 3.3 后端部署

#### 3.3.1 配置环境变量

```bash
cd /path/to/project/backend

# 创建环境变量文件
cp .env.example .env

# 编辑 .env 文件
nano .env
```

**环境变量配置**：
```
# 服务器配置
NODE_ENV=production
PORT=3001

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cost_management
DB_USER=cost_user
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
LOG_DIR=logs
```

#### 3.3.2 安装依赖并构建

```bash
# 安装依赖
npm install --production

# 创建日志目录
mkdir -p logs
mkdir -p uploads
```

#### 3.3.3 使用 PM2 启动

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cost-management-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 3.4 前端部署

#### 3.4.1 配置环境变量

```bash
cd /path/to/project/frontend

# 创建环境变量文件
cp .env.example .env.production

# 编辑 .env.production 文件
nano .env.production
```

**环境变量配置**：
```
# API 地址
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# 应用配置
NEXT_PUBLIC_APP_NAME=成本分析管理系统
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### 3.4.2 构建应用

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

#### 3.4.3 使用 PM2 启动

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cost-management-web',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1G'
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js
```

### 3.5 Nginx 配置

#### 3.5.1 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 3.5.2 配置反向代理

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/cost-management
```

**配置文件内容**：
```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 前端应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # API 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件
    location /uploads {
        alias /path/to/project/backend/uploads;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

#### 3.5.3 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/cost-management /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

---

## 四、环境变量配置清单

### 4.1 后端环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| NODE_ENV | 是 | - | 运行环境：development/production |
| PORT | 否 | 3001 | 服务端口 |
| DB_HOST | 是 | - | 数据库主机 |
| DB_PORT | 否 | 5432 | 数据库端口 |
| DB_NAME | 是 | - | 数据库名称 |
| DB_USER | 是 | - | 数据库用户 |
| DB_PASSWORD | 是 | - | 数据库密码 |
| DB_POOL_MIN | 否 | 2 | 连接池最小连接数 |
| DB_POOL_MAX | 否 | 10 | 连接池最大连接数 |
| REDIS_HOST | 否 | localhost | Redis主机 |
| REDIS_PORT | 否 | 6379 | Redis端口 |
| REDIS_PASSWORD | 否 | - | Redis密码 |
| JWT_SECRET | 是 | - | JWT密钥 |
| JWT_EXPIRES_IN | 否 | 7d | JWT过期时间 |
| UPLOAD_DIR | 否 | uploads | 上传目录 |
| MAX_FILE_SIZE | 否 | 10485760 | 最大文件大小（字节）|
| LOG_LEVEL | 否 | info | 日志级别 |
| LOG_DIR | 否 | logs | 日志目录 |
| CORS_ORIGIN | 否 | * | CORS允许的源 |
| RATE_LIMIT_WINDOW | 否 | 900000 | 限流窗口（毫秒）|
| RATE_LIMIT_MAX | 否 | 100 | 限流最大请求数 |

### 4.2 前端环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| NEXT_PUBLIC_API_URL | 是 | - | API基础URL |
| NEXT_PUBLIC_APP_NAME | 否 | 成本分析管理系统 | 应用名称 |
| NEXT_PUBLIC_APP_VERSION | 否 | 1.0.0 | 应用版本 |

---

## 五、生产环境注意事项

### 5.1 安全配置

#### 5.1.1 数据库安全

- 使用强密码
- 限制数据库访问IP
- 定期备份数据
- 启用SSL连接

```bash
# 修改 pg_hba.conf 限制访问
sudo nano /etc/postgresql/15/main/pg_hba.conf

# 添加规则
hostssl cost_management cost_user 127.0.0.1/32 scram-sha-256
```

#### 5.1.2 应用安全

- 使用 HTTPS
- 设置安全的 JWT 密钥
- 启用 CORS 限制
- 配置请求限流
- 定期更新依赖

#### 5.1.3 服务器安全

- 配置防火墙（只开放必要端口）
- 禁用 root SSH 登录
- 使用密钥认证
- 定期更新系统补丁
- 配置 fail2ban

```bash
# 配置 UFW 防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 5.2 性能优化

#### 5.2.1 数据库优化

- 创建必要的索引
- 定期 VACUUM ANALYZE
- 配置连接池
- 启用查询缓存

```sql
-- 定期维护
VACUUM ANALYZE;

-- 查看慢查询
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 5.2.2 应用优化

- 启用 Gzip 压缩
- 配置静态资源缓存
- 使用 CDN（可选）
- 启用应用缓存

#### 5.2.3 监控

- 配置日志收集
- 设置性能监控
- 配置告警规则

```bash
# PM2 监控
pm2 monit

# 查看日志
pm2 logs

# 查看性能指标
pm2 show cost-management-api
```

### 5.3 备份策略

#### 5.3.1 数据库备份

```bash
# 创建备份脚本
cat > /opt/backup/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backup/db
DB_NAME=cost_management
DB_USER=cost_user

# 创建备份
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# 保留最近30天的备份
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup/backup-db.sh

# 添加定时任务（每天凌晨2点备份）
crontab -e
0 2 * * * /opt/backup/backup-db.sh
```

#### 5.3.2 文件备份

```bash
# 备份上传的文件
cat > /opt/backup/backup-files.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backup/files
SOURCE_DIR=/path/to/project/backend/uploads

# 创建备份
tar -czf $BACKUP_DIR/uploads_${DATE}.tar.gz -C $SOURCE_DIR .

# 保留最近30天的备份
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup/backup-files.sh

# 添加定时任务（每周日凌晨3点备份）
crontab -e
0 3 * * 0 /opt/backup/backup-files.sh
```

### 5.4 故障恢复

#### 5.4.1 数据库恢复

```bash
# 恢复数据库
gunzip -c /opt/backup/db/cost_management_20240301_020000.sql.gz | psql -U cost_user -d cost_management
```

#### 5.4.2 应用重启

```bash
# 重启应用
pm2 restart cost-management-api
pm2 restart cost-management-web

# 查看状态
pm2 status
```

---

## 六、Docker 部署（可选）

### 6.1 Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cost_management
      POSTGRES_USER: cost_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cost_user -d cost_management"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001/api
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 6.2 启动命令

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

---

*文档版本: 1.0*
*最后更新: 2026-03-09*
