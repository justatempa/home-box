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
      setDraft(null);
    },
  });
  const update = trpc.categories.update.useMutation({
    onSuccess: async () => {
      await utils.categories.list.invalidate();
      setDraft(null);
    },
  });
  const remove = trpc.categories.remove.useMutation({
    onSuccess: async () => {
      await utils.categories.list.invalidate();
    },
  });

  const categories = useMemo(() => data ?? [], [data]);

  const [draft, setDraft] = useState<null | {
    id?: string;
    name: string;
    description: string;
    coverImageUrl: string;
    sortOrder: number;
  }>(null);

  function newDraft() {
    setDraft({
      name: "",
      description: "",
      coverImageUrl: "",
      sortOrder: 0,
    });
  }

  async function onSave() {
    if (!draft) return;

    if (draft.id) {
      update.mutate({
        id: draft.id,
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        coverImageUrl: draft.coverImageUrl.trim() || undefined,
        sortOrder: draft.sortOrder,
      });
      return;
    }

    create.mutate({
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      coverImageUrl: draft.coverImageUrl.trim() || undefined,
      sortOrder: draft.sortOrder,
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-white/60">
          {isLoading ? "加载中…" : `共 ${categories.length} 个分类`}
        </div>
        <button
          onClick={newDraft}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          新建分类
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-2xl" />
              <div className="absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-amber-200/10 blur-2xl" />
            </div>

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/category/${c.id}`} className="flex-1 hover:text-cyan-300">
                  <div className="text-lg font-semibold tracking-tight">{c.name}</div>
                  {c.description ? (
                    <div className="mt-1 line-clamp-2 text-sm text-white/60">
                      {c.description}
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-white/40">没有描述</div>
                  )}
                </Link>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                  {formatCount(c.itemCount)}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Link href={`/category/${c.id}`} className="text-xs text-white/45 hover:text-cyan-300">
                  查看物品 →
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setDraft({
                        id: c.id,
                        name: c.name,
                        description: c.description ?? "",
                        coverImageUrl: c.coverImageUrl ?? "",
                        sortOrder: c.sortOrder,
                      })
                    }
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定删除分类"${c.name}"吗？\n\n注意：如果分类下有物品，将无法删除。`)) {
                        remove.mutate({ id: c.id });
                      }
                    }}
                    disabled={remove.isPending}
                    className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs text-rose-100"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!isLoading && categories.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:col-span-2 lg:col-span-3">
            还没有分类。先创建一个，然后开始录入物品。
          </div>
        ) : null}
      </div>

      {draft ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setDraft(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold">{draft.id ? "编辑分类" : "新建分类"}</div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <div className="mb-1 text-xs text-white/60">名称 *</div>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="例如：电子产品"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">描述</div>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="分类描述（可选）"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">封面图片 URL</div>
                <input
                  value={draft.coverImageUrl}
                  onChange={(e) => setDraft({ ...draft, coverImageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg（可选）"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">排序</div>
                <input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
                  min={0}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />
                <div className="mt-1 text-xs text-white/45">数字越小越靠前</div>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDraft(null)}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80"
              >
                取消
              </button>
              <button
                onClick={onSave}
                disabled={create.isPending || update.isPending || !draft.name.trim()}
                className={clsx(
                  "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black",
                  (create.isPending || update.isPending || !draft.name.trim()) && "opacity-60",
                )}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

