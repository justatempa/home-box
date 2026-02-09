# Home Box Linux 部署指南

## 📋 系统要求

- **操作系统**: Linux (Ubuntu 20.04+, CentOS 7+, Debian 10+ 等)
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **内存**: >= 512MB
- **磁盘**: >= 1GB

## 🚀 快速部署

### 1. 上传代码到服务器

```bash
# 使用 git 克隆（推荐）
git clone <your-repo-url> /opt/home-box
cd /opt/home-box

# 或使用 scp 上传
scp -r ./home-box user@server:/opt/home-box
```

### 2. 赋予脚本执行权限

```bash
chmod +x start.sh
```

### 3. 完整安装

```bash
./start.sh install
```

这个命令会自动完成：
- ✅ 检查 Node.js 和 npm
- ✅ 创建必要的目录
- ✅ 安装依赖包
- ✅ 初始化数据库
- ✅ 生成 Prisma Client
- ✅ 运行数据库迁移
- ✅ 创建管理员账号
- ✅ 构建生产版本

### 4. 启动应用

```bash
./start.sh start
```

应用将在后台运行，访问地址：`http://localhost:3002`

## 📝 脚本命令

### 基本命令

```bash
# 启动应用（后台运行）
./start.sh start

# 停止应用
./start.sh stop

# 重启应用
./start.sh restart

# 查看应用状态
./start.sh status

# 查看应用日志（最后 50 行）
./start.sh logs

# 查看错误日志（最后 50 行）
./start.sh errors

# 重新构建应用
./start.sh build

# 显示帮助信息
./start.sh help
```

### 完整安装流程

```bash
# 首次部署时执行
./start.sh install

# 安装完成后启动
./start.sh start
```

## 🔧 配置说明

### 环境变量

脚本中已配置以下环境变量：

```bash
NODE_ENV=production
PORT=3002
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_SECRET="mmmmmmmmmmmmmmmmmmm"
NEXTAUTH_URL="http://localhost:3002"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="123456"
```

### 修改配置

如需修改配置，编辑 `start.sh` 文件中的配置变量部分：

```bash
# 配置变量
APP_NAME="home-box"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=3002  # 修改端口
PID_FILE="$APP_DIR/.home-box.pid"
LOG_FILE="$APP_DIR/logs/app.log"
ERROR_LOG_FILE="$APP_DIR/logs/error.log"

# 环境变量
export NEXTAUTH_SECRET="mmmmmmmmmmmmmmmmmmm"  # 修改密钥
export ADMIN_USERNAME="admin"  # 修改管理员用户名
export ADMIN_PASSWORD="123456"  # 修改管理员密码
```

## 📂 目录结构

```
home-box/
├── start.sh              # 启动脚本
├── .home-box.pid         # 进程 PID 文件
├── logs/                 # 日志目录
│   ├── app.log          # 应用日志
│   └── error.log        # 错误日志
├── prisma/              # 数据库目录
│   └── prod.db          # SQLite 数据库文件
├── public/              # 静态资源
│   └── uploads/         # 上传文件目录
└── ...
```

## 🔍 日志管理

### 查看实时日志

```bash
# 实时查看应用日志
tail -f logs/app.log

# 实时查看错误日志
tail -f logs/error.log
```

### 日志轮转

建议配置 logrotate 进行日志轮转：

```bash
# 创建 logrotate 配置
sudo nano /etc/logrotate.d/home-box
```

添加以下内容：

```
/opt/home-box/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 your-username your-username
}
```

## 🔐 安全建议

### 1. 修改默认密码

首次登录后，立即修改管理员密码：
1. 登录系统
2. 进入用户管理
3. 修改 admin 用户密码

### 2. 修改密钥

生产环境建议使用强密钥：

```bash
# 生成随机密钥
openssl rand -base64 32
```

将生成的密钥替换 `start.sh` 中的 `NEXTAUTH_SECRET`。

### 3. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 3002/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

### 4. 使用反向代理

建议使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔄 系统服务配置（可选）

### 使用 systemd 管理

1. 编辑服务文件 `home-box.service`：

```bash
sudo nano /etc/systemd/system/home-box.service
```

2. 修改以下内容：
   - `User` 和 `Group`: 改为你的用户名
   - `WorkingDirectory`: 改为实际路径
   - `ExecStart` 和 `ExecStop`: 改为实际路径

3. 启用并启动服务：

```bash
# 重载 systemd 配置
sudo systemctl daemon-reload

# 启用开机自启
sudo systemctl enable home-box

# 启动服务
sudo systemctl start home-box

# 查看状态
sudo systemctl status home-box

# 查看日志
sudo journalctl -u home-box -f
```

### systemd 命令

```bash
# 启动服务
sudo systemctl start home-box

# 停止服务
sudo systemctl stop home-box

# 重启服务
sudo systemctl restart home-box

# 查看状态
sudo systemctl status home-box

# 启用开机自启
sudo systemctl enable home-box

# 禁用开机自启
sudo systemctl disable home-box
```

## 🐛 故障排查

### 应用无法启动

1. 检查端口是否被占用：
```bash
lsof -i :3002
```

2. 查看错误日志：
```bash
./start.sh errors
```

3. 检查 Node.js 版本：
```bash
node -v  # 应该 >= 18.0.0
```

### 数据库错误

1. 删除数据库重新初始化：
```bash
rm -f prisma/prod.db
./start.sh install
```

2. 检查数据库文件权限：
```bash
ls -la prisma/prod.db
```

### 进程管理问题

1. 清理僵尸进程：
```bash
./start.sh stop
rm -f .home-box.pid
./start.sh start
```

2. 手动查找并杀死进程：
```bash
# 查找进程
ps aux | grep "next start"

# 杀死进程
kill -9 <PID>
```

## 📊 性能优化

### 1. 使用 PM2 管理（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "home-box" -- start

# 保存配置
pm2 save

# 开机自启
pm2 startup
```

### 2. 数据库优化

SQLite 默认配置已足够，如需更高性能可迁移到 PostgreSQL：

1. 修改 `DATABASE_URL`
2. 运行 `npm run db:push`

## 🔄 更新部署

```bash
# 1. 停止应用
./start.sh stop

# 2. 拉取最新代码
git pull

# 3. 安装依赖
npm install

# 4. 运行数据库迁移
npm run db:push

# 5. 重新构建
npm run build

# 6. 启动应用
./start.sh start
```

## 📞 技术支持

如遇到问题，请查看：
- 应用日志: `logs/app.log`
- 错误日志: `logs/error.log`
- 进程状态: `./start.sh status`

## 📝 默认账号信息

- **访问地址**: http://localhost:3002
- **管理员账号**: admin
- **管理员密码**: 123456

⚠️ **重要**: 首次登录后请立即修改密码！
