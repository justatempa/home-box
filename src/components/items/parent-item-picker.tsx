"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

function IconPlug({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 2v6" />
      <path d="M15 2v6" />
      <path d="M12 17v5" />
      <path d="M8 8h8" />
      <path d="M7 8v4a5 5 0 0 0 10 0V8" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

type PickedItem = {
  id: string;
  name: string;
  coverImage?: { url: string; width: number | null; height: number | null } | null;
  category?: { id: string; name: string } | null;
};

export function ParentItemPicker({
  itemId,
  value,
  onChange,
}: {
  itemId?: string | null;
  value: PickedItem | null;
  onChange: (next: PickedItem | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const list = trpc.items.list.useQuery(
    {
      limit: 20,
      q: q.trim().length ? q.trim() : undefined,
      excludeId: itemId ?? undefined,
      orderBy: "updatedAt",
      orderDir: "desc",
    },
    { enabled: open },
  );

  const options = useMemo(() => list.data?.items ?? [], [list.data?.items]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">所属物品</div>
          <div className="mt-1 text-sm text-white/75">设为配件后，会出现在父物品的配件列表里。</div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          {value ? "更换" : "选择"}
        </button>
      </div>

      {value ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {value.coverImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value.coverImage.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-white/45">
                  <IconPlug className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white/90">{value.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/55">
                <span>{value.category?.name ?? "未分类"}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">父物品</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/item/${value.id}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
            >
              查看
            </Link>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs text-rose-100"
            >
              解绑
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
          当前不是任何物品的配件。
        </div>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-xs text-white/60">配件归属</div>
                <div className="mt-1 text-sm font-semibold">选择父物品</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQ("");
                }}
                className="rounded-full border border-white/10 bg-black/20 p-2 text-white/70 hover:bg-white/10"
                aria-label="关闭"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索物品名称…"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
              />

              <div className="mt-3 max-h-[55vh] overflow-auto rounded-2xl border border-white/10 bg-black/20">
                {list.isLoading ? (
                  <div className="p-4 text-sm text-white/60">加载中…</div>
                ) : options.length ? (
                  <div className="divide-y divide-white/10">
                    {options.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          onChange(it as unknown as PickedItem);
                          setOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                      >
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          {it.coverImage?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.coverImage.url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-white/45">
                              <IconPlug className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white/90">{it.name}</div>
                          <div className="mt-0.5 text-xs text-white/55">
                            {it.category?.name ?? "未分类"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-white/60">没有匹配的物品。</div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                  }}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
