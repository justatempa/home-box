"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";
import type { ItemFormValues } from "@/components/items/item-form-types";
import { ItemEditor } from "@/components/items/item-editor";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ItemEditClient({ id }: { id: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const item = trpc.items.get.useQuery({ id });
  const update = trpc.items.update.useMutation({
    onSuccess: async () => {
      await utils.items.get.invalidate({ id });
      await utils.items.list.invalidate();
    },
  });
  const remove = trpc.items.remove.useMutation({
    onSuccess: async () => {
      await utils.items.list.invalidate();
      router.replace("/items");
    },
  });

  const initial: ItemFormValues | null = useMemo(() => {
    if (!item.data) return null;
    return {
      name: item.data.name,
      categoryId: item.data.categoryId ?? null,
      parentId: (item.data as unknown as { parentId?: string | null }).parentId ?? null,
      inboundAt: toISODate(new Date(item.data.inboundAt)),
      statusValue: item.data.statusValue ?? null,
      acquireMethodValue: item.data.acquireMethodValue ?? null,
      price: item.data.price,
      isFavorite: item.data.isFavorite,
      rating: item.data.rating,
      note: item.data.note ?? "",
    };
  }, [item.data]);

  const [saving, setSaving] = useState(false);

  if (item.isLoading || !initial) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
        加载中…
      </div>
    );
  }

  return (
    <ItemEditor
      mode="edit"
      itemId={id}
      initialValues={initial}
      saving={saving || update.isPending}
      onSave={async (values) => {
        setSaving(true);
        try {
          await update.mutateAsync({
            id,
            name: values.name,
            categoryId: values.categoryId,
            inboundAt: new Date(values.inboundAt),
            statusValue: values.statusValue,
            acquireMethodValue: values.acquireMethodValue,
            price: values.price,
            isFavorite: values.isFavorite,
            rating: values.rating,
            note: values.note,
          });
          return id;
        } finally {
          setSaving(false);
        }
      }}
      onDelete={async () => {
        await remove.mutateAsync({ id });
      }}
    />
  );
}
