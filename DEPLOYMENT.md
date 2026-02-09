# Linux 部署脚本使用说明

## 📦 文件说明

- **start.sh** - 主启动脚本（包含所有管理命令）
- **deploy.sh** - 一键部署脚本（自动安装 Node.js 和依赖）
- **home-box.service** - systemd 服务配置文件（可选）

## 🚀 快速开始

### 方式一：使用一键部署脚本（推荐新手）

```bash
# 1. 赋予执行权限
chmod +x deploy.sh

# 2. 运行一键部署
./deploy.sh
```

这个脚本会自动：
- 检测操作系统
- 安装 Node.js（如果未安装）
- 创建配置文件（config.env）
- 安装所有依赖
- 初始化数据库
- 构建应用
- 询问是否立即启动

### 方式二：手动部署（推荐有经验用户）

```bash
# 1. 确保已安装 Node.js >= 18
node -v

# 2. 赋予执行权限
chmod +x start.sh

# 3. 创建配置文件
cp config.env.example config.env

# 4. 编辑配置文件（必须修改密钥和密码）
nano config.env

# 5. 完整安装
./start.sh install

# 6. 启动应用
./start.sh start
```

## ⚙️ 配置文件

### 配置文件位置

- **config.env** - 实际使用的配置文件
- **config.env.example** - 配置文件示例

### 创建配置文件

```bash
# 复制示例配置文件
cp config.env.example config.env

# 编辑配置文件
nano config.env
```

### 必须修改的配置

```bash
# 生成安全的密钥
openssl rand -base64 32

# 修改 config.env 中的以下配置
NEXTAUTH_SECRET="生成的密钥"
ADMIN_PASSWORD="强密码"
```

### 配置文件示例

```bash
PORT=3002
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_SECRET="mmmmmmmmmmmmmmmmmmm"
NEXTAUTH_URL="http://localhost:3002"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="123456"
```

详细配置说明请查看: [配置文件文档](./docs/configuration.md)

## 📋 常用命令

```bash
# 启动应用
./start.sh start

# 停止应用
./start.sh stop

# 重启应用
./start.sh restart

# 查看状态
./start.sh status

# 查看日志
./start.sh logs

# 查看错误日志
./start.sh errors

# 重新构建
./start.sh build

# 显示帮助
./start.sh help
```

## 🔧 配置信息

### 默认配置

- **端口**: 3002
- **数据库**: SQLite (prisma/prod.db)
- **管理员账号**: admin
- **管理员密码**: 123456
- **密钥**: mmmmmmmmmmmmmmmmmmm

### 修改配置

编辑 `start.sh` 文件，找到配置部分：

```bash
# 配置变量
PORT=3002  # 修改端口

# 环境变量
export NEXTAUTH_SECRET="mmmmmmmmmmmmmmmmmmm"  # 修改密钥
export ADMIN_USERNAME="admin"  # 修改用户名
export ADMIN_PASSWORD="123456"  # 修改密码
```

## 📂 目录结构

```
home-box/
├── start.sh              # 主启动脚本
├── deploy.sh             # 一键部署脚本
├── home-box.service      # systemd 服务文件
├── .home-box.pid         # 进程 PID 文件
├── logs/                 # 日志目录
│   ├── app.log          # 应用日志
│   └── error.log        # 错误日志
├── prisma/              # 数据库目录
│   └── prod.db          # SQLite 数据库
└── public/uploads/      # 上传文件目录
```

## 🔄 更新应用

```bash
# 1. 停止应用
./start.sh stop

# 2. 拉取最新代码
git pull

# 3. 安装依赖
npm install

# 4. 数据库迁移
npm run db:push

# 5. 重新构建
npm run build

# 6. 启动应用
./start.sh start
```

## 🔐 安全建议

1. **修改默认密码**
   - 首次登录后立即修改 admin 密码

2. **修改密钥**
   ```bash
   # 生成强密钥
   openssl rand -base64 32
   ```

3. **配置防火墙**
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 3002/tcp

   # CentOS/RHEL
   sudo firewall-cmd --permanent --add-port=3002/tcp
   sudo firewall-cmd --reload
   ```

4. **使用 Nginx 反向代理**
   - 参考 `docs/linux-deployment.md` 中的 Nginx 配置

## 🔧 systemd 服务（可选）

### 安装服务

```bash
# 1. 编辑服务文件
sudo nano home-box.service

# 2. 修改以下内容：
#    - User 和 Group: 改为你的用户名
#    - WorkingDirectory: 改为实际路径
#    - ExecStart/ExecStop: 改为实际路径

# 3. 复制到 systemd 目录
sudo cp home-box.service /etc/systemd/system/

# 4. 重载配置
sudo systemctl daemon-reload

# 5. 启用开机自启
sudo systemctl enable home-box

# 6. 启动服务
sudo systemctl start home-box
```

### 服务管理

```bash
# 启动
sudo systemctl start home-box

# 停止
sudo systemctl stop home-box

# 重启
sudo systemctl restart home-box

# 状态
sudo systemctl status home-box

# 查看日志
sudo journalctl -u home-box -f
```

## 🐛 故障排查

### 端口被占用

```bash
# 查看占用端口的进程
lsof -i :3002

# 杀死进程
kill -9 <PID>
```

### 应用无法启动

```bash
# 查看错误日志
./start.sh errors

# 或直接查看文件
tail -f logs/error.log
```

### 清理并重启

```bash
# 停止应用
./start.sh stop

# 清理 PID 文件
rm -f .home-box.pid

# 重新启动
./start.sh start
```

### 数据库问题

```bash
# 备份数据库
cp prisma/prod.db prisma/prod.db.backup

# 重新初始化
rm -f prisma/prod.db
npm run db:push
npm run db:seed
```

## 📊 性能优化

### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "home-box" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs home-box

# 保存配置
pm2 save

# 开机自启
pm2 startup
```

## 📝 日志管理

### 查看实时日志

```bash
# 应用日志
tail -f logs/app.log

# 错误日志
tail -f logs/error.log
```

### 配置日志轮转

```bash
# 创建 logrotate 配置
sudo nano /etc/logrotate.d/home-box
```

添加内容：

```
/path/to/home-box/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## 🌐 访问应用

- **本地访问**: http://localhost:3002
- **远程访问**: http://服务器IP:3002
- **管理员账号**: admin
- **管理员密码**: 123456

⚠️ **重要**: 首次登录后请立即修改密码！

## 📚 更多文档

详细部署文档请查看: `docs/linux-deployment.md`

## ❓ 常见问题

**Q: 如何修改端口？**
A: 编辑 `start.sh`，修改 `PORT=3002` 为其他端口

**Q: 如何备份数据？**
A: 备份 `prisma/prod.db` 文件和 `public/uploads` 目录

**Q: 如何迁移到其他服务器？**
A: 复制整个项目目录，然后运行 `./start.sh start`

**Q: 忘记管理员密码怎么办？**
A: 删除数据库重新初始化，或使用数据库工具直接修改

## 📞 技术支持

如遇到问题，请检查：
1. Node.js 版本是否 >= 18
2. 端口是否被占用
3. 日志文件中的错误信息
4. 文件权限是否正确
