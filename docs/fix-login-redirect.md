# 登录跳转问题修复指南

## 🐛 问题描述

部署到服务器后，登录成功会跳转到 `localhost`，导致无法访问。

## 🔍 原因分析

`NEXTAUTH_URL` 配置为 `http://localhost:3002`，NextAuth 会将用户重定向到这个地址。

## ✅ 解决方案

### 方案一：修改配置文件（推荐）

编辑 `config.env` 文件：

```bash
nano config.env
```

修改 `NEXTAUTH_URL` 为服务器实际地址：

```bash
# 如果使用 IP 访问
NEXTAUTH_URL="http://服务器IP:3002"

# 示例
NEXTAUTH_URL="http://192.168.1.100:3002"

# 如果使用域名访问
NEXTAUTH_URL="http://your-domain.com:3002"

# 如果使用 HTTPS
NEXTAUTH_URL="https://your-domain.com"
```

保存后重启应用：

```bash
./start.sh restart
```

### 方案二：使用环境变量（临时）

```bash
# 停止应用
./start.sh stop

# 设置环境变量后启动
export NEXTAUTH_URL="http://服务器IP:3002"
./start.sh start
```

## 📋 不同场景的配置

### 场景1: 使用服务器 IP 访问

```bash
# config.env
NEXTAUTH_URL="http://192.168.1.100:3002"
```

访问地址：`http://192.168.1.100:3002`

### 场景2: 使用域名（无 SSL）

```bash
# config.env
NEXTAUTH_URL="http://homebox.example.com:3002"
```

访问地址：`http://homebox.example.com:3002`

### 场景3: 使用域名 + Nginx 反向代理（推荐）

**Nginx 配置：**

```nginx
server {
    listen 80;
    server_name homebox.example.com;

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

**config.env 配置：**

```bash
PORT=3002
NEXTAUTH_URL="http://homebox.example.com"
```

访问地址：`http://homebox.example.com`

### 场景4: 使用域名 + HTTPS（最推荐）

**安装 SSL 证书（Let's Encrypt）：**

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d homebox.example.com
```

**Nginx 配置（自动生成）：**

```nginx
server {
    listen 443 ssl http2;
    server_name homebox.example.com;

    ssl_certificate /etc/letsencrypt/live/homebox.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homebox.example.com/privkey.pem;

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

server {
    listen 80;
    server_name homebox.example.com;
    return 301 https://$server_name$request_uri;
}
```

**config.env 配置：**

```bash
PORT=3002
NEXTAUTH_URL="https://homebox.example.com"
```

访问地址：`https://homebox.example.com`

## 🔧 快速修复步骤

### 1. 获取服务器 IP

```bash
# 查看服务器 IP
ip addr show
# 或
hostname -I
# 或
curl ifconfig.me
```

### 2. 修改配置文件

```bash
# 编辑配置
nano config.env

# 修改这一行（将 localhost 改为服务器 IP）
NEXTAUTH_URL="http://你的服务器IP:3002"
```

### 3. 重启应用

```bash
./start.sh restart
```

### 4. 验证配置

```bash
# 查看当前配置
grep NEXTAUTH_URL config.env

# 查看应用状态
./start.sh status
```

### 5. 测试登录

访问 `http://你的服务器IP:3002`，登录后应该正常跳转。

## 🔍 验证配置是否生效

### 方法1: 查看配置文件

```bash
cat config.env | grep NEXTAUTH_URL
```

### 方法2: 查看应用日志

```bash
./start.sh logs | grep NEXTAUTH_URL
```

### 方法3: 测试登录

1. 访问登录页面
2. 输入账号密码
3. 登录成功后检查浏览器地址栏
4. 应该跳转到配置的 `NEXTAUTH_URL`

## ⚠️ 常见错误

### 错误1: 配置了但还是跳转 localhost

**原因**: 修改配置后没有重启应用

**解决**:
```bash
./start.sh restart
```

### 错误2: 配置了 IP 但无法访问

**原因**: 防火墙未开放端口

**解决**:
```bash
# Ubuntu/Debian
sudo ufw allow 3002/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

### 错误3: 使用域名但无法访问

**原因**: DNS 未解析或 Nginx 未配置

**解决**:
1. 检查 DNS 解析：`nslookup your-domain.com`
2. 检查 Nginx 配置：`sudo nginx -t`
3. 重启 Nginx：`sudo systemctl restart nginx`

### 错误4: HTTPS 证书错误

**原因**: SSL 证书未正确配置

**解决**:
```bash
# 检查证书
sudo certbot certificates

# 续期证书
sudo certbot renew

# 测试 Nginx 配置
sudo nginx -t
```

## 📝 配置检查清单

- [ ] 修改 `config.env` 中的 `NEXTAUTH_URL`
- [ ] 重启应用 `./start.sh restart`
- [ ] 检查防火墙端口是否开放
- [ ] 测试登录功能
- [ ] 检查浏览器地址栏跳转是否正确

## 🔐 安全建议

### 1. 使用 HTTPS

生产环境强烈建议使用 HTTPS：

```bash
# 安装 Let's Encrypt 证书
sudo certbot --nginx -d your-domain.com

# 配置文件
NEXTAUTH_URL="https://your-domain.com"
```

### 2. 使用反向代理

不要直接暴露 Node.js 端口，使用 Nginx 反向代理：

```bash
# 应用监听本地端口
PORT=3002

# Nginx 监听 80/443 端口
# 转发到 localhost:3002
```

### 3. 配置 CORS（如果需要）

如果前后端分离，需要配置 CORS：

```bash
# 在 Next.js 配置中添加
# next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
      ],
    },
  ]
}
```

## 🎯 推荐配置

### 开发环境

```bash
PORT=3002
NEXTAUTH_URL="http://localhost:3002"
```

### 测试环境

```bash
PORT=3002
NEXTAUTH_URL="http://test-server-ip:3002"
```

### 生产环境（推荐）

```bash
PORT=3002
NEXTAUTH_URL="https://your-domain.com"
```

配合 Nginx 反向代理 + SSL 证书使用。

## 📞 需要帮助？

如果问题仍未解决，请提供以下信息：

1. 服务器 IP 或域名
2. `config.env` 中的 `NEXTAUTH_URL` 配置
3. 应用日志：`./start.sh logs`
4. 错误日志：`./start.sh errors`
5. 浏览器控制台错误信息
