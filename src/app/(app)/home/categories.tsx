import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/server/auth";

import { CategoriesClient } from "@/components/categories/categories-client";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">分类</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">你的收纳版图</h1>
        </div>
        <Link
          href="/items"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          物品总览
        </Link>
      </div>

      <CategoriesClient />
    </div>
  );
}

