import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import Link from "next/link";

import { authOptions } from "@/server/auth";

export default async function CategoriesIndexRedirect() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // v1 shortcut: categories list lives at /
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-white/70">分类页在首页。</div>
      <Link className="mt-3 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black" href="/">
        回到首页
      </Link>
    </div>
  );
}

