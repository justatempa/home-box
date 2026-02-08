"use client";

import Link from "next/link";
import { useMemo } from "react";

import { trpc } from "@/utils/trpc";
import { UploadButton } from "@/components/upload/upload-button";

export function CategoryDetailClient({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const cat = trpc.categories.get.useQuery({ id });
  const items = trpc.items.list.useQuery({ categoryId: id, limit: 20, orderBy: "updatedAt", orderDir: "desc" });

  const addImage = trpc.categories.imagesAdd.useMutation({
    onSuccess: async () => {
      await utils.categories.get.invalidate({ id });
    },
  });

  const title = cat.data?.name ?? "分类";
  const images = useMemo(() => cat.data?.images ?? [], [cat.data?.images]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← 返回分类
        </Link>
        <Link
          href={`/items?categoryId=${encodeURIComponent(id)}`}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          在总览中筛选
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="relative h-40 w-full bg-black/20">
          <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_20%_-20%,rgba(34,211,238,0.22),transparent_60%),radial-gradient(800px_300px_at_80%_120%,rgba(253,230,138,0.16),transparent_60%)]" />
          {images.length ? (
            <div className="absolute inset-0 grid grid-cols-3 gap-px bg-white/10">
              {images.slice(0, 3).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-5">
          <div className="text-xs text-white/60">分类</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          {cat.data?.description ? (
            <p className="mt-2 text-sm text-white/70">{cat.data.description}</p>
          ) : (
            <p className="mt-2 text-sm text-white/40">没有描述</p>
          )}

          <div className="mt-4">
            <UploadButton
              label="上传分类轮播图"
              onUploaded={(url) => addImage.mutate({ categoryId: id, url })}
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-white/60">物品</div>
            <div className="mt-1 text-lg font-semibold">最近更新</div>
          </div>
          <Link
            href="/items"
            className="text-sm text-white/60 hover:text-white"
          >
            去总览 →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(items.data?.items ?? []).map((it) => (
            <Link
              key={it.id}
              href={`/item/${it.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
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
                  <div className="mt-1 text-xs text-white/50">评分 {it.rating} · 价格 {it.price}</div>
                </div>
              </div>
            </Link>
          ))}

          {!items.isLoading && (items.data?.items?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70 sm:col-span-2">
              这个分类还没有物品。
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
