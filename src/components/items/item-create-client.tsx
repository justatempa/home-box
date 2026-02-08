"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";
import type { ItemFormValues } from "@/components/items/item-form-types";
import { ItemEditor } from "@/components/items/item-editor";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ItemCreateClient() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const create = trpc.items.create.useMutation({
    onSuccess: async (created) => {
      await utils.items.list.invalidate();
      router.replace(`/item/${created.id}/edit`);
    },
  });

  const initial: ItemFormValues = useMemo(
    () => ({
      name: "",
      categoryId: null,
      parentId: null,
      inboundAt: todayISO(),
      statusValue: null,
      acquireMethodValue: null,
      price: 0,
      isFavorite: false,
      rating: 0,
      note: "",
    }),
    [],
  );

  const [saving, setSaving] = useState(false);

  return (
    <ItemEditor
      mode="create"
      itemId={null}
      initialValues={initial}
      saving={saving || create.isPending}
      onSave={async (values) => {
        setSaving(true);
        try {
          const created = await create.mutateAsync({
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
          return created.id;
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
