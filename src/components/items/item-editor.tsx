"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ItemFormValues } from "@/components/items/item-form-types";
import { trpc } from "@/utils/trpc";
import { UploadButton } from "@/components/upload/upload-button";
import { ParentItemPicker } from "@/components/items/parent-item-picker";

type TemplateFieldType = "text" | "number" | "select" | "date" | "boolean";
type TemplateField = {
  key: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  options?: string[];
};

type TemplateSchema = TemplateField[];

type TemplateInstance = {
  id: string;
  templateGroupSnapshot: string;
  templateNameSnapshot: string;
  schemaSnapshot: unknown;
  values: unknown;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      {subtitle ? <div className="text-xs text-white/60">{subtitle}</div> : null}
      <div className="mt-1 text-lg font-semibold">{title}</div>
    </div>
  );
}

function IconExpand({ className }: { className?: string }) {
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
      <path d="M9 5H5v4" />
      <path d="M5 5l6 6" />
      <path d="M15 19h4v-4" />
      <path d="M19 19l-6-6" />
      <path d="M15 5h4v4" />
      <path d="M19 5l-6 6" />
      <path d="M9 19H5v-4" />
      <path d="M5 19l6-6" />
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

export function ItemEditor({
  mode,
  itemId,
  initialValues,
  saving,
  onSave,
  onDelete,
}: {
  mode: "create" | "edit";
  itemId: string | null;
  initialValues: ItemFormValues;
  saving: boolean;
  onSave: (values: ItemFormValues) => Promise<string>;
  onDelete?: () => Promise<void>;
}) {
  const utils = trpc.useUtils();
  const categories = trpc.categories.list.useQuery();
  const dictionaries = trpc.dictionaries.list.useQuery();

  const tags = trpc.tags.list.useQuery();
  const tagsCreate = trpc.tags.create.useMutation({
    onSuccess: async () => {
      await utils.tags.list.invalidate();
    },
  });

  const item = itemId ? trpc.items.get.useQuery({ id: itemId }) : null;

  const parentItem = useMemo(() => {
    const p = (item?.data as unknown as {
      parent?: {
        id: string;
        name: string;
        coverImage?: { url: string; width: number | null; height: number | null } | null;
        category?: { id: string; name: string } | null;
      } | null;
    })?.parent;
    if (!p) return null;
    return p;
  }, [item?.data]);

  const setCover = trpc.items.setCover.useMutation({
    onSuccess: async () => {
      if (!itemId) return;
      await utils.items.get.invalidate({ id: itemId });
      await utils.items.list.invalidate();
    },
  });
  const addImage = trpc.items.imagesAdd.useMutation({
    onSuccess: async () => {
      if (!itemId) return;
      await utils.items.get.invalidate({ id: itemId });
      await utils.items.list.invalidate();
    },
  });
  const removeImage = trpc.items.imagesRemove.useMutation({
    onSuccess: async () => {
      if (!itemId) return;
      await utils.items.get.invalidate({ id: itemId });
      await utils.items.list.invalidate();
    },
  });

  const setParent = trpc.items.setParent.useMutation({
    onSuccess: async () => {
      if (!itemId) return;
      await utils.items.get.invalidate({ id: itemId });
      await utils.items.list.invalidate();
    },
  });

  const setTags = trpc.items.tagsSet.useMutation({
    onSuccess: async () => {
      if (!itemId) return;
      await utils.items.get.invalidate({ id: itemId });
    },
  });

  const templates = trpc.templates.list.useQuery();
  const upsertItemTemplate = trpc.itemTemplates.upsert.useMutation({
    onSuccess: async () => {
      if (!itemId) return;
      await utils.items.get.invalidate({ id: itemId });
    },
  });
  const removeItemTemplate = trpc.itemTemplates.remove.useMutation({
    onSuccess: async () => {
      if (!itemId) return;
      await utils.items.get.invalidate({ id: itemId });
    },
  });

  const statusDict = useMemo(
    () => dictionaries.data?.find((d) => d.code === "ITEM_STATUS") ?? null,
    [dictionaries.data],
  );
  const acquireDict = useMemo(
    () => dictionaries.data?.find((d) => d.code === "ACQUIRE_METHOD") ?? null,
    [dictionaries.data],
  );

  const [values, setValues] = useState<ItemFormValues>(initialValues);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const initialTagIds = useMemo(
    () => (item?.data?.tags?.map((t) => t.tagId).filter(Boolean) as string[]) ?? [],
    [item?.data?.tags],
  );
  const [tagIds, setTagIdsState] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");

  const canMutateChild = mode === "edit" && !!itemId;

  // keep local tagIds in sync after fetch
  useEffect(() => {
    if (!canMutateChild) return;
    setTagIdsState(initialTagIds);
  }, [canMutateChild, initialTagIds]);

  async function saveBase() {
    const id = await onSave(values);
    return id;
  }

  // keep local values.parentId in sync after fetch
  useEffect(() => {
    if (!canMutateChild) return;
    const pid = (item?.data as unknown as { parentId?: string | null })?.parentId ?? null;
    setValues((prev) => ({ ...prev, parentId: pid }));
  }, [canMutateChild, item?.data]);

  return (
    <div>
      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[90vh] max-w-[92vw] overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="max-h-[90vh] max-w-[92vw] object-contain" />
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 p-2 text-white/80 backdrop-blur transition hover:bg-black/60 hover:text-white"
              aria-label="关闭"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={mode === "create" ? "/items" : `/item/${itemId}`}
          className="text-sm text-white/60 hover:text-white"
        >
          返回
        </Link>
        <div className="flex items-center gap-2">
          {mode === "edit" && onDelete ? (
            <button
              onClick={() => onDelete()}
              className="rounded-full border border-rose-300/20 bg-rose-300/10 px-4 py-2 text-sm text-rose-100 hover:bg-rose-300/15"
            >
              删除
            </button>
          ) : null}
          <button
            disabled={saving || values.name.trim().length === 0}
            onClick={async () => {
              const id = await saveBase();
              if (mode === "create") {
                // parent will redirect
                return;
              }
              await utils.items.get.invalidate({ id });
            }}
            className={clsx(
              "rounded-full bg-white px-4 py-2 text-sm font-semibold text-black",
              (saving || values.name.trim().length === 0) && "opacity-60",
            )}
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <SectionTitle title={mode === "create" ? "新建物品" : "编辑物品"} subtitle="基础信息" />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <div className="mb-1 text-xs text-white/60">名称</div>
                <input
                  value={values.name}
                  onChange={(e) => setValues({ ...values, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="例如：MacBook Pro / 相机 / 电饭煲"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">分类</div>
                <select
                  value={values.categoryId ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, categoryId: e.target.value ? e.target.value : null })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                >
                  <option value="">未分类</option>
                  {(categories.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="sm:col-span-2">
                {!canMutateChild ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                    请先保存物品，再设置配件归属。
                  </div>
                ) : (
                  <ParentItemPicker
                    itemId={itemId}
                    value={parentItem}
                    onChange={(picked) => {
                      setValues({ ...values, parentId: picked ? picked.id : null });
                      if (!itemId) return;
                      setParent.mutate({ id: itemId, parentId: picked ? picked.id : null });
                    }}
                  />
                )}
              </div>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">入库日期</div>
                <input
                  type="date"
                  value={values.inboundAt}
                  onChange={(e) => setValues({ ...values, inboundAt: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">状态</div>
                <select
                  value={values.statusValue ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, statusValue: e.target.value ? e.target.value : null })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                >
                  <option value="">—</option>
                  {(statusDict?.items ?? []).map((it) => (
                    <option key={it.id} value={it.value}>
                      {it.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">获取方式</div>
                <select
                  value={values.acquireMethodValue ?? ""}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      acquireMethodValue: e.target.value ? e.target.value : null,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                >
                  <option value="">—</option>
                  {(acquireDict?.items ?? []).map((it) => (
                    <option key={it.id} value={it.value}>
                      {it.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">价格（分）</div>
                <input
                  type="number"
                  min={0}
                  value={values.price}
                  onChange={(e) => setValues({ ...values, price: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-white/60">星级</div>
                <select
                  value={String(values.rating)}
                  onChange={(e) => setValues({ ...values, rating: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                >
                  {[0, 1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={values.isFavorite}
                  onChange={(e) => setValues({ ...values, isFavorite: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-black/20"
                />
                <span className="text-sm text-white/80">收藏</span>
              </label>

              <label className="block sm:col-span-2">
                <div className="mb-1 text-xs text-white/60">备注</div>
                <textarea
                  rows={4}
                  value={values.note}
                  onChange={(e) => setValues({ ...values, note: e.target.value })}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <SectionTitle title="图片" subtitle="图库" />
            {!canMutateChild ? (
              <div className="text-sm text-white/60">请先保存基础信息，再上传图片。</div>
            ) : (
              <div>
                <UploadButton
                  label="上传物品图片"
                  onUploaded={(url) => addImage.mutate({ itemId: itemId!, url })}
                />
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(item?.data?.images ?? []).map((img) => (
                    <div
                      key={img.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(img.url)}
                        className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/35 text-white/80 opacity-0 shadow-lg backdrop-blur transition hover:bg-black/55 hover:text-white group-hover:opacity-100"
                        aria-label="查看大图"
                        title="查看大图"
                      >
                        <IconExpand className="h-[18px] w-[18px]" />
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setCover.mutate({ itemId: itemId!, imageId: img.id })}
                          className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-black"
                        >
                          设为封面
                        </button>
                        <button
                          onClick={() => removeImage.mutate({ id: img.id })}
                          className="rounded-full border border-rose-300/20 bg-rose-300/10 px-2 py-1 text-[11px] text-rose-100"
                        >
                          删除
                        </button>
                      </div>
                      {item?.data?.coverImageId === img.id ? (
                        <div className="absolute left-2 top-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[11px] text-amber-100">
                          封面
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <SectionTitle title="标签" subtitle="筛选" />
            {!canMutateChild ? (
              <div className="text-sm text-white/60">请先保存基础信息，再设置标签。</div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="新标签名"
                    className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={() => tagsCreate.mutate({ name: newTagName.trim() })}
                    disabled={tagsCreate.isPending || newTagName.trim().length === 0}
                    className={clsx(
                      "rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black",
                      (tagsCreate.isPending || newTagName.trim().length === 0) && "opacity-60",
                    )}
                  >
                    添加
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(tags.data ?? []).map((t) => {
                    const active = (tagIds ?? []).includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          const next = active
                            ? (tagIds ?? []).filter((x) => x !== t.id)
                            : [...(tagIds ?? []), t.id];
                          setTagIdsState(next);
                        }}
                        className={clsx(
                          "rounded-full border px-3 py-1 text-xs",
                          active
                            ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                            : "border-white/10 bg-black/20 text-white/80 hover:bg-white/10",
                        )}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setTags.mutate({ itemId: itemId!, tagIds: tagIds ?? [] })}
                  disabled={setTags.isPending}
                  className={clsx(
                    "mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10",
                    setTags.isPending && "opacity-60",
                  )}
                >
                  保存标签
                </button>
                <div className="mt-2 text-xs text-white/45">
                  提示：标签保存后会写入快照（改名不影响历史展示）。
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <SectionTitle title="模板实例" subtitle="更多信息" />
            {!canMutateChild ? (
              <div className="text-sm text-white/60">请先保存基础信息，再添加模板。</div>
            ) : (
              <div>
                <div className="text-xs text-white/55">添加模板</div>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                  defaultValue=""
                  onChange={(e) => {
                    const tplId = e.target.value;
                    if (!tplId) return;
                    const tpl = (templates.data ?? []).find((t) => t.id === tplId);
                    if (!tpl) return;

                    const schema = tpl.schema as unknown as TemplateSchema;
                    const values: Record<string, unknown> = {};
                    for (const f of schema) values[f.key] = "";
                    upsertItemTemplate.mutate({
                      itemId: itemId!,
                      templateId: tplId,
                      templateGroupSnapshot: tpl.templateGroup,
                      templateNameSnapshot: tpl.templateName,
                      schemaSnapshot: schema,
                      values: values as Record<string, unknown>,
                    });
                    e.currentTarget.value = "";
                  }}
                >
                  <option value="">选择模板…</option>
                  {(templates.data ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.templateGroup} / {t.templateName}
                    </option>
                  ))}
                </select>

                <div className="mt-4 space-y-3">
                  {((item?.data?.templates ?? []) as unknown as TemplateInstance[]).map((inst) => (
                    <TemplateInstanceEditor
                      key={inst.id}
                      instance={inst}
                      onSave={(nextValues) =>
                        upsertItemTemplate.mutate({
                          itemId: itemId!,
                          instanceId: inst.id,
                          templateGroupSnapshot: inst.templateGroupSnapshot,
                          templateNameSnapshot: inst.templateNameSnapshot,
                          schemaSnapshot: inst.schemaSnapshot ?? undefined,
                          values: nextValues as Record<string, unknown>,
                        })
                      }
                      onRemove={() => removeItemTemplate.mutate({ id: inst.id })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateInstanceEditor({
  instance,
  onSave,
  onRemove,
}: {
  instance: TemplateInstance;
  onSave: (values: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const schema = (instance.schemaSnapshot ?? []) as unknown as TemplateSchema;
  const [values, setValues] = useState<Record<string, unknown>>(
    () => (instance.values ?? {}) as Record<string, unknown>,
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">{instance.templateGroupSnapshot}</div>
          <div className="mt-1 text-sm font-semibold">{instance.templateNameSnapshot}</div>
        </div>
        <button
          onClick={onRemove}
          className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs text-rose-100"
        >
          移除
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        {schema.length === 0 ? (
          <div className="text-sm text-white/60">无 schema 快照，显示为 JSON。</div>
        ) : null}
        {schema.map((f) => (
          <label key={f.key} className="block">
            <div className="mb-1 text-xs text-white/60">{f.label}</div>
            {f.type === "select" ? (
              <select
                value={String(values[f.key] ?? "")}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
              >
                <option value="">—</option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : f.type === "boolean" ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(values[f.key])}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })}
                />
                <span className="text-sm text-white/80">是</span>
              </label>
            ) : (
              <input
                value={(values[f.key] as string | number | undefined | null) ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
              />
            )}
          </label>
        ))}
      </div>

      <button
        onClick={() => onSave(values)}
        className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
      >
        保存此模板
      </button>
    </div>
  );
}

