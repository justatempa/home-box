移动端优先（H5）的个人物品管理系统（Home Box）。

## 本地启动

1) 安装依赖

```bash
npm install
```

2) 配置环境变量

复制 `.env.example` 为 `.env` 并修改：

- `NEXTAUTH_SECRET`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`（seed 时会拒绝弱默认密码）

3) 初始化数据库

```bash
npm run db:migrate
npm run db:seed
```

4) 启动

```bash
npm run dev
```

访问：`http://localhost:3000/login`

## 主要能力（一期）

- NextAuth Credentials 登录（JWT session）
- Prisma + SQLite 数据层
- tRPC API（含 owner_id 隔离与软删除）
- 页面：分类、分类详情、物品总览、物品详情（Tab）、搜索
- 物品：新建/编辑（含图片上传、封面设置、标签、模板实例编辑）
- 管理后台：用户管理、字典管理

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
