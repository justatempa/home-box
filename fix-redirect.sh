#!/bin/bash

# 登录跳转问题快速修复脚本

set -e

echo "=================================="
echo "  登录跳转问题快速修复"
echo "=================================="
echo ""

CONFIG_FILE="config.env"

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误: 配置文件不存在: $CONFIG_FILE"
    exit 1
fi

# 获取服务器 IP
echo "正在检测服务器 IP..."
SERVER_IP=$(hostname -I | awk '{print $1}')

if [ -z "$SERVER_IP" ]; then
    echo "警告: 无法自动检测服务器 IP"
    echo ""
    read -p "请手动输入服务器 IP 或域名: " SERVER_IP
fi

echo "检测到服务器地址: $SERVER_IP"
echo ""

# 读取当前端口
CURRENT_PORT=$(grep "^PORT=" "$CONFIG_FILE" | cut -d'=' -f2 | tr -d '"' | xargs)
if [ -z "$CURRENT_PORT" ]; then
    CURRENT_PORT=3002
fi

echo "当前端口: $CURRENT_PORT"
echo ""

# 询问访问方式
echo "请选择访问方式:"
echo "1) 使用 IP 地址访问 (http://$SERVER_IP:$CURRENT_PORT)"
echo "2) 使用域名访问 (需要输入域名)"
echo "3) 使用 HTTPS (需要输入域名)"
echo ""
read -p "请选择 [1-3]: " choice

case $choice in
    1)
        NEW_URL="http://$SERVER_IP:$CURRENT_PORT"
        ;;
    2)
        read -p "请输入域名 (例如: homebox.example.com): " DOMAIN
        read -p "是否使用端口号? (y/n): " use_port
        if [[ $use_port =~ ^[Yy]$ ]]; then
            NEW_URL="http://$DOMAIN:$CURRENT_PORT"
        else
            NEW_URL="http://$DOMAIN"
        fi
        ;;
    3)
        read -p "请输入域名 (例如: homebox.example.com): " DOMAIN
        NEW_URL="https://$DOMAIN"
        ;;
    *)
        echo "无效的选择"
        exit 1
        ;;
esac

echo ""
echo "新的访问地址: $NEW_URL"
echo ""
read -p "确认修改配置? (y/n): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

# 备份配置文件
cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "已备份配置文件"

# 修改配置文件
if grep -q "^NEXTAUTH_URL=" "$CONFIG_FILE"; then
    # 替换现有配置
    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"$NEW_URL\"|" "$CONFIG_FILE"
else
    # 添加新配置
    echo "NEXTAUTH_URL=\"$NEW_URL\"" >> "$CONFIG_FILE"
fi

echo "配置已更新"
echo ""

# 显示修改后的配置
echo "当前配置:"
grep "^NEXTAUTH_URL=" "$CONFIG_FILE"
echo ""

# 询问是否重启应用
read -p "是否立即重启应用? (y/n): " restart

if [[ $restart =~ ^[Yy]$ ]]; then
    if [ -f "start.sh" ]; then
        echo ""
        echo "正在重启应用..."
        ./start.sh restart
        echo ""
        echo "=================================="
        echo "  修复完成！"
        echo "=================================="
        echo ""
        echo "请访问: $NEW_URL"
        echo ""
    else
        echo "错误: start.sh 不存在"
        echo "请手动重启应用"
    fi
else
    echo ""
    echo "请手动重启应用:"
    echo "  ./start.sh restart"
    echo ""
fi

echo "如果还有问题，请查看文档:"
echo "  docs/fix-login-redirect.md"
