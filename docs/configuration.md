# 配置文件说明

## 📁 配置文件位置

- **config.env** - 实际使用的配置文件（需要自己创建）
- **config.env.example** - 配置文件示例（不要直接修改）

## 🚀 快速开始

### 1. 创建配置文件

```bash
# 复制示例配置文件
cp config.env.example config.env

# 编辑配置文件
nano config.env
```

### 2. 修改配置

打开 `config.env` 文件，根据需要修改以下配置：

```bash
# 必须修改的配置
NEXTAUTH_SECRET="请修改为随机字符串"  # 生成方法见下文
ADMIN_PASSWORD="请修改为强密码"       # 管理员密码

# 可选修改的配置
PORT=3002                              # 如果端口冲突，修改为其他端口
NEXTAUTH_URL="http://localhost:3002"   # 如果使用域名，修改为实际域名
```

### 3. 启动应用

```bash
./start.sh start
```

## 📋 配置项说明

### 应用配置

| 配置项 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|----------|
| APP_NAME | 应用名称 | home-box | 否 |
| PORT | 运行端口 | 3002 | 否 |
| NODE_ENV | 运行环境 | production | 否 |

### 数据库配置

| 配置项 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|----------|
| DATABASE_URL | 数据库连接字符串 | file:./prisma/prod.db | 是 |

**数据库连接字符串示例：**

```bash
# SQLite（默认）
DATABASE_URL="file:./prisma/prod.db"

# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/homebox"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/homebox"
```

### 认证配置

| 配置项 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|----------|
| NEXTAUTH_SECRET | JWT 密钥 | - | 是 |
| NEXTAUTH_URL | 应用访问地址 | http://localhost:3002 | 是 |

**生成安全的密钥：**

```bash
# 方法1: 使用 openssl
openssl rand -base64 32

# 方法2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法3: 在线生成
# 访问 https://generate-secret.vercel.app/32
```

### 管理员账号

| 配置项 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|----------|
| ADMIN_USERNAME | 管理员用户名 | admin | 是 |
| ADMIN_PASSWORD | 管理员密码 | - | 是 |

⚠️ **安全建议：**
- 使用强密码（至少 8 位，包含大小写字母、数字、特殊字符）
- 首次登录后立即修改密码
- 不要使用默认密码 "123456"

### 日志配置

| 配置项 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|----------|
| LOG_DIR | 日志目录 | logs | 否 |
| LOG_FILE | 应用日志文件 | logs/app.log | 否 |
| ERROR_LOG_FILE | 错误日志文件 | logs/error.log | 否 |

### 进程管理

| 配置项 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|----------|
| PID_FILE | 进程 PID 文件 | .home-box.pid | 否 |

### 其他配置

| 配置项 | 说明 | 默认值 | 是否必须 |
|--------|------|--------|----------|
| UPLOAD_DIR | 上传文件目录 | public/uploads | 否 |
| DEBUG | 调试模式 | false | 否 |

## 🔧 配置示例

### 示例1: 本地开发环境

```bash
APP_NAME="home-box"
PORT=3002
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3002"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
DEBUG=true
```

### 示例2: 生产环境（单机部署）

```bash
APP_NAME="home-box"
PORT=3002
NODE_ENV=production
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_SECRET="xK8mP2vN9qR5tY7wZ3aB6cD1eF4gH0jL"
NEXTAUTH_URL="http://your-server-ip:3002"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="YourStrongPassword123!"
DEBUG=false
```

### 示例3: 生产环境（使用域名 + PostgreSQL）

```bash
APP_NAME="home-box"
PORT=3002
NODE_ENV=production
DATABASE_URL="postgresql://homebox:password@localhost:5432/homebox"
NEXTAUTH_SECRET="xK8mP2vN9qR5tY7wZ3aB6cD1eF4gH0jL"
NEXTAUTH_URL="https://homebox.yourdomain.com"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="YourStrongPassword123!"
DEBUG=false
```

## 🔄 修改配置后

修改配置文件后，需要重启应用才能生效：

```bash
./start.sh restart
```

## 🔐 安全最佳实践

### 1. 保护配置文件

```bash
# 设置配置文件权限（仅所有者可读写）
chmod 600 config.env

# 确保配置文件不被 git 追踪
echo "config.env" >> .gitignore
```

### 2. 使用强密钥

```bash
# 生成强密钥
openssl rand -base64 32

# 将生成的密钥复制到 config.env
NEXTAUTH_SECRET="生成的密钥"
```

### 3. 定期更换密码

- 定期更换管理员密码
- 定期更换 NEXTAUTH_SECRET（需要重新登录）

### 4. 备份配置文件

```bash
# 备份配置文件（注意安全存储）
cp config.env config.env.backup

# 或加密备份
tar czf config.env.tar.gz config.env
gpg -c config.env.tar.gz
```

## 🐛 常见问题

### Q: 配置文件不存在怎么办？

```bash
# 复制示例配置文件
cp config.env.example config.env
```

### Q: 修改配置后不生效？

```bash
# 重启应用
./start.sh restart

# 检查配置是否正确加载
./start.sh status
```

### Q: 如何查看当前使用的配置？

```bash
# 查看配置文件
cat config.env

# 或使用 grep 查看特定配置
grep "PORT" config.env
```

### Q: 配置文件格式错误怎么办？

配置文件格式要求：
- 每行一个配置项
- 格式：`KEY=VALUE` 或 `KEY="VALUE"`
- 注释以 `#` 开头
- 不要有多余的空格

**正确示例：**
```bash
PORT=3002
ADMIN_USERNAME="admin"
```

**错误示例：**
```bash
PORT = 3002          # 等号两边不要有空格
ADMIN_USERNAME=admin # 如果值包含特殊字符，需要加引号
```

## 📝 配置文件模板

### 最小配置（快速开始）

```bash
PORT=3002
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_SECRET="mmmmmmmmmmmmmmmmmmm"
NEXTAUTH_URL="http://localhost:3002"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="123456"
```

### 完整配置（推荐）

```bash
# 应用配置
APP_NAME="home-box"
PORT=3002
NODE_ENV=production

# 数据库配置
DATABASE_URL="file:./prisma/prod.db"

# 认证配置
NEXTAUTH_SECRET="请修改为随机字符串"
NEXTAUTH_URL="http://localhost:3002"

# 管理员账号
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="请修改为强密码"

# 日志配置
LOG_DIR="logs"
LOG_FILE="logs/app.log"
ERROR_LOG_FILE="logs/error.log"

# 进程管理
PID_FILE=".home-box.pid"

# 其他配置
UPLOAD_DIR="public/uploads"
DEBUG=false
```

## 🔗 相关文档

- [部署指南](./DEPLOYMENT.md)
- [详细部署文档](./docs/linux-deployment.md)
- [启动脚本说明](./DEPLOYMENT.md#常用命令)
