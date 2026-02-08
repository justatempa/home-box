"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = useMemo(() => params.get("callbackUrl") ?? "/", [params]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      });
      if (!res || res.error) {
        setError("账号或密码错误，或账号已被禁用。");
        return;
      }
      router.push(res.url ?? callbackUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_700px_at_80%_-20%,rgba(255,210,122,0.45),transparent_55%),radial-gradient(900px_600px_at_10%_10%,rgba(113,231,255,0.35),transparent_60%),linear-gradient(to_bottom,#09090b,#0b1220)] text-zinc-50">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.75)]" />
            Home Box
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">登录</h1>
          <p className="mt-2 text-sm text-white/70">账号由管理员创建；不支持自助注册。</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          <label className="block">
            <div className="mb-2 text-xs font-medium tracking-wide text-white/70">用户名</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className={clsx(
                "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none",
                "placeholder:text-white/30 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10",
              )}
              placeholder="例如：admin"
            />
          </label>

          <label className="mt-4 block">
            <div className="mb-2 text-xs font-medium tracking-wide text-white/70">密码</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className={clsx(
                "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none",
                "placeholder:text-white/30 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10",
              )}
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            className={clsx(
              "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-amber-200 px-4 py-3 text-sm font-semibold text-black",
              "shadow-[0_12px_30px_rgba(34,211,238,0.18)]",
              loading && "opacity-70",
            )}
          >
            {loading ? "正在登录…" : "登录"}
          </button>

          <div className="mt-4 text-xs text-white/45">提示：首次启动请先执行 Prisma 迁移与 seed。</div>
        </form>
      </div>
    </div>
  );
}

