"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ItemsClient() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState<boolean | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  const categories = trpc.categories.list.useQuery();
  const items = trpc.items.list.useQuery({
    limit: 20,
    categoryId,
    isFavorite,
    minRating,
    orderBy: "updatedAt",
    orderDir: "desc",
  });

  const rows = useMemo(() => items.data?.items ?? [], [items.data?.items]);

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">物品</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">总览</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/items/new"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            新建物品
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            搜索
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <label className="block">
          <div className="mb-1 text-xs text-white/60">分类</div>
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value ? e.target.value : undefined)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          >
            <option value="">全部</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-xs text-white/60">收藏</div>
          <select
            value={isFavorite === undefined ? "" : isFavorite ? "1" : "0"}
            onChange={(e) => {
              if (e.target.value === "") setIsFavorite(undefined);
              else setIsFavorite(e.target.value === "1");
            }}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          >
            <option value="">全部</option>
            <option value="1">仅收藏</option>
            <option value="0">非收藏</option>
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-xs text-white/60">最低星级</div>
          <select
            value={minRating === undefined ? "" : String(minRating)}
            onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          >
            <option value="">不限</option>
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v}>
                ≥ {v}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-3">
          <button
            onClick={() => {
              setCategoryId(undefined);
              setIsFavorite(undefined);
              setMinRating(undefined);
            }}
            className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
          >
            清空筛选
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((it) => (
          <Link
            key={it.id}
            href={`/item/${it.id}`}
            className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
          >
            <div className="flex gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {it.coverImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.coverImage.url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{it.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">
                    评分 {it.rating}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">
                    价格 {it.price}
                  </span>
                  {it.isFavorite ? (
                    <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-amber-100">
                      收藏
                    </span>
                  ) : null}
                </div>
              </div>
              <div className={clsx("text-xs text-white/40", "group-hover:text-white/70")}>
                →
              </div>
            </div>
          </Link>
        ))}

        {!items.isLoading && rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2">
            没有符合条件的物品。
          </div>
        ) : null}
      </div>
    </div>
  );
}
