"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

type Tab = "base" | "comments" | "more";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full px-4 py-2 text-sm",
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

export function ItemDetailClient({ id }: { id: string }) {
  const item = trpc.items.get.useQuery({ id });
  const [tab, setTab] = useState<Tab>("base");

  const images = useMemo(() => item.data?.images ?? [], [item.data?.images]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/items" className="text-sm text-white/60 hover:text-white">
          ← 返回物品总览
        </Link>
        <Link
          href={`/item/${id}/edit`}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          编辑
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="relative h-56 bg-black/20">
          {images.length ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0]!.url}
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_20%_-20%,rgba(34,211,238,0.22),transparent_60%),radial-gradient(800px_300px_at_80%_120%,rgba(253,230,138,0.16),transparent_60%)]" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-xs text-white/70">物品</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {item.data?.name ?? "加载中…"}
            </h1>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === "base"} onClick={() => setTab("base")}>
              基础信息
            </TabButton>
            <TabButton active={tab === "comments"} onClick={() => setTab("comments")}>
              评论
            </TabButton>
            <TabButton active={tab === "more"} onClick={() => setTab("more")}>
              更多信息
            </TabButton>
          </div>

          <div className="mt-5">
            {tab === "base" ? <BaseInfo id={id} /> : null}
            {tab === "comments" ? <Comments id={id} /> : null}
            {tab === "more" ? <MoreInfo id={id} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BaseInfo({ id }: { id: string }) {
  const item = trpc.items.get.useQuery({ id });
  const data = item.data;

  const accessories =
    ((data as unknown as { accessories?: Array<{ id: string }> })?.accessories as
      | Array<{
          id: string;
          name: string;
          coverImage?: { url: string; width: number | null; height: number | null } | null;
          category?: { id: string; name: string } | null;
        }>
      | undefined) ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data?.parent ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
          <div className="text-xs text-white/60">所属物品</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white/90">{data.parent.name}</div>
              <div className="mt-1 text-xs text-white/55">本物品为其配件</div>
            </div>
            <Link
              href={`/item/${data.parent.id}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
            >
              查看
            </Link>
          </div>
        </div>
      ) : null}

      {accessories.length ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">配件</div>
            <div className="text-xs text-white/45">{accessories.length} 个</div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {accessories.map((a) => (
              <Link
                key={a.id}
                href={`/item/${a.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/5"
              >
                <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {a.coverImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImage.url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white/90">{a.name}</div>
                  <div className="mt-0.5 text-xs text-white/55">
                    {a.category?.name ?? "未分类"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <InfoCard label="状态" value={data?.statusValue ?? "—"} />
      <InfoCard label="获取方式" value={data?.acquireMethodValue ?? "—"} />
      <InfoCard label="价格（分）" value={data ? String(data.price) : "—"} />
      <InfoCard label="星级" value={data ? String(data.rating) : "—"} />
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
        <div className="text-xs text-white/60">备注</div>
        <div className="mt-2 whitespace-pre-wrap text-sm text-white/80">
          {data?.note ?? "—"}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-2 text-sm text-white/85">{value}</div>
    </div>
  );
}

function Comments({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const list = trpc.comments.listByItem.useQuery({ itemId: id, limit: 20 });
  const create = trpc.comments.create.useMutation({
    onSuccess: async () => {
      setContent("");
      await utils.comments.listByItem.invalidate({ itemId: id, limit: 20 });
    },
  });

  return (
    <div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs text-white/60">新增评论</div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
          rows={3}
          placeholder="写点什么…"
        />
        <button
          disabled={create.isPending || content.trim().length === 0}
          onClick={() => create.mutate({ itemId: id, content: content.trim() })}
          className={clsx(
            "mt-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black",
            (create.isPending || content.trim().length === 0) && "opacity-60",
          )}
        >
          发送
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {(list.data?.comments ?? []).map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/50">{new Date(c.createdAt).toLocaleString()}</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">{c.content}</div>
            {c.replies?.length ? (
              <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
                {c.replies.map((r) => (
                  <div key={r.id} className="text-sm text-white/75">
                    <div className="text-xs text-white/45">{new Date(r.createdAt).toLocaleString()}</div>
                    <div className="mt-1 whitespace-pre-wrap">{r.content}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function MoreInfo({ id }: { id: string }) {
  const item = trpc.items.get.useQuery({ id });
  const templates = item.data?.templates ?? [];

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <div key={t.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60">{t.templateGroupSnapshot}</div>
          <div className="mt-1 font-medium">{t.templateNameSnapshot}</div>
          <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
            {JSON.stringify(t.values, null, 2)}
          </pre>
        </div>
      ))}
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          暂无更多信息模板。
        </div>
      ) : null}
    </div>
  );
}
