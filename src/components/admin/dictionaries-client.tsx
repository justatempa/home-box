"use client";

import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function DictionariesClient() {
  const utils = trpc.useUtils();
  const list = trpc.dictionaries.list.useQuery();
  const upsert = trpc.dictionaries.upsert.useMutation({
    onSuccess: async () => {
      await utils.dictionaries.list.invalidate();
    },
  });
  const itemUpsert = trpc.dictionaries.itemsUpsert.useMutation({
    onSuccess: async () => {
      await utils.dictionaries.list.invalidate();
      setItemDraft(null);
    },
  });

  const dicts = useMemo(() => list.data ?? [], [list.data]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const [itemDraft, setItemDraft] = useState<null | {
    dictionaryId: string;
    value: string;
    label: string;
  }>(null);

  return (
    <div>
      <div className="mb-5">
        <div className="text-xs text-white/60">管理后台</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">字典管理</h1>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-medium">新建/更新字典</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CODE (e.g. ITEM_STATUS)"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => upsert.mutate({ code: code.trim(), name: name.trim() })}
            disabled={upsert.isPending || code.trim().length === 0 || name.trim().length === 0}
            className={clsx(
              "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black",
              (upsert.isPending || code.trim().length === 0 || name.trim().length === 0) && "opacity-60",
            )}
          >
            保存
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {dicts.map((d) => (
          <div key={d.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-white/50">{d.code}</div>
                <div className="mt-1 text-sm font-medium">{d.name}</div>
              </div>
              <button
                onClick={() => setItemDraft({ dictionaryId: d.id, value: "", label: "" })}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                添加条目
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {d.items.map((it) => (
                <div
                  key={it.id}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75"
                >
                  <div className="font-semibold">{it.label}</div>
                  <div className="mt-1 text-white/50">{it.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {itemDraft ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220] p-5">
            <div className="text-sm font-semibold">添加/更新字典条目</div>
            <div className="mt-3 grid gap-2">
              <input
                value={itemDraft.value}
                onChange={(e) => setItemDraft({ ...itemDraft, value: e.target.value })}
                placeholder="value (stable)"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
              />
              <input
                value={itemDraft.label}
                onChange={(e) => setItemDraft({ ...itemDraft, label: e.target.value })}
                placeholder="label (display)"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setItemDraft(null)}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80"
              >
                取消
              </button>
              <button
                onClick={() =>
                  itemUpsert.mutate({
                    dictionaryId: itemDraft.dictionaryId,
                    value: itemDraft.value.trim(),
                    label: itemDraft.label.trim(),
                    sortOrder: 0,
                    isActive: true,
                  })
                }
                disabled={
                  itemUpsert.isPending ||
                  itemDraft.value.trim().length === 0 ||
                  itemDraft.label.trim().length === 0
                }
                className={clsx(
                  "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black",
                  (itemUpsert.isPending ||
                    itemDraft.value.trim().length === 0 ||
                    itemDraft.label.trim().length === 0) && "opacity-60",
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

