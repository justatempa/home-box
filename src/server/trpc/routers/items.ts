import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, idSchema, imageUrlSchema, protectedProcedure } from "@/server/trpc/trpc";

const itemInput = z.object({
  name: z.string().trim().min(1).max(128),
  categoryId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  parentId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  inboundAt: z.coerce.date().optional(),
  statusValue: z
    .string()
    .trim()
    .max(64)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  acquireMethodValue: z
    .string()
    .trim()
    .max(64)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  price: z.number().int().min(0).max(2_000_000_000).default(0),
  isFavorite: z.boolean().default(false),
  rating: z.number().int().min(0).max(5).default(0),
  note: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  tagNamesSnapshot: z.array(z.string().trim().min(1).max(32)).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
});

async function resolveParentId({
  ctx,
  ownerId,
  itemId,
  parentId,
}: {
  ctx: {
    prisma: {
      item: {
        findFirst: (args: unknown) => Promise<{ id: string; parentId: string | null } | null>;
      };
    };
  };
  ownerId: string;
  itemId?: string;
  parentId: string | null | undefined;
}) {
  if (parentId === undefined) return undefined;
  if (parentId === null) return null;
  if (itemId && parentId === itemId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Item cannot be its own parent" });
  }

  const parent = await ctx.prisma.item.findFirst({
    where: { id: parentId, ownerId, deletedAt: null },
    select: { id: true, parentId: true },
  });
  if (!parent) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid parentId" });
  }

  // Cycle check (walk up the parent chain).
  if (itemId) {
    let cur: { id: string; parentId: string | null } | null = parent;
    for (let depth = 0; depth < 30 && cur?.parentId; depth++) {
      if (cur.parentId === itemId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Circular parent relation" });
      }
      cur = await ctx.prisma.item.findFirst({
        where: { id: cur.parentId, ownerId, deletedAt: null },
        select: { id: true, parentId: true },
      });
      if (!cur) break;
    }
  }

  return parentId;
}

const listInput = z.object({
  cursor: z.string().nullish(),
  limit: z.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(100).optional(),
  excludeId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  statusValue: z.string().min(1).optional(),
  isFavorite: z.boolean().optional(),
  minRating: z.number().int().min(0).max(5).optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  inboundFrom: z.coerce.date().optional(),
  inboundTo: z.coerce.date().optional(),
  tagId: z.string().min(1).optional(),
  orderBy: z
    .enum(["updatedAt", "inboundAt", "price", "rating"])
    .default("updatedAt"),
  orderDir: z.enum(["asc", "desc"]).default("desc"),
});

type ItemOrderField = "updatedAt" | "inboundAt" | "price" | "rating";

