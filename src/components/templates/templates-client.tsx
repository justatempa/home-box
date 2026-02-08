"use client";

import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";

type FieldType = "text" | "number" | "select" | "date" | "boolean";
type FieldDraft = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string;
};

type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
      {children}
    </span>
  );
}

export function TemplatesClient() {
  const utils = trpc.useUtils();
  const list = trpc.templates.list.useQuery();
  const create = trpc.templates.create.useMutation({
    onSuccess: async () => {
      await utils.templates.list.invalidate();
      setDraft(null);
    },
  });
  const update = trpc.templates.update.useMutation({
    onSuccess: async () => {
      await utils.templates.list.invalidate();
      setDraft(null);
    },
  });
  const remove = trpc.templates.remove.useMutation({
    onSuccess: async () => {
      await utils.templates.list.invalidate();
    },
  });

  const templates = useMemo(() => list.data ?? [], [list.data]);

  const [draft, setDraft] = useState<null | {
    id?: string;
    templateGroup: string;
    templateName: string;
    fields: FieldDraft[];
  }>(null);

  function newDraft() {
    setDraft({
      templateGroup: "",
      templateName: "",
      fields: [{ key: "", label: "", type: "text", required: false }],
    });
  }

  function toTemplateFields(schema: unknown): TemplateField[] {
    const arr = Array.isArray(schema) ? schema : [];
    return arr.map((row) => {
      const rec = (row && typeof row === "object" ? (row as Record<string, unknown>) : {}) as Record<
        string,
        unknown
      >;

      const typeRaw = rec.type;
      const type: FieldType =
        typeRaw === "text" ||
        typeRaw === "number" ||
        typeRaw === "select" ||
        typeRaw === "date" ||
        typeRaw === "boolean"
          ? typeRaw
          : "text";

      const options = Array.isArray(rec.options)
        ? rec.options.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        : undefined;

      return {
        key: typeof rec.key === "string" ? rec.key : "",
        label: typeof rec.label === "string" ? rec.label : "",
        type,
        required: rec.required === true,
        options,
      };
    });
  }

  function getFieldLabel(field: unknown) {
    const rec = field && typeof field === "object" ? (field as Record<string, unknown>) : {};
    const label = typeof rec.label === "string" ? rec.label.trim() : "";
    const key = typeof rec.key === "string" ? rec.key.trim() : "";
    return label || key || "字段";
  }

  function toFieldDrafts(schema: unknown): FieldDraft[] {
    return toTemplateFields(schema).map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      required: f.required,
      options: f.options?.join(",") ?? "",
    }));
  }

  async function onSave() {
    if (!draft) return;
    const schema = draft.fields
      .filter((f) => f.key.trim() && f.label.trim())
      .map((f) => ({
        key: f.key.trim(),
        label: f.label.trim(),
        type: f.type,
        required: f.required,
        options:
          f.type === "select"
            ? (f.options ?? "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            : undefined,
      }));

    if (draft.id) {
      update.mutate({
        id: draft.id,
        templateGroup: draft.templateGroup.trim(),
        templateName: draft.templateName.trim(),
        schema,
      });
      return;
    }

    create.mutate({
      templateGroup: draft.templateGroup.trim(),
      templateName: draft.templateName.trim(),
      schema,
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">配置</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">模板管理</h1>
          <div className="mt-2 text-xs text-white/50">
            模板用于“更多属性”。物品应用模板后会写入快照，后续模板变更/删除不影响已存在的实例。
          </div>
        </div>

        <button
          onClick={newDraft}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          新建模板
        </button>
      </div>

      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-white/55">{t.templateGroup}</div>
                <div className="mt-1 text-lg font-semibold">{t.templateName}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {toTemplateFields(t.schema)
                    .slice(0, 6)
                    .map((f, idx) => (
                      <Chip key={idx}>{getFieldLabel(f)}</Chip>
                    ))}
                  {toTemplateFields(t.schema).length > 6 ? <Chip>…</Chip> : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setDraft({
                      id: t.id,
                      templateGroup: t.templateGroup,
                      templateName: t.templateName,
                      fields: toFieldDrafts(t.schema),
                    })
                  }
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                >
                  编辑
                </button>
                <button
                  onClick={() => remove.mutate({ id: t.id })}
                  disabled={remove.isPending}
                  className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-xs text-rose-100"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
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
            <div className="text-sm font-semibold">{draft.id ? "编辑模板" : "新建模板"}</div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-xs text-white/60">Group</div>
                <input
                  value={draft.templateGroup}
                  onChange={(e) => setDraft({ ...draft, templateGroup: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs text-white/60">Name</div>
                <input
                  value={draft.templateName}
                  onChange={(e) => setDraft({ ...draft, templateName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>

            <div className="mt-5">
              <div className="text-xs text-white/60">Schema</div>
              <div className="mt-2 space-y-2">
                {draft.fields.map((f, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 sm:grid-cols-12"
                  >
                    <input
                      value={f.key}
                      onChange={(e) => {
                        const next = [...draft.fields];
                        next[idx] = { ...next[idx], key: e.target.value };
                        setDraft({ ...draft, fields: next });
                      }}
                      placeholder="key"
                      className="sm:col-span-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                    />
                    <input
                      value={f.label}
                      onChange={(e) => {
                        const next = [...draft.fields];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setDraft({ ...draft, fields: next });
                      }}
                      placeholder="label"
                      className="sm:col-span-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => {
                        const next = [...draft.fields];
                        next[idx] = { ...next[idx], type: e.target.value as FieldType };
                        setDraft({ ...draft, fields: next });
                      }}
                      className="sm:col-span-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                    >
                      <option value="text">text</option>
                      <option value="number">number</option>
                      <option value="select">select</option>
                      <option value="date">date</option>
                      <option value="boolean">boolean</option>
                    </select>

                    <label className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => {
                          const next = [...draft.fields];
                          next[idx] = { ...next[idx], required: e.target.checked };
                          setDraft({ ...draft, fields: next });
                        }}
                      />
                      必填
                    </label>

                    {f.type === "select" ? (
                      <input
                        value={f.options ?? ""}
                        onChange={(e) => {
                          const next = [...draft.fields];
                          next[idx] = { ...next[idx], options: e.target.value };
                          setDraft({ ...draft, fields: next });
                        }}
                        placeholder="options: a,b,c"
                        className="sm:col-span-12 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"
                      />
                    ) : null}

                    <div className="sm:col-span-12 flex justify-end">
                      <button
                        onClick={() => {
                          const next = draft.fields.filter((_, i) => i !== idx);
                          setDraft({ ...draft, fields: next.length ? next : [{ key: "", label: "", type: "text", required: false }] });
                        }}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                      >
                        删除字段
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  setDraft({
                    ...draft,
                    fields: [...draft.fields, { key: "", label: "", type: "text", required: false }],
                  })
                }
                className="mt-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                添加字段
              </button>
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
                disabled={create.isPending || update.isPending}
                className={clsx(
                  "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black",
                  (create.isPending || update.isPending) && "opacity-60",
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
