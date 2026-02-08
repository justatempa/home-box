import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions } from "@/server/auth";
import { UserMenu } from "@/components/nav/user-menu";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_700px_at_80%_-20%,rgba(255,210,122,0.22),transparent_55%),radial-gradient(900px_600px_at_10%_10%,rgba(113,231,255,0.18),transparent_60%),linear-gradient(to_bottom,#050507,#070b12)] text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            Home Box
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink href="/" label="分类" />
            <NavLink href="/items" label="物品" />
            <NavLink href="/search" label="搜索" />
            <UserMenu user={session.user} />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