export const itemsRouter = createTRPCRouter({
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;

    const where = {
      ownerId,
      deletedAt: null,
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      ...(input.q
        ? {
            name: { contains: input.q },
          }
        : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.statusValue ? { statusValue: input.statusValue } : {}),
      ...(input.isFavorite !== undefined ? { isFavorite: input.isFavorite } : {}),
      ...(input.minRating !== undefined ? { rating: { gte: input.minRating } } : {}),
      ...(input.priceMin !== undefined || input.priceMax !== undefined
        ? {
            price: {
              ...(input.priceMin !== undefined ? { gte: input.priceMin } : {}),
              ...(input.priceMax !== undefined ? { lte: input.priceMax } : {}),
            },
          }
        : {}),
      ...(input.inboundFrom || input.inboundTo
        ? {
            inboundAt: {
              ...(input.inboundFrom ? { gte: input.inboundFrom } : {}),
              ...(input.inboundTo ? { lte: input.inboundTo } : {}),
            },
          }
        : {}),
      ...(input.tagId
        ? {
            tags: {
              some: {
                tagId: input.tagId,
                deletedAt: null,
              },
            },
          }
        : {}),
    };

    // cursor pagination: use (orderByField, id) tuple
    const orderField: ItemOrderField = input.orderBy;
    const orderDir = input.orderDir;
    const cursor = input.cursor
      ? await ctx.prisma.item.findFirst({
          where: { id: input.cursor, ownerId, deletedAt: null },
          select: { id: true, updatedAt: true, inboundAt: true, price: true, rating: true },
        })
      : null;

    const cursorClause = cursor
      ? {
          OR: [
            {
              [orderField]: {
                [orderDir === "desc" ? "lt" : "gt"]: cursor[orderField],
              },
            },
            {
              AND: [
                { [orderField]: cursor[orderField] },
                { id: { [orderDir === "desc" ? "lt" : "gt"]: cursor.id } },
              ],
            },
          ],
        }
      : {};

    const rows = await ctx.prisma.item.findMany({
      where: { ...where, ...cursorClause },
      take: input.limit + 1,
      orderBy: [{ [orderField]: orderDir }, { id: orderDir }],
      select: {
        id: true,
        name: true,
        categoryId: true,
        parentId: true,
        inboundAt: true,
        statusValue: true,
        price: true,
        isFavorite: true,
        rating: true,
        updatedAt: true,
        coverImage: {
          select: { id: true, url: true, width: true, height: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    let nextCursor: string | null = null;
    let items = rows;
    if (rows.length > input.limit) {
      const next = rows.pop()!;
      nextCursor = next.id;
      items = rows;
    }

    return { items, nextCursor };
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    const item = await ctx.prisma.item.findFirst({
      where: { id: input.id, ownerId, deletedAt: null },
      include: {
        images: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        tags: { where: { deletedAt: null }, include: { tag: true } },
        templates: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        parent: {
          select: {
            id: true,
            name: true,
            coverImage: { select: { url: true, width: true, height: true } },
            category: { select: { id: true, name: true } },
          },
        },
        accessories: {
          where: { deletedAt: null },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            parentId: true,
            coverImage: { select: { url: true, width: true, height: true } },
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!item) throw new TRPCError({ code: "NOT_FOUND" });
    return item;
  }),

  create: protectedProcedure.input(itemInput).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;

    // Validate categoryId if provided
    if (input.categoryId) {
      const category = await ctx.prisma.category.findFirst({
        where: { id: input.categoryId, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!category) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid categoryId" });
      }
    }

    const parentId = await resolveParentId({
      ctx,
      ownerId,
      parentId: input.parentId,
    });

    const createData = {
      ownerId,
      name: input.name,
      categoryId: input.categoryId ?? null,
      parentId: parentId ?? null,
      inboundAt: input.inboundAt ?? new Date(),
      statusValue: input.statusValue ?? null,
      acquireMethodValue: input.acquireMethodValue ?? null,
      price: input.price,
      isFavorite: input.isFavorite,
      rating: input.rating,
      note: input.note ?? null,
      tagNamesSnapshot: input.tagNamesSnapshot ?? [],
    };

    console.log("Creating item with data:", JSON.stringify(createData, null, 2));

    const created = await ctx.prisma.item.create({
      data: createData,
    });

    if (input.tagIds?.length) {
      const tags = await ctx.prisma.tag.findMany({
        where: { ownerId, id: { in: input.tagIds }, deletedAt: null },
        select: { id: true, name: true },
      });
      await ctx.prisma.itemTag.createMany({
        data: tags.map((t) => ({
          ownerId,
          itemId: created.id,
          tagId: t.id,
          tagNameSnapshot: t.name,
        })),
      });

      await ctx.prisma.tag.updateMany({
        where: { ownerId, id: { in: tags.map((t) => t.id) } },
        data: { usageCount: { increment: 1 } },
      });
    }

    return created;
  }),

  update: protectedProcedure
    .input(z.object({ id: idSchema }).merge(itemInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const exists = await ctx.prisma.item.findFirst({
        where: { id: input.id, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!exists) throw new TRPCError({ code: "NOT_FOUND" });

      const parentId = await resolveParentId({
        ctx,
        ownerId,
        itemId: input.id,
        parentId: input.parentId,
      });

      const updated = await ctx.prisma.item.update({
        where: { id: input.id },
        data: {
          name: input.name,
          categoryId: input.categoryId ?? undefined,
          parentId: parentId === undefined ? undefined : parentId,
          inboundAt: input.inboundAt,
          statusValue: input.statusValue ?? undefined,
          acquireMethodValue: input.acquireMethodValue ?? undefined,
          price: input.price,
          isFavorite: input.isFavorite,
          rating: input.rating,
          note: input.note ?? undefined,
          tagNamesSnapshot: input.tagNamesSnapshot ? input.tagNamesSnapshot : undefined,
        },
      });

      // For simplicity in v1: tags update via separate endpoint (to avoid complex diffing here)
      return updated;
    }),

  setParent: protectedProcedure
    .input(z.object({ id: idSchema, parentId: idSchema.nullable() }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const item = await ctx.prisma.item.findFirst({
        where: { id: input.id, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const parentId = await resolveParentId({
        ctx,
        ownerId,
        itemId: input.id,
        parentId: input.parentId,
      });

      await ctx.prisma.item.update({
        where: { id: input.id },
        data: { parentId: parentId ?? null },
        select: { id: true },
      });
      return { ok: true };
    }),

  remove: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    await ctx.prisma.item.updateMany({
      where: { id: input.id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }),

  imagesAdd: protectedProcedure
    .input(
      z.object({
        itemId: idSchema,
        url: imageUrlSchema,
        sortOrder: z.number().int().min(0).max(1_000_000).optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        setAsCover: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const image = await ctx.prisma.itemImage.create({
        data: {
          ownerId,
          itemId: input.itemId,
          url: input.url,
          sortOrder: input.sortOrder ?? 0,
          width: input.width,
          height: input.height,
        },
      });

      if (input.setAsCover) {
        await ctx.prisma.item.update({
          where: { id: input.itemId },
          data: { coverImageId: image.id },
        });
      }

      return image;
    }),

  imagesReorder: protectedProcedure
    .input(z.object({ itemId: idSchema, orderedIds: z.array(idSchema).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const images = await ctx.prisma.itemImage.findMany({
        where: { ownerId, itemId: input.itemId, deletedAt: null },
        select: { id: true },
      });
      const existing = new Set(images.map((i) => i.id));
      for (const id of input.orderedIds) {
        if (!existing.has(id)) throw new TRPCError({ code: "BAD_REQUEST" });
      }

      await ctx.prisma.$transaction(
        input.orderedIds.map((id, idx) =>
          ctx.prisma.itemImage.update({ where: { id }, data: { sortOrder: idx } }),
        ),
      );
      return { ok: true };
    }),

  imagesRemove: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      await ctx.prisma.itemImage.updateMany({
        where: { id: input.id, ownerId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { ok: true };
    }),

  setCover: protectedProcedure
    .input(z.object({ itemId: idSchema, imageId: idSchema.nullable() }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.imageId) {
        const image = await ctx.prisma.itemImage.findFirst({
          where: { id: input.imageId, ownerId, itemId: input.itemId, deletedAt: null },
          select: { id: true },
        });
        if (!image) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image" });
      }

      return await ctx.prisma.item.update({
        where: { id: input.itemId },
        data: { coverImageId: input.imageId },
        select: { id: true, coverImageId: true },
      });
    }),

  tagsSet: protectedProcedure
    .input(z.object({ itemId: idSchema, tagIds: z.array(idSchema) }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const item = await ctx.prisma.item.findFirst({
        where: { id: input.itemId, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const tags = input.tagIds.length
        ? await ctx.prisma.tag.findMany({
            where: { ownerId, id: { in: input.tagIds }, deletedAt: null },
            select: { id: true, name: true },
          })
        : [];

      const tagIdsFound = new Set(tags.map((t) => t.id));
      for (const id of input.tagIds) {
        if (!tagIdsFound.has(id)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid tag" });
        }
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.itemTag.updateMany({
          where: { ownerId, itemId: input.itemId, deletedAt: null },
          data: { deletedAt: new Date() },
        });

        if (tags.length) {
          await tx.itemTag.createMany({
            data: tags.map((t) => ({
              ownerId,
              itemId: input.itemId,
              tagId: t.id,
              tagNameSnapshot: t.name,
            })),
          });

          await tx.tag.updateMany({
            where: { ownerId, id: { in: tags.map((t) => t.id) } },
            data: { usageCount: { increment: 1 } },
          });
        }

        await tx.item.update({
          where: { id: input.itemId },
          data: { tagNamesSnapshot: tags.map((t) => t.name) },
          select: { id: true },
        });
      });

      return { ok: true };
    }),
});
