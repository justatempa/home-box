"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatCount(n: number) {
  if (n > 999) return `${Math.round(n / 100) / 10}k`;
  return `${n}`;
}

export function CategoriesClient() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.categories.list.useQuery();
  const create = trpc.categories.create.useMutation({
    onSuccess: async () => {
      await utils.categories.list.invalidate();
      setOpen(false);
      setName("");
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const categories = useMemo(() => data ?? [], [data]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-white/60">
          {isLoading ? "加载中…" : `共 ${categories.length} 个分类`}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          新建分类
        </button>
      </div>

      {open ? (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">新建分类</div>
          <div className="mt-2 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：电子产品 / 厨房 / 书籍"
              className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
            />
            <button
              disabled={create.isPending || name.trim().length === 0}
              onClick={() => create.mutate({ name: name.trim(), sortOrder: 0 })}
              className={clsx(
                "rounded-xl bg-gradient-to-r from-cyan-300 to-amber-200 px-4 py-2 text-sm font-semibold text-black",
                (create.isPending || name.trim().length === 0) && "opacity-60",
              )}
            >
              保存
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.id}`}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-2xl" />
              <div className="absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-amber-200/10 blur-2xl" />
            </div>

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold tracking-tight">{c.name}</div>
                  {c.description ? (
                    <div className="mt-1 line-clamp-2 text-sm text-white/60">
                      {c.description}
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-white/40">没有描述</div>
                  )}
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                  {formatCount(c.itemCount)}
                </div>
              </div>
              <div className="mt-4 text-xs text-white/45">查看物品 →</div>
            </div>
          </Link>
        ))}

        {!isLoading && categories.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-3">
            还没有分类。先创建一个，然后开始录入物品。
          </div>
        ) : null}
      </div>
    </div>
  );
}

