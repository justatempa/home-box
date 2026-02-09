#!/bin/bash

# Home Box 启动脚本
# 用途：在 Linux 上后台启动 Home Box 应用

set -e

# 获取脚本所在目录
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$APP_DIR/config.env"

# 加载配置文件
if [ -f "$CONFIG_FILE" ]; then
    # 读取配置文件，忽略注释和空行
    while IFS='=' read -r key value; do
        # 跳过注释和空行
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        # 去除前后空格和引号
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs | sed -e 's/^"//' -e 's/"$//')
        # 导出环境变量
        export "$key=$value"
    done < "$CONFIG_FILE"
else
    echo "错误: 配置文件不存在: $CONFIG_FILE"
    echo "请复制 config.env.example 为 config.env 并修改配置"
    exit 1
fi

# 从配置文件读取的变量
APP_NAME="${APP_NAME:-home-box}"
PORT="${PORT:-3002}"
PID_FILE="$APP_DIR/${PID_FILE:-.home-box.pid}"
LOG_FILE="$APP_DIR/${LOG_FILE:-logs/app.log}"
ERROR_LOG_FILE="$APP_DIR/${ERROR_LOG_FILE:-logs/error.log}"

# 设置环境变量
export NODE_ENV="${NODE_ENV:-production}"
export PORT="$PORT"
export DATABASE_URL="${DATABASE_URL:-file:./prisma/prod.db}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:$PORT}"
export ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-123456}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查 Node.js 是否安装
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js (建议版本 >= 18)"
        exit 1
    fi
    log_info "Node.js 版本: $(node -v)"
}

# 检查 npm 是否安装
check_npm() {
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    log_info "npm 版本: $(npm -v)"
}

# 创建必要的目录
create_dirs() {
    log_step "创建必要的目录..."
    mkdir -p "$APP_DIR/logs"
    mkdir -p "$APP_DIR/prisma"
    mkdir -p "$APP_DIR/public/uploads"
}

# 安装依赖
install_deps() {
    log_step "安装依赖..."
    cd "$APP_DIR"
    npm install --production=false
    log_info "依赖安装完成"
}

# 初始化数据库
init_db() {
    log_step "初始化数据库..."
    cd "$APP_DIR"

    # 生成 Prisma Client
    npm run db:generate

    # 运行迁移
    npm run db:push

    # 运行种子数据
    log_info "创建管理员账号..."
    npm run db:seed || log_warn "种子数据已存在或执行失败"

    log_info "数据库初始化完成"
}

# 构建应用
build_app() {
    log_step "构建应用..."
    cd "$APP_DIR"
    npm run build
    log_info "应用构建完成"
}

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_error "端口 $PORT 已被占用"
        log_info "占用端口的进程："
        lsof -i :$PORT
        return 1
    fi
    return 0
}

# 启动应用
start_app() {
    log_step "启动应用..."

    # 检查是否已经在运行
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            log_warn "应用已在运行 (PID: $PID)"
            return 0
        else
            log_warn "发现过期的 PID 文件，清理中..."
            rm -f "$PID_FILE"
        fi
    fi

    # 检查端口
    if ! check_port; then
        log_error "无法启动应用，端口被占用"
        exit 1
    fi

    cd "$APP_DIR"

    # 后台启动应用
    nohup npm run start > "$LOG_FILE" 2> "$ERROR_LOG_FILE" &

    # 保存 PID
    echo $! > "$PID_FILE"

    # 等待应用启动
    log_info "等待应用启动..."
    sleep 3

    # 检查是否启动成功
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            log_info "应用启动成功！"
            log_info "PID: $PID"
            log_info "端口: $PORT"
            log_info "访问地址: http://localhost:$PORT"
            log_info "日志文件: $LOG_FILE"
            log_info "错误日志: $ERROR_LOG_FILE"
            log_info ""
            log_info "管理员账号: $ADMIN_USERNAME"
            log_info "管理员密码: $ADMIN_PASSWORD"
        else
            log_error "应用启动失败，请查看日志文件"
            cat "$ERROR_LOG_FILE"
            exit 1
        fi
    else
        log_error "应用启动失败"
        exit 1
    fi
}

# 停止应用
stop_app() {
    log_step "停止应用..."

    if [ ! -f "$PID_FILE" ]; then
        log_warn "应用未运行"
        return 0
    fi

    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null 2>&1; then
        log_info "正在停止应用 (PID: $PID)..."
        kill "$PID"

        # 等待进程结束
        for i in {1..10}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done

        # 如果还在运行，强制杀死
        if ps -p "$PID" > /dev/null 2>&1; then
            log_warn "进程未响应，强制停止..."
            kill -9 "$PID"
        fi

        rm -f "$PID_FILE"
        log_info "应用已停止"
    else
        log_warn "进程不存在，清理 PID 文件"
        rm -f "$PID_FILE"
    fi
}

# 重启应用
restart_app() {
    log_step "重启应用..."
    stop_app
    sleep 2
    start_app
}

# 查看应用状态
status_app() {
    if [ ! -f "$PID_FILE" ]; then
        log_info "应用状态: ${RED}未运行${NC}"
        return 1
    fi

    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null 2>&1; then
        log_info "应用状态: ${GREEN}运行中${NC}"
        log_info "PID: $PID"
        log_info "端口: $PORT"
        log_info "访问地址: http://localhost:$PORT"

        # 显示进程信息
        echo ""
        ps -p "$PID" -o pid,ppid,cmd,%mem,%cpu,etime

        return 0
    else
        log_info "应用状态: ${RED}未运行${NC} (PID 文件存在但进程不存在)"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 查看日志
view_logs() {
    if [ -f "$LOG_FILE" ]; then
        log_info "应用日志 (最后 50 行):"
        echo "----------------------------------------"
        tail -n 50 "$LOG_FILE"
    else
        log_warn "日志文件不存在"
    fi
}

# 查看错误日志
view_error_logs() {
    if [ -f "$ERROR_LOG_FILE" ]; then
        log_info "错误日志 (最后 50 行):"
        echo "----------------------------------------"
        tail -n 50 "$ERROR_LOG_FILE"
    else
        log_warn "错误日志文件不存在"
    fi
}

# 完整安装
full_install() {
    log_info "开始完整安装 Home Box..."
    echo ""

    check_node
    check_npm
    create_dirs
    install_deps
    init_db
    build_app

    echo ""
    log_info "安装完成！现在可以使用 './start.sh start' 启动应用"
}

# 显示帮助信息
show_help() {
    cat << EOF
Home Box 启动脚本

用法: $0 [命令]

命令:
  install       完整安装（依赖、数据库、构建）
  start         启动应用（后台运行）
  stop          停止应用
  restart       重启应用
  status        查看应用状态
  logs          查看应用日志
  errors        查看错误日志
  build         重新构建应用
  help          显示此帮助信息

示例:
  $0 install    # 首次安装
  $0 start      # 启动应用
  $0 status     # 查看状态
  $0 logs       # 查看日志

配置:
  端口: $PORT
  数据库: $DATABASE_URL
  管理员账号: $ADMIN_USERNAME
  管理员密码: $ADMIN_PASSWORD

日志文件:
  应用日志: $LOG_FILE
  错误日志: $ERROR_LOG_FILE
EOF
}

# 主函数
main() {
    case "${1:-}" in
        install)
            full_install
            ;;
        start)
            start_app
            ;;
        stop)
            stop_app
            ;;
        restart)
            restart_app
            ;;
        status)
            status_app
            ;;
        logs)
            view_logs
            ;;
        errors)
            view_error_logs
            ;;
        build)
            build_app
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
