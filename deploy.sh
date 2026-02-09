#!/bin/bash

# Home Box 一键部署脚本
# 适用于全新的 Linux 服务器

set -e

echo "=================================="
echo "  Home Box 一键部署脚本"
echo "=================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then
    echo "警告: 不建议使用 root 用户运行此脚本"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "无法检测操作系统"
    exit 1
fi

echo "检测到操作系统: $OS $VER"
echo ""

# 安装 Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "Node.js 未安装，正在安装..."

    case $OS in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
            ;;
        *)
            echo "不支持的操作系统，请手动安装 Node.js >= 18"
            exit 1
            ;;
    esac

    echo "Node.js 安装完成"
else
    echo "Node.js 已安装: $(node -v)"
fi

echo ""

# 赋予启动脚本执行权限
chmod +x start.sh

echo "开始安装 Home Box..."
echo ""

# 执行完整安装
./start.sh install

echo ""
echo "=================================="
echo "  安装完成！"
echo "=================================="
echo ""
echo "现在可以启动应用："
echo "  ./start.sh start"
echo ""
echo "访问地址: http://localhost:3002"
echo "管理员账号: admin"
echo "管理员密码: 123456"
echo ""
echo "更多命令请查看: ./start.sh help"
echo ""

# 询问是否立即启动
read -p "是否立即启动应用? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./start.sh start
fi
