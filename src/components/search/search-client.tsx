"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SearchClient() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const enabled = debounced.length > 0;
  const res = trpc.search.items.useQuery(
    { q: debounced, limit: 20 },
    {
      enabled,
    },
  );

  const rows = useMemo(() => res.data ?? [], [res.data]);

  return (
    <div>
      <div className="mb-5">
        <div className="text-xs text-white/60">全局搜索</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">找回你放过的东西</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索：名称 / 分类名 / 备注 / 标签（部分）"
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
        />
        <div className="mt-2 text-xs text-white/45">
          {enabled ? (res.isLoading ? "搜索中…" : `结果 ${rows.length} 条`) : "输入关键词开始搜索"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((it) => (
          <Link
            key={it.id}
            href={`/item/${it.id}`}
            className={clsx(
              "rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {it.coverImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.coverImage.url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{it.name}</div>
                <div className="mt-1 text-xs text-white/55">
                  {it.category?.name ? `分类：${it.category.name}` : "未分类"}
                </div>
              </div>
              <div className="text-xs text-white/40">→</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

