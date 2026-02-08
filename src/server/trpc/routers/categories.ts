import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, idSchema, imageUrlSchema, protectedProcedure } from "@/server/trpc/trpc";

const categoryInput = z.object({
  name: z.string().trim().min(1).max(64),
  description: z.string().trim().max(500).optional(),
  coverImageUrl: z.string().trim().url().optional(),
  sortOrder: z.number().int().min(0).max(1_000_000).default(0),
});

export const categoriesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const ownerId = ctx.session!.user!.id;
    const categories = await ctx.prisma.category.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { items: { where: { deletedAt: null }, select: { id: true } } },
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      itemCount: c.items.length,
    }));
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    const category = await ctx.prisma.category.findFirst({
      where: { id: input.id, ownerId, deletedAt: null },
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!category) throw new TRPCError({ code: "NOT_FOUND" });
    return category;
  }),

  create: protectedProcedure.input(categoryInput).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    return await ctx.prisma.category.create({
      data: {
        ownerId,
        name: input.name,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
        sortOrder: input.sortOrder,
      },
    });
  }),

  update: protectedProcedure
    .input(z.object({ id: idSchema }).merge(categoryInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const category = await ctx.prisma.category.findFirst({
        where: { id: input.id, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!category) throw new TRPCError({ code: "NOT_FOUND" });

      return await ctx.prisma.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          coverImageUrl: input.coverImageUrl,
          sortOrder: input.sortOrder,
        },
      });
    }),

  remove: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session!.user!.id;
    const usedCount = await ctx.prisma.item.count({
      where: { ownerId, categoryId: input.id, deletedAt: null },
    });
    if (usedCount > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete category that is still used by items",
      });
    }
    await ctx.prisma.category.updateMany({
      where: { id: input.id, ownerId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }),

  imagesAdd: protectedProcedure
    .input(
      z.object({
        categoryId: idSchema,
        url: imageUrlSchema,
        sortOrder: z.number().int().min(0).max(1_000_000).optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const category = await ctx.prisma.category.findFirst({
        where: { id: input.categoryId, ownerId, deletedAt: null },
        select: { id: true },
      });
      if (!category) throw new TRPCError({ code: "NOT_FOUND" });
      return await ctx.prisma.categoryImage.create({
        data: {
          ownerId,
          categoryId: input.categoryId,
          url: input.url,
          sortOrder: input.sortOrder ?? 0,
          width: input.width,
          height: input.height,
        },
      });
    }),

  imagesReorder: protectedProcedure
    .input(z.object({ categoryId: idSchema, orderedIds: z.array(idSchema).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      const images = await ctx.prisma.categoryImage.findMany({
        where: { ownerId, categoryId: input.categoryId, deletedAt: null },
        select: { id: true },
      });
      const existing = new Set(images.map((i) => i.id));
      for (const id of input.orderedIds) {
        if (!existing.has(id)) throw new TRPCError({ code: "BAD_REQUEST" });
      }

      await ctx.prisma.$transaction(
        input.orderedIds.map((id, idx) =>
          ctx.prisma.categoryImage.update({
            where: { id },
            data: { sortOrder: idx },
          }),
        ),
      );
      return { ok: true };
    }),

  imagesRemove: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session!.user!.id;
      await ctx.prisma.categoryImage.updateMany({
        where: { id: input.id, ownerId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { ok: true };
    }),
});
